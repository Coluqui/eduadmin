/* ============================================================
   EDUADMIN — pages-analytics.js
   Analytics list · Analytics detail · Analytics new (wizard)
   ============================================================ */

'use strict';

// ============================================================
// ANALYTICS LIST
// ============================================================

function renderAnalyticsListPage() {
  const user = Auth.getCurrentUser();
  const canCreate = Auth.canEditAnalytic();
  const analytics = AnalyticRepository.getAll();

  const statusOptions = ['all', 'borrador', 'en_revision', 'devuelto', 'aprobado', 'enviado'];
  const optionsHtml = statusOptions.map(s =>
    `<option value="${s}">${s === 'all' ? 'Todos los estados' : escapeHtml(STATUS_LABELS[s])}</option>`
  ).join('');

  const tableRows = analytics.length ? analytics.map(analytic => {
    const student = getStudentById(analytic.student_id);
    const creator = getUserById(analytic.created_by);
    const name = student ? student.full_name : '—';
    const dni = student ? student.dni : '—';
    const curso = student ? student.curso : '—';
    const years = Object.keys(analytic.grades || {}).sort();
    const yearStr = years.join(', ') || '—';

    return `
      <tr>
        <td>
          <div class="table-name">${escapeHtml(name)}</div>
          <div class="table-sub">DNI ${escapeHtml(dni)}</div>
        </td>
        <td>${escapeHtml(curso)}</td>
        <td>${escapeHtml(yearStr)}</td>
        <td>${renderStatusChip(analytic.status)}</td>
        <td>${timeAgo(analytic.updated_at)}</td>
        <td>${escapeHtml(creator ? creator.full_name : '—')}</td>
        <td>
          <div class="table-actions">
            <button class="icon-btn" title="Ver detalle" onclick="Router.navigate('analiticos/${analytic.id}')">
              <i data-lucide="eye"></i>
            </button>
            ${canCreate && analytic.status !== STATUS.ENVIADO ? `
              <button class="icon-btn" title="Editar" onclick="Router.navigate('analiticos/${analytic.id}')">
                <i data-lucide="pencil"></i>
              </button>` : ''}
          </div>
        </td>
      </tr>`;
  }).join('') : `
    <tr><td colspan="7">
      ${renderEmptyState('file-text', 'Sin analíticos', 'No hay analíticos que coincidan con los filtros.', canCreate ? `<button class="btn btn-primary" onclick="Router.navigate('analiticos/nuevo')"><i data-lucide="plus"></i> Crear analítico</button>` : '')}
    </td></tr>`;

  return `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title">Analíticos</div>
        <div class="page-subtitle">${analytics.length} analítico${analytics.length !== 1 ? 's' : ''} registrado${analytics.length !== 1 ? 's' : ''}</div>
      </div>
      ${canCreate ? `<button class="btn btn-primary" onclick="Router.navigate('analiticos/nuevo')">
        <i data-lucide="plus"></i> Nuevo analítico
      </button>` : ''}
    </div>

    <div class="filter-bar">
      <div class="search-wrapper">
        <span class="search-icon"><i data-lucide="search"></i></span>
        <input type="text" id="analytics-search" class="form-input search-input"
          placeholder="Buscar por nombre o DNI..."
          oninput="filterAnalyticsList()">
      </div>
      <select id="analytics-status-filter" class="form-select" style="width:180px" onchange="filterAnalyticsList()">
        ${optionsHtml}
      </select>
    </div>

    <div class="table-wrapper" id="analytics-table-wrapper">
      <table class="data-table" id="analytics-table">
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Curso</th>
            <th>Año lectivo</th>
            <th>Estado</th>
            <th>Modificado</th>
            <th>Responsable</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="analytics-tbody">
          ${tableRows}
        </tbody>
      </table>
      <div class="pagination">
        <span class="pagination-info">${analytics.length} resultado${analytics.length !== 1 ? 's' : ''}</span>
        <div class="pagination-controls">
          <button class="page-btn" disabled><i data-lucide="chevron-left" style="width:14px;height:14px"></i></button>
          <button class="page-btn active">1</button>
          <button class="page-btn" disabled><i data-lucide="chevron-right" style="width:14px;height:14px"></i></button>
        </div>
      </div>
    </div>`;
}

// ============================================================
// ANALYTICS DETAIL
// ============================================================

function renderAnalyticsDetailPage(analyticId) {
  const analytic = AnalyticRepository.getById(analyticId);
  if (!analytic) {
    return renderNotFoundPage();
  }

  const student = getStudentById(analytic.student_id);
  const user = Auth.getCurrentUser();
  const canEdit = Auth.canEditAnalytic() &&
    ['borrador', 'devuelto'].includes(analytic.status);

  const docsList = (analytic.documents || []).length
    ? analytic.documents.map(doc => `
        <div class="activity-item">
          <div style="color:var(--color-blue)"><i data-lucide="file" style="width:20px;height:20px"></i></div>
          <div class="activity-content">
            <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${escapeHtml(doc)}</div>
            <div class="activity-meta">Archivo adjunto</div>
          </div>
        </div>`).join('')
    : `<div style="color:var(--text-muted);font-size:13px;padding:12px 0">Sin documentos adjuntos.</div>`;

  const pendingList = (analytic.pending_subjects || []).length
    ? analytic.pending_subjects.map(ps => `
        <div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg-surface-2);border-radius:var(--r-sm);margin-bottom:6px">
          <i data-lucide="alert-circle" style="width:14px;height:14px;color:var(--color-amber);flex-shrink:0"></i>
          <span style="font-size:13px">${escapeHtml(ps.materia)} (${escapeHtml(ps.anio)}) — ${escapeHtml(ps.tipo)}</span>
        </div>`).join('')
    : `<div style="color:var(--text-muted);font-size:13px;padding:6px 0">Sin materias adeudadas registradas.</div>`;

  const equivalenciesList = (analytic.equivalencies || []).length
    ? analytic.equivalencies.map(eq => `
        <div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg-surface-2);border-radius:var(--r-sm);margin-bottom:6px">
          <i data-lucide="arrow-left-right" style="width:14px;height:14px;color:var(--color-blue);flex-shrink:0"></i>
          <span style="font-size:13px">${escapeHtml(eq.materia)} (${escapeHtml(eq.anio)}) — Esc. Origen: ${escapeHtml(eq.escuela_origen)}</span>
        </div>`).join('')
    : `<div style="color:var(--text-muted);font-size:13px;padding:6px 0">Sin equivalencias registradas.</div>`;

  // Devuelto banner
  const lastReturn = MOCK_DB.history.filter(h =>
    h.analytic_id === analyticId && h.new_status === STATUS.DEVUELTO
  ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

  const returnBanner = lastReturn ? `
    <div class="banner banner-warning" style="margin-bottom:24px">
      <i data-lucide="rotate-ccw"></i>
      <div>
        <strong>Analítico devuelto:</strong> ${escapeHtml(lastReturn.observation || 'Revisar observaciones en el historial.')}
      </div>
    </div>` : '';

  const leftColumn = `
    <div>
      ${returnBanner}
      <div class="card" style="margin-bottom:24px">
        <div class="card-header">
          <span class="card-title"><i data-lucide="user" style="display:inline;vertical-align:middle;margin-right:8px;width:17px;height:17px"></i>Datos del alumno</span>
        </div>
        <div class="card-body">
          <div class="grid-2">
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Nombre completo</label>
              <div style="font-size:15px;font-weight:700;color:var(--text-primary)">${escapeHtml(student ? student.full_name : '—')}</div>
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">DNI</label>
              <div style="font-size:15px;font-weight:700">${escapeHtml(student ? student.dni : '—')}</div>
            </div>
            <div>
              <label class="form-label">Fecha de nacimiento</label>
              <div style="font-size:14px">${student ? formatDate(student.birth_date) : '—'}</div>
            </div>
            <div>
              <label class="form-label">Año de egreso</label>
              <div style="font-size:14px">${escapeHtml(student ? String(student.graduation_year) : '—')}</div>
            </div>
            <div>
              <label class="form-label">Curso</label>
              <div style="font-size:14px">${escapeHtml(student ? student.curso : '—')}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:24px">
        <div class="card-header">
          <span class="card-title"><i data-lucide="book-open" style="display:inline;vertical-align:middle;margin-right:8px;width:17px;height:17px"></i>Calificaciones por año</span>
          ${canEdit ? '<span class="tag">Editable</span>' : ''}
        </div>
        <div class="card-body">
          ${renderGradesAccordion(analytic.grades, canEdit)}
        </div>
      </div>

      <div class="card" style="margin-bottom:24px">
        <div class="card-header">
          <span class="card-title"><i data-lucide="alert-triangle" style="display:inline;vertical-align:middle;margin-right:8px;width:17px;height:17px"></i>Materias adeudadas</span>
        </div>
        <div class="card-body">${pendingList}</div>
      </div>

      <div class="card" style="margin-bottom:24px">
        <div class="card-header">
          <span class="card-title"><i data-lucide="arrow-left-right" style="display:inline;vertical-align:middle;margin-right:8px;width:17px;height:17px"></i>Equivalencias</span>
        </div>
        <div class="card-body">${equivalenciesList}</div>
      </div>

      <div class="card">
        <div class="card-header">
          ${canEdit ? `<span class="card-title"><i data-lucide="paperclip" style="display:inline;vertical-align:middle;margin-right:8px;width:17px;height:17px"></i>Documentación adjunta</span>
          <button class="btn btn-secondary btn-sm" onclick="openDocumentUpload('${analyticId}')">
            <i data-lucide="upload"></i> Adjuntar
            <input type="file" id="detail-upload-input-${analyticId}" multiple accept=".pdf,.png,.jpg,.jpeg" style="display:none" onchange="handleDetailFileSelect(event,'${analyticId}')">
          </button>` : '<span class="card-title"><i data-lucide="paperclip" style="display:inline;vertical-align:middle;margin-right:8px;width:17px;height:17px"></i>Documentación adjunta</span>'}
        </div>
        <div class="card-body" style="padding:12px 24px">${docsList}</div>
      </div>
    </div>`;

  return `
    <div class="page-header">
      <div class="page-header-left">
        <div class="breadcrumb">
          <a href="#" onclick="Router.navigate('analiticos');return false" style="color:var(--text-muted);font-weight:500">Analíticos</a>
          <i data-lucide="chevron-right" class="breadcrumb-sep"></i>
          <span>${escapeHtml(student ? student.full_name : analyticId)}</span>
        </div>
        <div class="page-title">Analítico — ${escapeHtml(student ? student.full_name : '—')}</div>
        <div class="page-subtitle" style="display:flex;align-items:center;gap:8px;margin-top:6px">
          ${renderStatusChip(analytic.status)}
          <span>Última modificación: ${timeAgo(analytic.updated_at)}</span>
        </div>
      </div>
    </div>

    <div class="detail-layout">
      ${leftColumn}
      ${renderAnalyticPanel(analytic)}
    </div>`;
}

// ============================================================
// ANALYTICS NEW — 6-step wizard
// ============================================================

let _wizardData = {
  step: 1,
  student: null,
  grades: {},
  pending_subjects: [],
  equivalencies: [],
  documents: []
};

function renderAnalyticsNewPage() {
  if (!Auth.canEditAnalytic()) {
    return renderForbiddenPage();
  }

  _wizardData = { step: 1, student: null, grades: {}, pending_subjects: [], equivalencies: [], documents: [] };
  return renderWizardStep(1);
}

function renderWizardStep(step) {
  const steps = [
    { num: 1, label: 'Alumno' },
    { num: 2, label: 'Datos personales' },
    { num: 3, label: 'Calificaciones' },
    { num: 4, label: 'Adeudadas' },
    { num: 5, label: 'Equivalencias' },
    { num: 6, label: 'Documentación' },
    { num: 7, label: 'Revisión y envío' }
  ];

  const stepperHtml = steps.map((s, idx) => {
    const isDone = s.num < step;
    const isActive = s.num === step;
    const isLast = idx === steps.length - 1;
    return `
      <div class="wizard-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}" onclick="${s.num < step ? 'goToWizardStep(' + s.num + ')' : ''}">
        <div class="wizard-step-num">
          ${isDone ? '<i data-lucide="check" style="width:14px;height:14px"></i>' : s.num}
        </div>
        <div class="wizard-step-label">${s.label}</div>
      </div>
      ${!isLast ? `<div class="wizard-sep ${isDone ? 'done' : ''}"></div>` : ''}`;
  }).join('');

  const stepContent = getWizardStepContent(step);
  const prevBtn = step > 1
    ? `<button class="btn btn-secondary" onclick="goToWizardStep(${step - 1})"><i data-lucide="arrow-left"></i> Anterior</button>`
    : `<button class="btn btn-ghost" onclick="Router.navigate('analiticos')">Cancelar</button>`;
  const nextBtn = step < 7
    ? `<button class="btn btn-primary" onclick="advanceWizard(${step})" id="wizard-next-btn">Siguiente <i data-lucide="arrow-right"></i></button>`
    : `<button class="btn btn-success" onclick="submitNewAnalytic()" id="wizard-submit-btn"><i data-lucide="send"></i> Crear analítico</button>`;

  return `
    <div class="page-header">
      <div class="page-header-left">
        <div class="breadcrumb">
          <a href="#" onclick="Router.navigate('analiticos');return false" style="color:var(--text-muted);font-weight:500">Analíticos</a>
          <i data-lucide="chevron-right" class="breadcrumb-sep"></i>
          <span>Nuevo analítico</span>
        </div>
        <div class="page-title">Nuevo Analítico</div>
        <div class="page-subtitle">Paso ${step} de 7</div>
      </div>
    </div>

    <div class="wizard-stepper">${stepperHtml}</div>

    <div class="card" id="wizard-content">
      <div class="card-body">
        ${stepContent}
      </div>
      <div class="modal-footer">
        ${prevBtn}
        <div style="flex:1"></div>
        <button class="btn btn-ghost" onclick="saveWizardDraft()"><i data-lucide="save"></i> Guardar borrador</button>
        ${nextBtn}
      </div>
    </div>`;
}

function getWizardStepContent(step) {
  switch (step) {
    case 1: return getWizardStep1();
    case 2: return getWizardStep2();
    case 3: return getWizardStep3();
    case 4: return getWizardStep4();
    case 5: return getWizardStep5();
    case 6: return getWizardStep6();
    case 7: return getWizardStep7();
    default: return '';
  }
}

function getWizardStep1() {
  const studentRows = MOCK_DB.students
    .filter(s => !MOCK_DB.analytics.some(a => a.student_id === s.id && a.status !== STATUS.ENVIADO))
    .map(s => `
      <div class="activity-item" style="cursor:pointer;border-radius:var(--r-md);padding:12px 16px;border:1px solid var(--border);margin-bottom:8px"
           id="stu-opt-${s.id}"
           onclick="selectWizardStudent('${s.id}')">
        <div class="activity-avatar" style="background:var(--color-navy)">${escapeHtml(getInitials(s.full_name))}</div>
        <div class="activity-content">
          <div class="activity-text"><strong>${escapeHtml(s.full_name)}</strong></div>
          <div class="activity-meta">DNI ${escapeHtml(s.dni)} · ${escapeHtml(s.curso)} · Egreso ${s.graduation_year}</div>
        </div>
        <div id="stu-check-${s.id}" style="display:none;color:var(--color-green)"><i data-lucide="check-circle"></i></div>
      </div>`).join('');

  return `
    <div style="max-width:600px">
      <h3 style="font-size:17px;font-weight:700;margin-bottom:4px">Seleccioná el alumno</h3>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:20px">Buscá al alumno por nombre o DNI. Solo se muestran alumnos sin analítico activo.</p>
      <div class="search-wrapper mb-6">
        <span class="search-icon"><i data-lucide="search"></i></span>
        <input type="text" id="wizard-student-search" class="form-input search-input"
          placeholder="Buscar alumno por nombre o DNI..."
          oninput="filterWizardStudents(this.value)">
      </div>
      <div id="wizard-students-list">
        ${studentRows || '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:24px">No hay alumnos disponibles para crear un nuevo analítico.</div>'}
      </div>
      <div id="step1-error" class="banner banner-error hidden" style="margin-top:16px">
        <i data-lucide="alert-circle"></i> Seleccioná un alumno para continuar.
      </div>
    </div>`;
}

function getWizardStep2() {
  const s = _wizardData.student;
  if (!s) return '<div class="banner banner-error"><i data-lucide="alert-circle"></i> No se seleccionó ningún alumno. Volvé al paso 1.</div>';
  return `
    <div style="max-width:600px">
      <h3 style="font-size:17px;font-weight:700;margin-bottom:4px">Verificación de datos personales</h3>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:24px">Confirmá que los datos del alumno sean correctos antes de continuar.</p>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Nombre completo <span class="required">*</span></label>
          <input type="text" class="form-input" value="${escapeHtml(s.full_name)}" id="w2-fullname">
        </div>
        <div class="form-group">
          <label class="form-label">DNI <span class="required">*</span></label>
          <input type="text" class="form-input" value="${escapeHtml(s.dni)}" id="w2-dni" pattern="[0-9]{7,8}" maxlength="8">
        </div>
        <div class="form-group">
          <label class="form-label">Fecha de nacimiento <span class="required">*</span></label>
          <input type="date" class="form-input" value="${escapeHtml(s.birth_date)}" id="w2-birthdate">
        </div>
        <div class="form-group">
          <label class="form-label">Año de egreso <span class="required">*</span></label>
          <input type="number" class="form-input" value="${s.graduation_year}" id="w2-graduation" min="2000" max="${new Date().getFullYear() + 1}">
        </div>
        <div class="form-group">
          <label class="form-label">Curso</label>
          <input type="text" class="form-input" value="${escapeHtml(s.curso)}" id="w2-curso">
        </div>
      </div>
      <div class="banner banner-info">
        <i data-lucide="info"></i>
        Si encontrás un error en los datos, podés corregirlo aquí. Los cambios no afectan el legajo del alumno.
      </div>
    </div>`;
}

function getWizardStep3() {
  const s = _wizardData.student;
  if (!s) return '';
  const startYear = s.graduation_year - 2;
  const years = [startYear, startYear + 1, startYear + 2].map(String);
  if (!_wizardData.grades || !Object.keys(_wizardData.grades).length) {
    _wizardData.grades = {};
    years.forEach(y => { _wizardData.grades[y] = {}; });
  }
  return `
    <div>
      <h3 style="font-size:17px;font-weight:700;margin-bottom:4px">Calificaciones por año</h3>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:8px">Ingresá las calificaciones de cada materia. Rango válido: 1 a 10.</p>
      <div class="banner banner-info" style="margin-bottom:20px">
        <i data-lucide="info"></i>
        Los campos se validan al salir del foco. El sistema muestra errores de rango en tiempo real.
      </div>
      <div id="grades-accordion-wizard">
        ${renderGradesAccordion(_wizardData.grades, true)}
      </div>
      <div id="grades-global-error" class="banner banner-error hidden" style="margin-top:16px">
        <i data-lucide="alert-circle"></i>
        Corregí las calificaciones marcadas en rojo antes de continuar.
      </div>
    </div>`;
}

function getWizardStep4() {
  return `
    <div style="max-width:600px">
      <h3 style="font-size:17px;font-weight:700;margin-bottom:4px">Materias adeudadas</h3>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:24px">Registrá materias adeudadas.</p>
      <div id="pending-subjects-list">
        ${_wizardData.pending_subjects.length
      ? _wizardData.pending_subjects.map((ps, idx) => pendingSubjectRow(ps, idx)).join('')
      : '<div style="color:var(--text-muted);font-size:13px;margin-bottom:16px">Sin materias adeudadas registradas.</div>'
    }
      </div>
      <button class="btn btn-secondary" onclick="addPendingSubject()">
        <i data-lucide="plus"></i> Agregar materia adeudada
      </button>
    </div>`;
}

function pendingSubjectRow(ps, idx) {
  return `<div class="flex gap-3 items-center mb-4" id="pending-row-${idx}">
    <input type="text" class="form-input" placeholder="Materia" value="${escapeHtml(ps.materia || '')}" style="flex:2" data-ps-field="materia" data-ps-idx="${idx}" oninput="updatePendingSubject(this)">
    <input type="text" class="form-input" placeholder="Año" value="${escapeHtml(ps.anio || '')}" style="flex:1" data-ps-field="anio" data-ps-idx="${idx}" oninput="updatePendingSubject(this)">
    <select class="form-select" style="flex:1.5" data-ps-field="tipo" data-ps-idx="${idx}" onchange="updatePendingSubject(this)">
      <option value="adeudada" ${(ps.tipo || 'adeudada') === 'adeudada' ? 'selected' : ''}>Adeudada</option>
      <option value="libre" ${ps.tipo === 'libre' ? 'selected' : ''}>Libre</option>
    </select>
    <button class="icon-btn danger" onclick="removePendingSubject(${idx})"><i data-lucide="trash-2"></i></button>
  </div>`;
}

function getWizardStep5() {
  return `
    <div style="max-width:600px">
      <h3 style="font-size:17px;font-weight:700;margin-bottom:4px">Equivalencias</h3>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:24px">Registrá asignaturas equivalentes aprobadas en otras escuelas.</p>
      <div id="equivalencies-list">
        ${_wizardData.equivalencies.length
      ? _wizardData.equivalencies.map((eq, idx) => equivalencyRow(eq, idx)).join('')
      : '<div style="color:var(--text-muted);font-size:13px;margin-bottom:16px">Sin equivalencias registradas.</div>'
    }
      </div>
      <button class="btn btn-secondary" onclick="addEquivalency()">
        <i data-lucide="plus"></i> Agregar equivalencia
      </button>
    </div>`;
}

function equivalencyRow(eq, idx) {
  return `<div class="flex gap-3 items-center mb-4" id="eq-row-${idx}">
    <input type="text" class="form-input" placeholder="Materia" value="${escapeHtml(eq.materia || '')}" style="flex:2" data-eq-field="materia" data-eq-idx="${idx}" oninput="updateEquivalency(this)">
    <input type="text" class="form-input" placeholder="Escuela Origen" value="${escapeHtml(eq.escuela_origen || '')}" style="flex:2" data-eq-field="escuela_origen" data-eq-idx="${idx}" oninput="updateEquivalency(this)">
    <input type="number" class="form-input" placeholder="Año" value="${escapeHtml(eq.anio || '')}" style="flex:1" data-eq-field="anio" data-eq-idx="${idx}" oninput="updateEquivalency(this)">
    <button class="icon-btn danger" onclick="removeEquivalency(${idx})"><i data-lucide="trash-2"></i></button>
  </div>`;
}

function getWizardStep6() {
  return `
    <div style="max-width:600px">
      <h3 style="font-size:17px;font-weight:700;margin-bottom:4px">Documentación adjunta</h3>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:24px">Adjuntá los documentos requeridos: legajo de identidad, constancia de egreso, actas de examen.</p>
      <div id="dropzone" class="card" style="border:2px dashed var(--border);background:var(--bg-surface-2);text-align:center;padding:40px 24px;cursor:pointer;transition:all var(--t-fast)" 
           onclick="document.getElementById('file-upload-input').click()"
           ondragover="handleDragOver(event)"
           ondragleave="handleDragLeave(event)"
           ondrop="handleDrop(event)">
        <i data-lucide="upload-cloud" style="width:36px;height:36px;color:var(--text-muted);margin:0 auto 12px;pointer-events:none"></i>
        <div style="font-weight:600;font-size:14px;color:var(--text-primary);pointer-events:none">Arrastrá archivos o hacé clic</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;pointer-events:none">PDF, JPG o PNG · Máx. 5MB por archivo</div>
        <button class="btn btn-secondary btn-sm" style="margin:12px auto 0;pointer-events:none">Seleccionar archivos</button>
        <input type="file" id="file-upload-input" multiple accept=".pdf,.png,.jpg,.jpeg" style="display:none" onchange="handleFileSelect(event)">
      </div>
      <div id="uploaded-files" style="margin-top:16px">
        ${_wizardData.documents.map((doc, idx) => `
          <div class="flex items-center gap-3" style="padding:10px;background:var(--bg-surface-2);border:1px solid var(--border);border-radius:var(--r-md);margin-bottom:8px">
            <i data-lucide="file" style="color:var(--color-blue);width:18px;height:18px;flex-shrink:0"></i>
            <span style="flex:1;font-size:13px">${escapeHtml(doc)}</span>
            <button class="icon-btn danger" onclick="removeDoc(${idx})"><i data-lucide="x"></i></button>
          </div>`).join('')}
      </div>
    </div>`;
}

function getWizardStep7() {
  const s = _wizardData.student;
  if (!s) return '';
  const years = Object.keys(_wizardData.grades || {}).sort();

  return `
    <div>
      <h3 style="font-size:17px;font-weight:700;margin-bottom:4px">Revisión y envío</h3>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:24px">Revisá el resumen del analítico antes de crear el borrador.</p>
      <div class="grid-2" style="margin-bottom:24px">
        <div class="card">
          <div class="card-header"><span class="card-title">Alumno</span></div>
          <div class="card-body">
            <div style="font-size:15px;font-weight:700;margin-bottom:4px">${escapeHtml(s.full_name)}</div>
            <div style="font-size:13px;color:var(--text-secondary)">DNI ${escapeHtml(s.dni)}</div>
            <div style="font-size:13px;color:var(--text-secondary)">${escapeHtml(s.curso)} · Egreso ${s.graduation_year}</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Calificaciones</span></div>
          <div class="card-body">
            ${years.map(y => {
    const avg = gradeAverage(_wizardData.grades[y]);
    const count = Object.values(_wizardData.grades[y]).filter(v => v !== null && v !== '').length;
    return `<div class="flex justify-between" style="padding:4px 0;border-bottom:1px solid var(--border);font-size:13px">
                <span>${y}</span>
                <span style="color:var(--text-muted)">${count} mat. · Prom. ${avg || '—'}</span>
              </div>`;
  }).join('')}
          </div>
        </div>
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><span class="card-title">Materias adeudadas</span></div>
          <div class="card-body">
            ${_wizardData.pending_subjects.length
      ? _wizardData.pending_subjects.map(ps => `<div style="font-size:13px;padding:4px 0">${escapeHtml(ps.materia)} (${escapeHtml(ps.anio)})</div>`).join('')
      : '<span style="font-size:13px;color:var(--text-muted)">Ninguna</span>'}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Equivalencias</span></div>
          <div class="card-body">
            ${_wizardData.equivalencies.length
      ? _wizardData.equivalencies.map(eq => `<div style="font-size:13px;padding:4px 0">${escapeHtml(eq.materia)} (${escapeHtml(eq.anio)}) - ${escapeHtml(eq.escuela_origen)}</div>`).join('')
      : '<span style="font-size:13px;color:var(--text-muted)">Ninguna</span>'}
          </div>
        </div>
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><span class="card-title">Documentación</span></div>
          <div class="card-body">
            ${_wizardData.documents.length
      ? _wizardData.documents.map(d => `<div style="font-size:13px;padding:4px 0">${escapeHtml(d)}</div>`).join('')
      : '<span style="font-size:13px;color:var(--text-muted)">Sin documentos adjuntos</span>'}
          </div>
        </div>
      </div>
      <div class="banner banner-info" style="margin-top:24px">
        <i data-lucide="info"></i>
        El analítico se creará en estado <strong>Borrador</strong>. Podrás editarlo y enviarlo a revisión cuando esté completo.
      </div>
    </div>`;
}
