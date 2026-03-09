/* ============================================================
   EDUADMIN — router.js
   Hash-based SPA router + all event handlers
   ============================================================ */

'use strict';

// ============================================================
// ROUTER
// ============================================================

const Router = {
    navigate(path) {
        window.location.hash = path;
    },

    parseHash() {
        const hash = window.location.hash.replace(/^#\/?/, '') || 'login';
        const parts = hash.split('/').filter(Boolean);
        return { route: parts[0] || 'login', params: parts.slice(1) };
    },

    render() {
        const { route, params } = Router.parseHash();
        const app = document.getElementById('app');
        const user = Auth.getCurrentUser();

        // Not logged in → login
        if (!user && route !== 'login') {
            sessionStorage.setItem('eduadmin_redirect', route + (params.length ? '/' + params.join('/') : ''));
            window.location.hash = 'login';
            return;
        }

        // Already logged in → go to dashboard
        if (user && route === 'login') {
            const redir = sessionStorage.getItem('eduadmin_redirect') || 'dashboard';
            sessionStorage.removeItem('eduadmin_redirect');
            window.location.hash = redir;
            return;
        }

        // Role permission check
        const allowed = ROUTE_ROLES[route];
        if (user && allowed && !allowed.includes(user.role)) {
            app.innerHTML = renderLayout(renderForbiddenPage(), { title: 'Sin permisos', route });
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        // Page rendering
        let html = '';
        switch (route) {
            case 'login':
                html = renderLoginPage();
                break;
            case 'dashboard':
                html = renderLayout(renderDashboardPage(), { title: 'Dashboard', route: 'dashboard' });
                break;
            case 'analiticos':
                if (params[0] === 'nuevo') {
                    html = renderLayout(renderAnalyticsNewPage(), { title: 'Nuevo Analítico', route: 'analiticos' });
                } else if (params[0]) {
                    const a = AnalyticRepository.getById(params[0]);
                    const s = a ? getStudentById(a.student_id) : null;
                    html = renderLayout(renderAnalyticsDetailPage(params[0]), {
                        title: s ? s.full_name : 'Analítico', route: 'analiticos'
                    });
                } else {
                    html = renderLayout(renderAnalyticsListPage(), { title: 'Analíticos', route: 'analiticos' });
                }
                break;
            case 'alumnos':
                if (params[0]) {
                    const s = StudentRepository.getById(params[0]);
                    html = renderLayout(renderStudentDetailPage(params[0]), {
                        title: s ? s.full_name : 'Alumno', route: 'alumnos'
                    });
                } else {
                    html = renderLayout(renderStudentsListPage(), { title: 'Alumnos', route: 'alumnos' });
                }
                break;
            case 'usuarios':
                html = renderLayout(renderUsersPage(), { title: 'Usuarios', route: 'usuarios' });
                break;
            case 'configuracion':
                html = renderLayout(renderSettingsPage(), { title: 'Configuración', route: 'configuracion' });
                break;
            case 'notificaciones':
                html = renderLayout(renderNotificationsPage(), { title: 'Notificaciones', route: 'dashboard' });
                break;
            default:
                html = renderLayout(renderNotFoundPage(), { title: '404', route });
        }

        app.innerHTML = html;
        try {
            if (window.lucide) window.lucide.createIcons();
        } catch (e) {
            console.warn('Clickable icons could not be initialized:', e);
        }
        window.scrollTo(0, 0);
    }
};

// ============================================================
// AUTH HANDLERS
// ============================================================

async function handleLoginSubmit(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');
    const errEl = document.getElementById('login-error');
    const errMsg = document.getElementById('login-error-msg');

    if (!btn || !errEl) return;

    btn.disabled = true;
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" style="animation:spin 0.6s linear infinite"></i> Verificando...';
    errEl.classList.add('hidden');
    if (window.lucide) window.lucide.createIcons({ el: btn });

    try {
        const result = await Auth.login(email, password);
        if (result.success) {
            await DataLoader.loadAll();
            showToast('success', '¡Bienvenido/a!', result.user.full_name);
            window.location.hash = '#dashboard';
            Router.render();
        } else {
            throw new Error(result.error || 'Credenciales inválidas');
        }
    } catch (err) {
        console.error('Login submit error:', err);
        errMsg.textContent = err.message || 'Error al conectar con el servidor.';
        errEl.classList.remove('hidden');
        btn.disabled = false;
        btn.innerHTML = originalContent;
        if (window.lucide) window.lucide.createIcons({ el: btn });
    }
}

function fillDemoCredentials(email, password) {
    document.getElementById('login-email').value = email;
    document.getElementById('login-password').value = password;
    document.getElementById('login-email').focus();
}

function togglePasswordVisibility() {
    const input = document.getElementById('login-password');
    const icon = document.getElementById('pw-toggle-icon');
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.setAttribute('data-lucide', 'eye-off');
    } else {
        input.type = 'password';
        if (icon) icon.setAttribute('data-lucide', 'eye');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons({ el: icon });
}

function handleForgotPassword(e) {
    e.preventDefault();
    showToast('info', 'Recuperación de contraseña', 'Contactá al administrador para restablecer tu contraseña.');
}

function showLogoutConfirm() {
    const html = `
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">Cerrar sesión</div>
        <button class="modal-close" data-close-modal><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <p style="font-size:14px;color:var(--text-secondary)">¿Querés cerrar tu sesión? Cualquier cambio no guardado se perderá.</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button class="btn btn-danger" onclick="confirmLogout()">
          <i data-lucide="log-out"></i> Cerrar sesión
        </button>
      </div>
    </div>`;
    showModal(html);
}

async function confirmLogout() {
    closeModal();
    await Auth.logout();
    Router.render();
}

// ============================================================
// THEME
// ============================================================

function toggleTheme() {
    const current = AppState.get('theme');
    const next = current === 'light' ? 'dark' : 'light';
    AppState.set('theme', next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('eduadmin_theme', next);

    // Update switch thumb icon
    const switchEl = document.getElementById('theme-toggle-switch');
    if (switchEl) {
        const thumb = switchEl.querySelector('.theme-switch-thumb');
        if (thumb) {
            thumb.innerHTML = `<i data-lucide="${next === 'dark' ? 'moon' : 'sun'}"></i>`;
            if (typeof lucide !== 'undefined') lucide.createIcons({ el: thumb });
        }
    }
    showToast('info', next === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado');
}

// ============================================================
// ANALYTICS HANDLERS
// ============================================================

function filterAnalyticsList() {
    const query = (document.getElementById('analytics-search')?.value || '').trim();
    const status = document.getElementById('analytics-status-filter')?.value || 'all';
    const list = AnalyticRepository.getAll({ query, status });
    const tbody = document.getElementById('analytics-tbody');
    if (!tbody) return;

    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="7">${renderEmptyState('search', 'Sin resultados', 'Probá cambiando los filtros o la búsqueda.')}</td></tr>`;
        if (typeof lucide !== 'undefined') lucide.createIcons({ el: tbody });
        return;
    }

    tbody.innerHTML = list.map(a => {
        const s = getStudentById(a.student_id);
        const c = getUserById(a.created_by);
        const years = Object.keys(a.grades || {}).sort().join(', ') || '—';
        return `
      <tr>
        <td>
          <div class="table-name">${escapeHtml(s ? s.full_name : '—')}</div>
          <div class="table-sub">DNI ${escapeHtml(s ? s.dni : '—')}</div>
        </td>
        <td>${escapeHtml(s ? s.curso : '—')}</td>
        <td>${escapeHtml(years)}</td>
        <td>${renderStatusChip(a.status)}</td>
        <td>${timeAgo(a.updated_at)}</td>
        <td>${escapeHtml(c ? c.full_name : '—')}</td>
        <td>
          <div class="table-actions">
            <button class="icon-btn" onclick="Router.navigate('analiticos/${a.id}')"><i data-lucide="eye"></i></button>
          </div>
        </td>
      </tr>`;
    }).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons({ el: tbody });
}

function saveAnalyticDraft(analyticId) {
    showToast('success', 'Borrador guardado', 'Los cambios se guardaron correctamente.');
}

async function submitAnalyticForReview(analyticId) {
    try {
        const sbResult = await SupabaseWriter.changeAnalyticStatus(analyticId, STATUS.EN_REVISION);
        if (!sbResult) {
            // mock fallback
            AnalyticRepository.changeStatus(analyticId, STATUS.EN_REVISION);
        } else {
            await DataLoader.reloadAnalytics();
            await DataLoader.reloadHistory();
        }
        showToast('success', 'Enviado a revisión', 'La Directora será notificada.');
        setTimeout(() => Router.render(), 600);
    } catch (err) {
        console.error(err);
        showToast('error', 'Error', err.message || 'No se pudo cambiar el estado.');
    }
}

async function approveAnalytic(analyticId) {
    try {
        const sbResult = await SupabaseWriter.changeAnalyticStatus(analyticId, STATUS.APROBADO);
        if (!sbResult) AnalyticRepository.changeStatus(analyticId, STATUS.APROBADO);
        else { await DataLoader.reloadAnalytics(); await DataLoader.reloadHistory(); }
        showToast('success', 'Analítico aprobado', 'La secretaria puede enviarlo a SInIDE.');
        setTimeout(() => Router.render(), 600);
    } catch (err) {
        showToast('error', 'Error', err.message || 'No se pudo aprobar.');
    }
}

async function confirmReturn(analyticId) {
    const obs = document.getElementById('return-observation');
    const err = document.getElementById('return-obs-error');
    if (!obs || !obs.value.trim()) {
        if (err) err.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons({ el: err });
        return;
    }
    const observation = obs.value.trim();
    try {
        const sbResult = await SupabaseWriter.changeAnalyticStatus(analyticId, STATUS.DEVUELTO, observation);
        if (!sbResult) AnalyticRepository.changeStatus(analyticId, STATUS.DEVUELTO, observation);
        else { await DataLoader.reloadAnalytics(); await DataLoader.reloadHistory(); }
        closeModal();
        showToast('warning', 'Analítico devuelto', 'La secretaria fue notificada con la observación.');
        setTimeout(() => Router.render(), 600);
    } catch (err) {
        showToast('error', 'Error', err.message || 'No se pudo devolver.');
    }
}

async function sendAnalyticToSinide(analyticId) {
    try {
        const sbResult = await SupabaseWriter.changeAnalyticStatus(analyticId, STATUS.ENVIADO);
        if (!sbResult) AnalyticRepository.changeStatus(analyticId, STATUS.ENVIADO);
        else { await DataLoader.reloadAnalytics(); await DataLoader.reloadHistory(); }
        showToast('success', '¡Enviado!', 'El analítico fue marcado como enviado a SInIDE/ReFE.');
        setTimeout(() => Router.render(), 600);
    } catch (err) {
        showToast('error', 'Error', err.message || 'No se pudo enviar.');
    }
}

// ============================================================
// VALIDATION HANDLERS
// ============================================================

function validateGradeInput(input) {
    const val = input.value;
    if (val === '' || val === null) {
        input.classList.remove('is-error', 'is-valid');
        return;
    }
    const num = Number(val);
    if (isNaN(num) || num < 1 || num > 10) {
        input.classList.add('is-error');
        input.classList.remove('is-valid');
    } else {
        input.classList.remove('is-error');
        input.classList.add('is-valid');
        // Update wizard data
        const year = input.dataset.year;
        const subject = input.dataset.subject;
        if (year && subject && _wizardData && _wizardData.grades) {
            if (!_wizardData.grades[year]) _wizardData.grades[year] = {};
            _wizardData.grades[year][subject] = num;
        }
    }
}

// ============================================================
// ACCORDION
// ============================================================

function toggleAccordion(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('open');
    if (typeof lucide !== 'undefined') lucide.createIcons({ el });
}

// ============================================================
// WIZARD HANDLERS
// ============================================================

function selectWizardStudent(studentId) {
    // Deselect all
    document.querySelectorAll('[id^="stu-opt-"]').forEach(el => {
        el.style.borderColor = 'var(--border)';
        el.style.background = '';
    });
    document.querySelectorAll('[id^="stu-check-"]').forEach(el => el.style.display = 'none');

    // Select this one
    const row = document.getElementById('stu-opt-' + studentId);
    const check = document.getElementById('stu-check-' + studentId);
    if (row) { row.style.borderColor = 'var(--color-blue)'; row.style.background = 'var(--bg-hover)'; }
    if (check) { check.style.display = 'flex'; if (typeof lucide !== 'undefined') lucide.createIcons({ el: check }); }

    _wizardData.student = StudentRepository.getById(studentId);
    const errEl = document.getElementById('step1-error');
    if (errEl) errEl.classList.add('hidden');
}

function filterWizardStudents(q) {
    const list = document.getElementById('wizard-students-list');
    if (!list) return;
    const items = list.querySelectorAll('[id^="stu-opt-"]');
    items.forEach(el => {
        const text = el.textContent.toLowerCase();
        el.style.display = (!q || q.length < 1 || text.includes(q.toLowerCase())) ? '' : 'none';
    });
}

function advanceWizard(currentStep) {
    if (currentStep === 1 && !_wizardData.student) {
        const err = document.getElementById('step1-error');
        if (err) err.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons({ el: err });
        return;
    }
    if (currentStep === 3) {
        const errors = document.querySelectorAll('.grade-input.is-error');
        if (errors.length) {
            const err = document.getElementById('grades-global-error');
            if (err) err.classList.remove('hidden');
            if (typeof lucide !== 'undefined') lucide.createIcons({ el: err });
            return;
        }
    }
    goToWizardStep(currentStep + 1);
}

function goToWizardStep(step) {
    _wizardData.step = step;
    const main = document.querySelector('.main-content');
    if (main) {
        main.innerHTML = renderAnalyticsNewPageAtStep(step);
        if (typeof lucide !== 'undefined') lucide.createIcons({ el: main });
    }
}

function renderAnalyticsNewPageAtStep(step) {
    _wizardData.step = step;
    return renderWizardStep(step);
}

function saveWizardDraft() {
    showToast('info', 'Borrador guardado', 'Podés retomar desde donde lo dejaste.');
}

function addPendingSubject() {
    _wizardData.pending_subjects.push({ materia: '', anio: '', tipo: 'adeudada' });
    goToWizardStep(4);
}

function removePendingSubject(idx) {
    _wizardData.pending_subjects.splice(idx, 1);
    goToWizardStep(4);
}

function addEquivalency() {
    _wizardData.equivalencies.push({ materia: '', escuela_origen: '', anio: '' });
    goToWizardStep(5);
}

function removeEquivalency(idx) {
    _wizardData.equivalencies.splice(idx, 1);
    goToWizardStep(5);
}

function updatePendingSubject(input) {
    const idx = input.dataset.psIdx;
    const field = input.dataset.psField;
    if (_wizardData.pending_subjects[idx]) {
        _wizardData.pending_subjects[idx][field] = input.value;
    }
}

function updateEquivalency(input) {
    const idx = input.dataset.eqIdx;
    const field = input.dataset.eqField;
    if (_wizardData.equivalencies[idx]) {
        _wizardData.equivalencies[idx][field] = input.value;
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('dropzone');
    if (dropzone) dropzone.style.borderColor = 'var(--color-blue)';
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('dropzone');
    if (dropzone) dropzone.style.borderColor = 'var(--border)';
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('dropzone');
    if (dropzone) dropzone.style.borderColor = 'var(--border)';

    if (e.dataTransfer && e.dataTransfer.files) {
        processFiles(e.dataTransfer.files);
    }
}

function handleFileSelect(e) {
    if (e.target && e.target.files) {
        processFiles(e.target.files);
    }
}

// _wizardFiles almacena objetos File reales para subir a Storage al crear el analítico
let _wizardFiles = [];

function processFiles(files) {
    let added = 0;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
            showToast('warning', 'Archivo muy grande', `${file.name} supera los 5MB.`);
            continue;
        }
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowed.includes(file.type)) {
            showToast('warning', 'Tipo no permitido', `${file.name}: solo PDF, JPG o PNG.`);
            continue;
        }
        _wizardData.documents.push(file.name);
        _wizardFiles.push(file);  // guardar File real para upload posterior
        added++;
    }
    if (added > 0) {
        showToast('success', 'Archivos seleccionados', `${added} archivo(s) listos para adjuntar.`);
        goToWizardStep(6);
    }
}

function removeDoc(idx) {
    _wizardData.documents.splice(idx, 1);
    _wizardFiles.splice(idx, 1);
    goToWizardStep(6);
}

async function submitNewAnalytic() {
    if (!_wizardData.student) {
        showToast('error', 'Error', 'No se seleccionó ningún alumno.');
        return;
    }

    const analyticData = {
        student_id: _wizardData.student.id,
        grades: _wizardData.grades,
        pending_subjects: _wizardData.pending_subjects,
        equivalencies: _wizardData.equivalencies,
        documents: _wizardData.documents
    };

    try {
        const created = await SupabaseWriter.createAnalytic(analyticData);
        if (created) {
            // Upload real files to Storage after analytic creation
            for (const file of _wizardFiles) {
                try {
                    await SupabaseWriter.uploadDocument(created.id, file);
                } catch (uploadErr) {
                    console.error('Error uploading file', file.name, uploadErr);
                    showToast('warning', 'Archivo no subido', `${file.name} no pudo subirse al servidor.`);
                }
            }
            await DataLoader.reloadAnalytics();
            _wizardFiles = [];
            showToast('success', 'Analítico creado', 'El borrador fue guardado correctamente.');
            setTimeout(() => Router.navigate('analiticos/' + created.id), 700);
        } else {
            // Mock fallback
            const result = AnalyticRepository.createAnalytic(analyticData);
            if (result.success) {
                showToast('success', 'Analítico creado', 'El borrador fue guardado correctamente.');
                setTimeout(() => Router.navigate('analiticos/' + result.analytic.id), 700);
            }
        }
    } catch (err) {
        console.error('submitNewAnalytic error:', err);
        showToast('error', 'Error al crear analítico', err.message || 'Intentá de nuevo.');
    }
}

// ============================================================
// STUDENTS HANDLERS
// ============================================================

function filterStudentsList(query) {
    const results = document.getElementById('students-results');
    if (!results) return;

    const students = query && query.length >= 3
        ? StudentRepository.search(query)
        : StudentRepository.getAll();

    if (!students.length) {
        results.innerHTML = renderEmptyState('search', 'Sin resultados', 'Buscá por nombre completo o DNI (mínimo 3 caracteres).');
        if (typeof lucide !== 'undefined') lucide.createIcons({ el: results });
        return;
    }

    const tbody = document.getElementById('students-tbody');
    if (!tbody) return;

    tbody.innerHTML = students.map(s => {
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
        <td>${s.is_active ? '<span class="chip chip-approved">Activo</span>' : '<span class="chip chip-draft">Egresado</span>'}</td>
        <td><button class="icon-btn" onclick="Router.navigate('alumnos/${s.id}')"><i data-lucide="eye"></i></button></td>
      </tr>`;
    }).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons({ el: tbody });
}

// ============================================================
// USER MANAGEMENT HANDLERS
// ============================================================

async function toggleUserActive(userId) {
    const user = UserRepository.getById(userId);
    if (!user) return;
    try {
        const sbResult = await SupabaseWriter.toggleUserActive(userId, user.is_active);
        if (!sbResult) UserRepository.toggleActive(userId);
        else await DataLoader.reloadUsers();
        const msg = (user.is_active ? 'Usuario desactivado' : 'Usuario activado');
        showToast('success', msg);
        setTimeout(() => Router.render(), 400);
    } catch (err) {
        showToast('error', 'Error', err.message || 'No se pudo cambiar el estado.');
    }
}

async function createUser() {
    const name = document.getElementById('new-user-name')?.value.trim();
    const email = document.getElementById('new-user-email')?.value.trim();
    const role = document.getElementById('new-user-role')?.value;
    const errEl = document.getElementById('create-user-error');
    const errMsg = document.getElementById('create-user-error-msg');

    if (!name || !email || !role) {
        if (errMsg) errMsg.textContent = 'Completá todos los campos requeridos.';
        if (errEl) errEl.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons({ el: errEl });
        return;
    }

    try {
        const sbResult = await SupabaseWriter.createUserProfile({ full_name: name, email, role });
        if (!sbResult) {
            const result = UserRepository.create({ full_name: name, email, role });
            if (!result.success) throw new Error(result.error);
        } else {
            await DataLoader.reloadUsers();
        }
        closeModal();
        showToast('success', 'Usuario creado', 'Se enviaron las credenciales temporales al email.');
        setTimeout(() => Router.render(), 400);
    } catch (err) {
        if (errMsg) errMsg.textContent = err.message || 'Error al crear el usuario.';
        if (errEl) errEl.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons({ el: errEl });
    }
}

// ============================================================
// DOCUMENT UPLOAD — ANALYTIC DETAIL PAGE
// ============================================================

function openDocumentUpload(analyticId) {
    const input = document.getElementById('detail-upload-input-' + analyticId);
    if (input) input.click();
}

async function handleDetailFileSelect(event, analyticId) {
    const files = event.target.files;
    if (!files || !files.length) return;

    let uploaded = 0;
    let errors = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
            showToast('warning', 'Archivo muy grande', `${file.name} supera los 5MB.`);
            errors++;
            continue;
        }
        try {
            const result = await SupabaseWriter.uploadDocument(analyticId, file);
            if (!result) {
                // mock fallback: add filename to local analytic
                const analytic = AnalyticRepository.getById(analyticId);
                if (analytic) {
                    if (!Array.isArray(analytic.documents)) analytic.documents = [];
                    analytic.documents.push(file.name);
                }
            }
            uploaded++;
        } catch (err) {
            console.error('Upload error:', err);
            showToast('error', 'Error al subir', `${file.name}: ${err.message}`);
            errors++;
        }
    }

    if (uploaded > 0) {
        await DataLoader.reloadAnalytics();
        showToast('success', 'Documentos adjuntados', `${uploaded} archivo(s) subidos.`);
        // Re-render content area with fresh data
        const { params } = Router.parseHash();
        const main = document.querySelector('.main-content');
        if (main && params[0]) {
            main.innerHTML = renderAnalyticsDetailPage(params[0]);
            if (window.lucide) window.lucide.createIcons({ el: main });
        }
    }
}

