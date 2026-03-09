/* ============================================================
   EDUADMIN — pages-dashboard.js
   Dashboard page: metrics, activity feed, alerts
   ============================================================ */

'use strict';

function renderDashboardPage() {
  const user = Auth.getCurrentUser();
  const metrics = DashboardRepository.getMetrics();
  const activity = DashboardRepository.getRecentActivity();
  const alerts = DashboardRepository.getActiveAlerts();

  const canCreateAnalytic = Auth.canEditAnalytic();

  // Stat cards
  const statCards = [
    {
      variant: 'blue', icon: 'file-text',
      value: metrics.totalEnProceso,
      label: 'Analíticos en proceso',
      delta: null
    },
    {
      variant: 'green', icon: 'check-circle',
      value: metrics.aprobadosMes,
      label: 'Aprobados',
      delta: { text: 'este período', type: 'positive' }
    },
    {
      variant: 'amber', icon: 'alert-triangle',
      value: metrics.conProblemas,
      label: 'Devueltos para corregir',
      delta: metrics.conProblemas > 0 ? { text: 'requieren atención', type: 'warning' } : null
    },
    {
      variant: 'navy', icon: 'users',
      value: metrics.totalAlumnos,
      label: 'Alumnos registrados',
      delta: null
    }
  ];

  const cardsHtml = statCards.map(card => `
    <div class="stat-card stat-${card.variant}">
      <div class="stat-card-accent"></div>
      <div class="stat-card-icon"><i data-lucide="${card.icon}"></i></div>
      <div class="stat-value">${card.value}</div>
      <div class="stat-label">${escapeHtml(card.label)}</div>
      ${card.delta ? `<div class="stat-delta ${card.delta.type}">
        <i data-lucide="${card.delta.type === 'positive' ? 'trending-up' : card.delta.type === 'warning' ? 'alert-circle' : 'minus'}"></i>
        ${escapeHtml(card.delta.text)}
      </div>` : ''}
    </div>`).join('');

  // Activity feed
  const activityHtml = activity.length ? activity.map(entry => {
    const actor = getUserById(entry.user_id);
    const analytic = MOCK_DB.analytics.find(a => a.id === entry.analytic_id);
    const student = analytic ? getStudentById(analytic.student_id) : null;
    const name = actor ? actor.full_name : 'Sistema';
    const initials = getInitials(name);

    return `
      <div class="activity-item">
        <div class="activity-avatar" style="background:linear-gradient(135deg, var(--color-blue), var(--color-blue-mid))">
          ${escapeHtml(initials)}
        </div>
        <div class="activity-content">
          <div class="activity-text">
            <strong>${escapeHtml(name)}</strong> · ${escapeHtml(entry.action)}
            ${student ? `· <a href="#" onclick="Router.navigate('analiticos/${escapeHtml(entry.analytic_id)}');return false" style="font-weight:600">${escapeHtml(student.full_name)}</a>` : ''}
          </div>
          <div class="activity-meta">
            ${timeAgo(entry.created_at)}
            ${entry.new_status ? ' · ' + renderStatusChip(entry.new_status) : ''}
          </div>
        </div>
      </div>`;
  }).join('') : renderEmptyState('activity', 'Sin actividad reciente', 'Los movimientos del equipo aparecerán aquí.');

  // Alerts panel
  const alertsHtml = alerts.length ? alerts.map(alert => `
    <div class="alert-item ${alert.isUrgent ? 'urgent' : ''}"
         onclick="Router.navigate('analiticos/${alert.analytic.id}')">
      <div class="alert-icon"><i data-lucide="${alert.isUrgent ? 'alert-circle' : 'clock'}"></i></div>
      <div class="alert-content">
        <div class="alert-title">${escapeHtml(alert.student ? alert.student.full_name : '—')}</div>
        <div class="alert-sub">
          ${renderStatusChip(alert.analytic.status)} · ${alert.isUrgent ? 'Requiere corrección' : 'Pendiente de aprobación'}
        </div>
      </div>
      <i data-lucide="chevron-right" style="color:var(--text-muted);width:16px;height:16px;flex-shrink:0"></i>
    </div>`).join('')
    : `<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px">
        <i data-lucide="check-circle" style="width:24px;height:24px;margin:0 auto 8px;display:block;color:var(--color-green)"></i>
        Sin alertas activas
       </div>`;

  const greeting = getGreeting(user.full_name.split(' ')[0]);

  return `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title">${escapeHtml(greeting)}</div>
        <div class="page-subtitle">${new Intl.DateTimeFormat('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}</div>
      </div>
      ${canCreateAnalytic ? `
        <button class="btn btn-primary" onclick="Router.navigate('analiticos/nuevo')">
          <i data-lucide="plus"></i> Nuevo analítico
        </button>` : ''}
    </div>

    <div class="stats-grid">
      ${cardsHtml}
    </div>

    <div class="dashboard-grid">
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i data-lucide="activity" style="display:inline;vertical-align:middle;margin-right:8px;width:18px;height:18px"></i>Actividad reciente</span>
          <a href="#" onclick="Router.navigate('analiticos');return false" style="font-size:12px;font-weight:600">Ver todos →</a>
        </div>
        <div class="card-body" style="padding:0 24px">
          <div class="activity-feed" id="activity-feed">
            ${activityHtml}
          </div>
        </div>
      </div>

      <div class="card" style="align-self:start">
        <div class="card-header">
          <span class="card-title">
            <i data-lucide="bell" style="display:inline;vertical-align:middle;margin-right:8px;width:18px;height:18px"></i>
            Alertas activas
          </span>
          ${alerts.length ? `<span class="chip chip-returned">${alerts.length}</span>` : ''}
        </div>
        <div class="card-body" style="padding:16px">
          ${alertsHtml}
        </div>
      </div>
    </div>`;
}

function getGreeting(firstName) {
  const h = new Date().getHours();
  const saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  return `${saludo}, ${firstName} 👋`;
}

// ============================================================
// NOTIFICATIONS PAGE
// ============================================================
function renderNotificationsPage() {
  const feed = MOCK_DB.activity_feed;

  if (!feed || feed.length === 0) {
    return renderEmptyState('bell-off', 'No hay notificaciones', 'Actualmente no tienes notificaciones recientes.');
  }

  const itemsHtml = feed.map(n => `
        <div class="card" style="margin-bottom: var(--sp-3); padding: var(--sp-4); cursor: pointer; transition: transform var(--t-fast)" ${n.route ? `onclick="Router.navigate('${n.route}')"` : ''}>
            <div style="display: flex; gap: var(--sp-4); align-items: flex-start;">
                <div class="notif-icon" style="background: var(--bg-hover); width: 40px; height: 40px; border-radius: var(--r-full); display: flex; align-items: center; justify-content: center; color: var(--color-blue); flex-shrink: 0;">
                    <i data-lucide="${n.icon || 'bell'}"></i>
                </div>
                <div>
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${escapeHtml(n.text)}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">${timeAgo(n.timestamp)} — ${new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</div>
                </div>
            </div>
        </div>
    `).join('');

  return `
    <div style="max-width: 600px; margin: 0 auto;">
        <h2 style="font-family: var(--font-display); font-size: 20px; color: var(--text-primary); margin-bottom: var(--sp-6);">Todas las Notificaciones</h2>
        ${itemsHtml}
    </div>
    `;
}
