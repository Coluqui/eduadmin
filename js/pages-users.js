/* ============================================================
   EDUADMIN — pages-users.js
   User management (Super Admin only)
   ============================================================ */

'use strict';

function renderUsersPage() {
    if (!Auth.canManageUsers()) return renderForbiddenPage();

    const users = UserRepository.getAll();

    const rows = users.map(u => `
    <tr>
      <td>
        <div class="flex items-center gap-3">
          <div class="header-avatar" style="width:36px;height:36px;font-size:13px;flex-shrink:0">
            ${escapeHtml(getInitials(u.full_name))}
          </div>
          <div>
            <div class="table-name">${escapeHtml(u.full_name)}</div>
            <div class="table-sub">${escapeHtml(u.email)}</div>
          </div>
        </div>
      </td>
      <td>${renderRoleBadge(u.role)}</td>
      <td>
        ${u.is_active
            ? '<span class="chip chip-approved">Activo</span>'
            : '<span class="chip chip-draft">Inactivo</span>'}
      </td>
      <td>${formatDate(u.created_at)}</td>
      <td>
        <div class="table-actions">
          <button class="icon-btn ${u.is_active ? 'danger' : ''}" title="${u.is_active ? 'Desactivar' : 'Activar'}"
            onclick="toggleUserActive('${u.id}')">
            <i data-lucide="${u.is_active ? 'user-x' : 'user-check'}"></i>
          </button>
        </div>
      </td>
    </tr>`);

    return `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title">Usuarios</div>
        <div class="page-subtitle">${users.length} usuarios registrados</div>
      </div>
      <button class="btn btn-primary" onclick="showCreateUserModal()">
        <i data-lucide="user-plus"></i> Nuevo usuario
      </button>
    </div>

    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Creado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>${rows.join('')}</tbody>
      </table>
    </div>`;
}

function showCreateUserModal() {
    const roleOptions = Object.entries(ROLE_LABELS)
        .map(([val, label]) => `<option value="${val}">${escapeHtml(label)}</option>`)
        .join('');

    const html = `
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="user-plus" style="display:inline;vertical-align:middle;margin-right:8px"></i>Nuevo usuario</div>
        <button class="modal-close" data-close-modal><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div class="banner banner-info" style="margin-bottom:20px">
          <i data-lucide="info"></i>
          El sistema enviará credenciales temporales al email ingresado.
        </div>
        <div id="create-user-error" class="banner banner-error hidden" style="margin-bottom:16px">
          <i data-lucide="alert-circle"></i>
          <span id="create-user-error-msg"></span>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Nombre completo <span class="required">*</span></label>
            <input type="text" id="new-user-name" class="form-input" placeholder="Nombre y apellido">
          </div>
          <div class="form-group">
            <label class="form-label">Rol <span class="required">*</span></label>
            <select id="new-user-role" class="form-select">
              ${roleOptions}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Email institucional <span class="required">*</span></label>
          <input type="email" id="new-user-email" class="form-input" placeholder="usuario@escuela.edu.ar">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button class="btn btn-primary" onclick="createUser()">
          <i data-lucide="user-plus"></i> Crear usuario
        </button>
      </div>
    </div>`;
    showModal(html);
}

function renderForbiddenPage() {
    return `
    <div class="error-page">
      <div class="error-code">403</div>
      <div class="error-title">Sin permisos</div>
      <div class="error-sub">No tenés permisos para ver esta sección. Contactá al administrador si creés que es un error.</div>
      <button class="btn btn-primary" onclick="Router.navigate('dashboard')">
        <i data-lucide="arrow-left"></i> Volver al inicio
      </button>
    </div>`;
}

function renderNotFoundPage() {
    return `
    <div class="error-page">
      <div class="error-code">404</div>
      <div class="error-title">Página no encontrada</div>
      <div class="error-sub">La sección que buscás no existe o fue movida.</div>
      <button class="btn btn-primary" onclick="Router.navigate('dashboard')">
        <i data-lucide="arrow-left"></i> Volver al inicio
      </button>
    </div>`;
}
