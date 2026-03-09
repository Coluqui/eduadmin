/* ============================================================
   EDUADMIN — layout.js
   Sidebar · Header · AppLayout wrapper
   ============================================================ */

'use strict';

// ============================================================
// SIDEBAR
// ============================================================

function renderSidebar(activeRoute) {
  const user = Auth.getCurrentUser();
  if (!user) return '';

  const navItems = NAV_ITEMS
    .filter(item => item.roles.includes(user.role))
    .map(item => {
      const isActive = activeRoute === item.id;
      // Count pending items for badges
      let badge = '';
      if (item.id === 'analiticos' && Auth.canApproveAnalytic()) {
        const pending = MOCK_DB.analytics.filter(a => a.status === STATUS.EN_REVISION).length;
        if (pending > 0) badge = `<span class="sidebar-nav-badge">${pending}</span>`;
      }
      if (item.id === 'analiticos' && Auth.canEditAnalytic()) {
        const devueltos = MOCK_DB.analytics.filter(a => a.status === STATUS.DEVUELTO).length;
        if (devueltos > 0) badge = `<span class="sidebar-nav-badge" style="background:var(--color-amber)">${devueltos}</span>`;
      }

      return `
        <div class="sidebar-nav-item ${isActive ? 'active' : ''}"
             onclick="Router.navigate('${item.id}')"
             title="${escapeHtml(item.label)}">
          <i data-lucide="${item.icon}"></i>
          <span>${escapeHtml(item.label)}</span>
          ${badge}
        </div>`;
    }).join('');

  const institution = MOCK_DB.institution;

  return `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-logo">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M3 17L11 5L19 17H3Z" fill="white" fill-opacity="0.95"/>
            <rect x="7" y="13" width="8" height="2.5" rx="1.25" fill="white" fill-opacity="0.7"/>
          </svg>
        </div>
        <div class="sidebar-brand-text">
          <div class="sidebar-appname">EduAdmin</div>
          <div class="sidebar-school" title="${escapeHtml(institution.full_name)}">${escapeHtml(institution.name)}</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="sidebar-section-label">Menú</div>
        ${navItems}
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user" onclick="showLogoutConfirm()" title="Cerrar sesión">
          <div class="sidebar-avatar" style="overflow:hidden">
            ${user.avatar_url
      ? `<img src="${user.avatar_url}" style="width:100%;height:100%;object-fit:cover">`
      : escapeHtml(getInitials(user.full_name))}
          </div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${escapeHtml(user.full_name)}</div>
            <div class="sidebar-user-role">${escapeHtml(ROLE_LABELS[user.role])}</div>
          </div>
          <div class="sidebar-footer-icons" style="display:flex; flex-direction:column; gap:8px">
            <i data-lucide="user" style="color:rgba(255,255,255,0.4);width:15px;height:15px"></i>
            <i data-lucide="log-out" style="color:rgba(255,255,255,0.4);width:15px;height:15px"></i>
          </div>
        </div>
      </div>
    </aside>`;
}

// ============================================================
// HEADER
// ============================================================

function renderHeader(title, subtitle) {
  const user = Auth.getCurrentUser();
  if (!user) return '';
  const theme = AppState.get('theme');
  const thumbIcon = theme === 'dark' ? 'moon' : 'sun';

  const alertsCount = MOCK_DB.analytics.filter(a =>
    a.status === STATUS.DEVUELTO || a.status === STATUS.EN_REVISION
  ).length;

  return `
    <header class="header">
      <div class="header-left">
        <button class="header-mobile-toggle" onclick="toggleMobileMenu()" title="Menú">
          <i data-lucide="menu"></i>
        </button>
        <div class="header-title">
          ${escapeHtml(title)}
          ${subtitle ? `<span class="header-subtitle"> — ${escapeHtml(subtitle)}</span>` : ''}
        </div>
      </div>
      <div class="header-actions">
        <!-- Theme Toggle Switch -->
        <div class="theme-switch" onclick="toggleTheme()" id="theme-toggle-switch">
          <div class="theme-switch-thumb">
            <i data-lucide="${thumbIcon}"></i>
          </div>
          <div class="theme-switch-icons">
            <i data-lucide="sun"></i>
            <i data-lucide="moon"></i>
          </div>
        </div>

        <button class="header-icon-btn" title="Notificaciones" onclick="toggleNotifications(event)">
          <i data-lucide="bell"></i>
          ${alertsCount > 0 ? '<span class="notif-dot"></span>' : ''}
        </button>
        <div id="notif-panel" class="notif-panel hidden">
          <div class="notif-header">
            <span>Notificaciones</span>
            <button class="icon-btn sm" onclick="toggleNotifications(event)"><i data-lucide="x"></i></button>
          </div>
          <div class="notif-list">
            ${MOCK_DB.activity_feed.slice(0, 5).map(n => `
              <div class="notif-item" ${n.route ? `onclick="Router.navigate('${n.route}'); toggleNotifications(event)" style="cursor:pointer"` : ''}>
                <div class="notif-icon"><i data-lucide="${n.icon || 'bell'}"></i></div>
                <div class="notif-content">
                  <div class="notif-text">${escapeHtml(n.text)}</div>
                  <div class="notif-time">${timeAgo(n.timestamp)} — ${new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="notif-footer">
            <a href="#" onclick="Router.navigate('notificaciones'); toggleNotifications(event)">Ver todas</a>
          </div>
        </div>

        <div class="header-user-pill" onclick="showLogoutConfirm()">
          <div class="header-avatar" style="overflow:hidden">
            ${user.avatar_url
      ? `<img src="${user.avatar_url}" style="width:100%;height:100%;object-fit:cover">`
      : `<i data-lucide="user" style="width:14px;height:14px;color:white"></i>`}
          </div>
          <span class="header-user-name">${escapeHtml(user.full_name.split(' ')[0])}</span>
          ${renderRoleBadge(user.role)}
          <i data-lucide="chevron-down" style="width:14px;height:14px;color:var(--text-muted)"></i>
        </div>
      </div>
    </header>`;
}

function toggleNotifications(e) {
  if (e) e.stopPropagation();
  const panel = document.getElementById('notif-panel');
  if (panel) {
    panel.classList.toggle('hidden');
    try {
      if (window.lucide) window.lucide.createIcons({ el: panel });
    } catch (e) {
      console.warn('Notification icons could not be initialized:', e);
    }
  }
}

// ============================================================
// APP LAYOUT
// ============================================================

function renderLayout(pageContent, options) {
  options = options || {};
  const { title, subtitle, route } = options;
  return `
    <div class="app-layout">
      <div class="sidebar-overlay" id="sidebar-overlay" onclick="closeMobileMenu()"></div>
      ${renderSidebar(route || '')}
      <div class="main-content-wrapper">
        ${renderHeader(title || 'EduAdmin', subtitle)}
        <main class="main-content">
          ${pageContent}
        </main>
      </div>
    </div>`;
}

// ============================================================
// MOBILE MENU LOGIC
// ============================================================

function toggleMobileMenu() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar && overlay) {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    if (sidebar.classList.contains('active')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
}

function closeMobileMenu() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar && overlay) {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}
