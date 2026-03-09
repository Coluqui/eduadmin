/* ============================================================
   EDUADMIN — components.js
   Reusable UI component renderers
   ============================================================ */

'use strict';

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

let _toastTimer = null;

function showToast(type, title, message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };
    const icon = icons[type] || 'info';

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
    <div class="toast-icon"><i data-lucide="${icon}"></i></div>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(title)}</div>
      ${message ? `<div class="toast-msg">${escapeHtml(message)}</div>` : ''}
    </div>
  `;

    container.appendChild(toast);
    if (typeof lucide !== 'undefined') lucide.createIcons({ el: toast });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = '0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ============================================================
// STATUS CHIP
// ============================================================

function renderStatusChip(status) {
    const label = STATUS_LABELS[status] || status;
    const cssClass = STATUS_CSS_CLASS[status] || 'chip-draft';
    return `<span class="chip ${cssClass}">${escapeHtml(label)}</span>`;
}

// ============================================================
// ROLE BADGE
// ============================================================

function renderRoleBadge(role) {
    const label = ROLE_LABELS[role] || role;
    return `<span class="role-badge ${role}">${escapeHtml(label)}</span>`;
}

// ============================================================
// AVATAR
// ============================================================

function renderAvatar(name, size) {
    const sz = size || 34;
    const initials = getInitials(name);
    return `<div class="sidebar-avatar" style="width:${sz}px;height:${sz}px;font-size:${Math.floor(sz * 0.38)}px">${escapeHtml(initials)}</div>`;
}

// ============================================================
// EMPTY STATE
// ============================================================

function renderEmptyState(icon, title, subtitle, actionHtml) {
    return `
    <div class="empty-state">
      <div class="empty-state-icon"><i data-lucide="${icon}"></i></div>
      <div class="empty-title">${escapeHtml(title)}</div>
      <div class="empty-sub">${escapeHtml(subtitle)}</div>
      ${actionHtml || ''}
    </div>`;
}

// ============================================================
// LOADING SKELETONS
// ============================================================

function renderTableSkeleton(rows) {
    rows = rows || 5;
    let html = '';
    for (let i = 0; i < rows; i++) {
        html += `<div class="skeleton-row">
      <div class="skeleton" style="width:40px;height:40px;border-radius:8px;flex-shrink:0"></div>
      <div style="flex:1">
        <div class="skeleton" style="height:14px;width:60%;margin-bottom:6px"></div>
        <div class="skeleton" style="height:11px;width:40%"></div>
      </div>
      <div class="skeleton" style="width:80px;height:22px;border-radius:99px"></div>
      <div class="skeleton" style="width:100px;height:12px"></div>
    </div>`;
    }
    return html;
}

function renderStatCardSkeleton() {
    return `<div class="card" style="padding:24px">
    <div class="skeleton" style="height:40px;width:40px;border-radius:10px;margin-bottom:16px"></div>
    <div class="skeleton" style="height:36px;width:60%;margin-bottom:8px"></div>
    <div class="skeleton" style="height:14px;width:80%"></div>
  </div>`;
}

// ============================================================
// HISTORY PANEL
// ============================================================

function renderHistoryList(analyticId) {
    const entries = AnalyticRepository.getHistoryByAnalyticId(analyticId);
    if (!entries.length) {
        return `<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px">Sin historial registrado.</div>`;
    }

    const dotClass = {
        borrador: 'created',
        en_revision: '',
        devuelto: 'returned',
        aprobado: 'approved',
        enviado: 'sent'
    };
    const dotIcon = {
        borrador: 'plus',
        en_revision: 'eye',
        devuelto: 'rotate-ccw',
        aprobado: 'check',
        enviado: 'send'
    };

    return entries.map(entry => {
        const user = getUserById(entry.user_id);
        const dc = dotClass[entry.new_status] || '';
        const di = dotIcon[entry.new_status] || 'circle';
        const obsHtml = entry.observation
            ? `<div class="history-obs">"${escapeHtml(entry.observation)}"</div>`
            : '';
        return `
      <div class="history-entry">
        <div class="history-dot ${dc}"><i data-lucide="${di}"></i></div>
        <div class="history-content">
          <div class="history-action">${escapeHtml(entry.action)}</div>
          <div class="history-who">${escapeHtml(user ? user.full_name : 'Sistema')} · ${timeAgo(entry.created_at)}</div>
          ${obsHtml}
        </div>
      </div>`;
    }).join('');
}

// ============================================================
// ANALYTIC DETAIL PANEL (right column)
// ============================================================

function renderAnalyticPanel(analytic) {
    const student = getStudentById(analytic.student_id);
    const createdBy = getUserById(analytic.created_by);
    const assignedTo = getUserById(analytic.assigned_to);
    const user = Auth.getCurrentUser();

    const allowedNext = ANALYTIC_TRANSITIONS[analytic.status] || [];

    let actionButtons = '';
    if (analytic.status !== STATUS.ENVIADO) {
        if (Auth.canEditAnalytic()) {
            if (analytic.status === STATUS.BORRADOR || analytic.status === STATUS.DEVUELTO) {
                actionButtons += `
          <button class="btn btn-secondary w-full mb-4" onclick="saveAnalyticDraft('${analytic.id}')">
            <i data-lucide="save"></i> Guardar borrador
          </button>
          <button class="btn btn-primary w-full" onclick="submitAnalyticForReview('${analytic.id}')">
            <i data-lucide="send"></i> Enviar a revisión
          </button>`;
            }
            if (analytic.status === STATUS.APROBADO) {
                actionButtons += `
          <button class="btn btn-success w-full" onclick="sendAnalyticToSinide('${analytic.id}')">
            <i data-lucide="external-link"></i> Marcar como enviado a SInIDE
          </button>`;
            }
        }
        if (Auth.canApproveAnalytic()) {
            if (analytic.status === STATUS.EN_REVISION) {
                actionButtons += `
          <button class="btn btn-success w-full mb-3" onclick="approveAnalytic('${analytic.id}')">
            <i data-lucide="check-circle"></i> Aprobar analítico
          </button>
          <button class="btn btn-warning w-full" onclick="showReturnModal('${analytic.id}')">
            <i data-lucide="rotate-ccw"></i> Devolver con observación
          </button>`;
            }
        }
    } else {
        actionButtons = `<div class="banner banner-success" style="margin:0"><i data-lucide="check-circle"></i> Enviado a SInIDE/ReFE</div>`;
    }

    const historyEntries = renderHistoryList(analytic.id);

    return `
    <div class="detail-panel">
      <div class="detail-panel-section" style="text-align:center;padding:24px 20px">
        <div style="margin-bottom:12px">${renderStatusChip(analytic.status)}</div>
        <div style="font-size:17px;font-weight:800;color:var(--text-primary);font-family:var(--font-display)">${escapeHtml(student ? student.full_name : '—')}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px">DNI ${escapeHtml(student ? student.dni : '—')} · ${escapeHtml(student ? student.curso : '—')}</div>
      </div>

      <div class="detail-panel-section">
        <div class="detail-panel-label">Información del trámite</div>
        <div class="detail-meta-row">
          <span class="detail-meta-icon"><i data-lucide="user"></i></span>
          <span class="detail-meta-key">Confeccionado por</span>
          <span class="detail-meta-val">${escapeHtml(createdBy ? createdBy.full_name : '—')}</span>
        </div>
        <div class="detail-meta-row">
          <span class="detail-meta-icon"><i data-lucide="user-check"></i></span>
          <span class="detail-meta-key">Asignado a</span>
          <span class="detail-meta-val">${escapeHtml(assignedTo ? assignedTo.full_name : '—')}</span>
        </div>
        <div class="detail-meta-row">
          <span class="detail-meta-icon"><i data-lucide="calendar"></i></span>
          <span class="detail-meta-key">Creado</span>
          <span class="detail-meta-val">${formatDate(analytic.created_at)}</span>
        </div>
        <div class="detail-meta-row">
          <span class="detail-meta-icon"><i data-lucide="clock"></i></span>
          <span class="detail-meta-key">Modificado</span>
          <span class="detail-meta-val">${timeAgo(analytic.updated_at)}</span>
        </div>
      </div>

      ${actionButtons ? `<div class="detail-panel-section">${actionButtons}</div>` : ''}

      <div class="detail-panel-section">
        <div class="detail-panel-label" style="margin-bottom:12px">
          Historial de cambios
          <span style="font-size:10px;color:var(--text-muted);font-weight:400;margin-left:4px">(inmutable)</span>
        </div>
        <div class="history-list" style="padding:0">
          ${historyEntries}
        </div>
      </div>
    </div>`;
}

// ============================================================
// GRADES ACCORDION
// ============================================================

function renderGradesAccordion(grades, editable) {
    const years = Object.keys(grades).sort();
    const subjects = ['matematica', 'lengua', 'historia', 'fisica', 'quimica', 'ingles', 'ed_fisica', 'tecnologia'];
    const subjectLabels = {
        matematica: 'Matemática', lengua: 'Lengua y Literatura',
        historia: 'Historia', fisica: 'Física',
        quimica: 'Química', ingles: 'Inglés',
        ed_fisica: 'Educación Física', tecnologia: 'Tecnología'
    };

    return years.map((year, idx) => {
        const avg = gradeAverage(grades[year]);
        const rows = subjects.map(sub => {
            const val = grades[year][sub];
            if (editable) {
                const isError = val !== null && val !== undefined && val !== '' && (Number(val) < 1 || Number(val) > 10);
                const errorClass = isError ? ' is-error' : (val ? ' is-valid' : '');
                return `
          <div class="grade-subject">${escapeHtml(subjectLabels[sub])}</div>
          <div>
            <input type="number" min="1" max="10"
              class="grade-input${errorClass}"
              value="${val !== null && val !== undefined ? val : ''}"
              placeholder="—"
              data-year="${year}" data-subject="${sub}"
              oninput="validateGradeInput(this)"
            >
          </div>
          <div class="grade-avg">${val ? '<span style="color:var(--text-secondary)">' + val + '</span>' : '<span style="color:var(--text-muted)">—</span>'}</div>`;
            } else {
                const display = val !== null && val !== undefined ? val : '—';
                return `
          <div class="grade-subject">${escapeHtml(subjectLabels[sub])}</div>
          <div></div>
          <div class="grade-avg" style="font-weight:600">${display}</div>`;
            }
        }).join('');

        return `
      <div class="accordion-item ${idx === 0 ? 'open' : ''}" id="acc-${year}">
        <div class="accordion-header" onclick="toggleAccordion('acc-${year}')">
          <div class="accordion-header-left">
            <div>
              <div class="accordion-title">Año lectivo ${year}</div>
              <div class="accordion-sub">${subjects.length} materias · Promedio: ${avg || '—'}</div>
            </div>
          </div>
          <div class="accordion-chevron"><i data-lucide="chevron-down"></i></div>
        </div>
        <div class="accordion-body">
          <div class="grades-grid-header">
            <span>Materia</span><span></span><span style="text-align:center">Calificación</span>
          </div>
          <div class="grades-grid">${rows}</div>
        </div>
      </div>`;
    }).join('');
}

// ============================================================
// MODAL HELPERS
// ============================================================

function showModal(html) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-overlay';
    overlay.innerHTML = html;
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    document.body.appendChild(overlay);
    if (typeof lucide !== 'undefined') lucide.createIcons({ el: overlay });
    bindModalHandlers();
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.remove();
}

function bindModalHandlers() {
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
}

// ============================================================
// RETURN MODAL (Director devuelve con observación)
// ============================================================

function showReturnModal(analyticId) {
    const html = `
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="rotate-ccw" style="display:inline;vertical-align:middle;margin-right:8px"></i>Devolver con observación</div>
        <button class="modal-close" data-close-modal><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div class="banner banner-warning" style="margin-bottom:16px">
          <i data-lucide="alert-triangle"></i>
          El analítico volverá a estado <strong>Devuelto</strong>. La secretaria podrá corregirlo y re-enviarlo.
        </div>
        <div class="form-group">
          <label class="form-label">Observación <span class="required">*</span></label>
          <textarea id="return-observation" class="form-textarea" rows="4"
            placeholder="Describí claramente qué debe corrregirse antes de aprobar..."></textarea>
          <div class="form-hint">La observación quedará registrada en el historial y será visible para toda la institución.</div>
          <div id="return-obs-error" class="form-error-msg hidden">
            <i data-lucide="alert-circle"></i> La observación es obligatoria antes de devolver.
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button class="btn btn-warning" onclick="confirmReturn('${analyticId}')">
          <i data-lucide="rotate-ccw"></i> Confirmar devolución
        </button>
      </div>
    </div>`;
    showModal(html);
}
