/* ============================================================
   EDUADMIN — pages-students.js
   Students list (real-time search) · Student detail (legajo)
   ============================================================ */

'use strict';

function renderStudentsListPage() {
    const students = StudentRepository.getAll();

    const rows = students.map(s => {
        const analytics = StudentRepository.getAnalytics(s.id);
        const latest = analytics.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
        return `
      <tr>
        <td>
          <div class="flex items-center gap-3">
            <div class="header-avatar" style="width:36px;height:36px;font-size:13px;flex-shrink:0;background:linear-gradient(135deg,var(--color-navy),var(--color-blue-mid))">
              ${escapeHtml(getInitials(s.full_name))}
            </div>
            <div>
              <div class="table-name">${escapeHtml(s.full_name)}</div>
              <div class="table-sub">DNI ${escapeHtml(s.dni)}</div>
            </div>
          </div>
        </td>
        <td>${escapeHtml(s.curso)}</td>
        <td>${s.graduation_year}</td>
        <td>${latest ? renderStatusChip(latest.status) : '<span style="color:var(--text-muted);font-size:13px">Sin analítico</span>'}</td>
        <td>${s.is_active
                ? '<span class="chip chip-approved">Activo</span>'
                : '<span class="chip chip-draft">Egresado</span>'}</td>
        <td>
          <button class="icon-btn" title="Ver legajo" onclick="Router.navigate('alumnos/${s.id}')">
            <i data-lucide="eye"></i>
          </button>
        </td>
      </tr>`;
    });

    return `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title">Alumnos</div>
        <div class="page-subtitle">${students.length} alumnos registrados</div>
      </div>
    </div>

    <div class="filter-bar">
      <div class="search-wrapper" style="flex:1">
        <span class="search-icon"><i data-lucide="search"></i></span>
        <input type="text" id="student-search" class="form-input search-input"
          placeholder="Buscar por nombre o DNI (mínimo 3 caracteres)..."
          oninput="filterStudentsList(this.value)">
      </div>
    </div>

    <div id="students-results">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Curso</th>
              <th>Año de egreso</th>
              <th>Estado analítico</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody id="students-tbody">
            ${rows.join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderStudentDetailPage(studentId) {
    const student = StudentRepository.getById(studentId);
    if (!student) return renderNotFoundPage();

    const analytics = StudentRepository.getAnalytics(studentId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const analyticRows = analytics.length ? analytics.map(a => {
        const creator = getUserById(a.created_by);
        return `
      <tr>
        <td>${formatDate(a.created_at)}</td>
        <td>${renderStatusChip(a.status)}</td>
        <td>${escapeHtml(creator ? creator.full_name : '—')}</td>
        <td>${timeAgo(a.updated_at)}</td>
        <td>
          <button class="icon-btn" onclick="Router.navigate('analiticos/${a.id}')">
            <i data-lucide="eye"></i>
          </button>
        </td>
      </tr>`;
    }).join('') : `<tr><td colspan="5">${renderEmptyState('file-text', 'Sin analíticos', 'Este alumno no tiene analíticos generados.')}</td></tr>`;

    return `
    <div class="page-header">
      <div class="page-header-left">
        <div class="breadcrumb">
          <a href="#" onclick="Router.navigate('alumnos');return false" style="color:var(--text-muted);font-weight:500">Alumnos</a>
          <i data-lucide="chevron-right" class="breadcrumb-sep"></i>
          <span>${escapeHtml(student.full_name)}</span>
        </div>
        <div class="page-title">${escapeHtml(student.full_name)}</div>
        <div class="page-subtitle">Legajo del alumno</div>
      </div>
      ${Auth.canEditAnalytic() ? `
        <button class="btn btn-primary" onclick="Router.navigate('analiticos/nuevo')">
          <i data-lucide="plus"></i> Nuevo analítico
        </button>` : ''}
    </div>

    <div style="display:grid;grid-template-columns:380px 1fr;gap:24px;align-items:start">
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i data-lucide="user" style="display:inline;vertical-align:middle;margin-right:8px;width:17px;height:17px"></i>Datos personales</span>
        </div>
        <div class="card-body">
          <div style="text-align:center;margin-bottom:20px">
            <div class="header-avatar" style="width:64px;height:64px;font-size:22px;font-weight:800;margin:0 auto 10px;background:linear-gradient(135deg,var(--color-navy),var(--color-blue-mid))">
              ${escapeHtml(getInitials(student.full_name))}
            </div>
            <div style="font-size:17px;font-weight:800;color:var(--text-primary)">${escapeHtml(student.full_name)}</div>
            ${student.is_active
            ? '<span class="chip chip-approved" style="margin-top:6px">Alumno activo</span>'
            : '<span class="chip chip-draft" style="margin-top:6px">Ex-alumno</span>'}
          </div>
          <div class="divider"></div>
          <div class="detail-meta-row">
            <span class="detail-meta-icon"><i data-lucide="credit-card"></i></span>
            <span class="detail-meta-key">DNI</span>
            <span class="detail-meta-val">${escapeHtml(student.dni)}</span>
          </div>
          <div class="detail-meta-row">
            <span class="detail-meta-icon"><i data-lucide="calendar"></i></span>
            <span class="detail-meta-key">Nacimiento</span>
            <span class="detail-meta-val">${formatDate(student.birth_date)}</span>
          </div>
          <div class="detail-meta-row">
            <span class="detail-meta-icon"><i data-lucide="graduation-cap"></i></span>
            <span class="detail-meta-key">Año de egreso</span>
            <span class="detail-meta-val">${student.graduation_year}</span>
          </div>
          <div class="detail-meta-row">
            <span class="detail-meta-icon"><i data-lucide="book"></i></span>
            <span class="detail-meta-key">Curso</span>
            <span class="detail-meta-val">${escapeHtml(student.curso)}</span>
          </div>
          <div class="detail-meta-row">
            <span class="detail-meta-icon"><i data-lucide="file-text"></i></span>
            <span class="detail-meta-key">Analíticos</span>
            <span class="detail-meta-val">${analytics.length} generado${analytics.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title"><i data-lucide="file-text" style="display:inline;vertical-align:middle;margin-right:8px;width:17px;height:17px"></i>Historial de analíticos</span>
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0;box-shadow:none">
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha creación</th>
                <th>Estado</th>
                <th>Confeccionado por</th>
                <th>Última modificación</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>${analyticRows}</tbody>
          </table>
        </div>
      </div>
    </div>`;
}
