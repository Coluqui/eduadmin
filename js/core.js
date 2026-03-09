/* ============================================================
   EDUADMIN — core.js
   Constants · Mock Data · State · Auth
   ============================================================ */

'use strict';

// ============================================================
// CONSTANTS
// ============================================================

const STATUS = {
    BORRADOR: 'borrador',
    EN_REVISION: 'en_revision',
    DEVUELTO: 'devuelto',
    APROBADO: 'aprobado',
    ENVIADO: 'enviado'
};

const ROLES = {
    SUPER_ADMIN: 'super_admin',
    SECRETARIA: 'secretaria',
    ATENCION: 'atencion',
    DIRECTOR: 'director'
};

const STATUS_LABELS = {
    borrador: 'Borrador',
    en_revision: 'En revisión',
    devuelto: 'Devuelto',
    aprobado: 'Aprobado',
    enviado: 'Enviado'
};

const STATUS_CSS_CLASS = {
    borrador: 'chip-draft',
    en_revision: 'chip-review',
    devuelto: 'chip-returned',
    aprobado: 'chip-approved',
    enviado: 'chip-sent'
};

const ROLE_LABELS = {
    super_admin: 'Super Admin',
    secretaria: 'Secretaria',
    atencion: 'Atención',
    director: 'Director/a'
};

const ANALYTIC_TRANSITIONS = {
    borrador: ['en_revision'],
    en_revision: ['aprobado', 'devuelto'],
    devuelto: ['en_revision'],
    aprobado: ['enviado'],
    enviado: []
};

// Which roles can trigger each transition
const TRANSITION_ROLES = {
    borrador_en_revision: ['secretaria', 'super_admin'],
    en_revision_aprobado: ['director', 'super_admin'],
    en_revision_devuelto: ['director', 'super_admin'],
    devuelto_en_revision: ['secretaria', 'super_admin'],
    aprobado_enviado: ['secretaria', 'super_admin']
};

// Routes and their allowed roles (null = public)
const ROUTE_ROLES = {
    login: null,
    dashboard: ['super_admin', 'secretaria', 'atencion', 'director'],
    analiticos: ['super_admin', 'secretaria', 'atencion', 'director'],
    alumnos: ['super_admin', 'secretaria', 'atencion', 'director'],
    usuarios: ['super_admin'],
    configuracion: ['super_admin']
};

// NAV items with roles that can see each item
const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', roles: ['super_admin', 'secretaria', 'atencion', 'director'] },
    { id: 'analiticos', label: 'Analíticos', icon: 'file-text', roles: ['super_admin', 'secretaria', 'director'] },
    { id: 'alumnos', label: 'Alumnos', icon: 'users', roles: ['super_admin', 'secretaria', 'atencion', 'director'] },
    { id: 'usuarios', label: 'Usuarios', icon: 'user-cog', roles: ['super_admin'] },
    { id: 'configuracion', label: 'Configuración', icon: 'settings', roles: ['super_admin'] }
];

// ============================================================
// MOCK DATABASE
// ============================================================

const MOCK_DB = {
    institution: {
        id: 'inst-001',
        name: 'E.T. N° 5 "Juan B. Justo"',
        full_name: 'Escuela Técnica N° 5 "Juan B. Justo"',
        cue: '060-0789-01',
        jurisdiction: 'Buenos Aires'
    },

    users: [
        { id: 'u1', full_name: 'Carlos EduAdmin', email: 'admin@escuela5.edu.ar', role: 'super_admin', is_active: true, password: 'admin123', avatar_url: 'img/carlos.png', created_at: '2024-02-01T10:00:00Z' },
        { id: 'usr-002', full_name: 'María González', email: 'secretaria@escuela5.edu.ar', role: 'secretaria', is_active: true, password: 'sec123', created_at: '2024-02-01T10:00:00Z' },
        { id: 'usr-003', full_name: 'Roberto Sánchez', email: 'atencion@escuela5.edu.ar', role: 'atencion', is_active: true, password: 'ate123', created_at: '2024-02-01T10:00:00Z' },
        { id: 'usr-004', full_name: 'Dra. Ana Fernández', email: 'director@escuela5.edu.ar', role: 'director', is_active: true, password: 'dir123', created_at: '2024-02-01T10:00:00Z' },
        { id: 'usr-005', full_name: 'Laura Martínez', email: 'lmartinez@escuela5.edu.ar', role: 'secretaria', is_active: false, password: 'pass123', created_at: '2024-03-15T10:00:00Z' },
        { id: 'usr-006', full_name: 'Pablo Acosta', email: 'pacosta@escuela5.edu.ar', role: 'atencion', is_active: true, password: 'pass123', created_at: '2024-04-10T10:00:00Z' }
    ],

    students: [
        { id: 'stu-001', full_name: 'Valentina Rodríguez', dni: '45123456', birth_date: '2006-03-15', graduation_year: 2024, curso: '6° A', is_active: false },
        { id: 'stu-002', full_name: 'Tomás Pérez', dni: '45234567', birth_date: '2006-07-22', graduation_year: 2024, curso: '6° B', is_active: false },
        { id: 'stu-003', full_name: 'Lucía Herrera', dni: '46345678', birth_date: '2007-01-10', graduation_year: 2024, curso: '6° A', is_active: false },
        { id: 'stu-004', full_name: 'Mateo Gómez', dni: '46456789', birth_date: '2006-09-30', graduation_year: 2024, curso: '6° C', is_active: false },
        { id: 'stu-005', full_name: 'Isabella Torres', dni: '46567890', birth_date: '2007-05-18', graduation_year: 2024, curso: '6° A', is_active: false },
        { id: 'stu-006', full_name: 'Nicolás Ramírez', dni: '45678901', birth_date: '2005-12-03', graduation_year: 2023, curso: '6° B', is_active: false },
        { id: 'stu-007', full_name: 'Sofía Díaz', dni: '44789012', birth_date: '2005-08-25', graduation_year: 2023, curso: '6° A', is_active: false },
        { id: 'stu-008', full_name: 'Agustín López', dni: '46890123', birth_date: '2007-02-14', graduation_year: 2024, curso: '6° C', is_active: false },
        { id: 'stu-009', full_name: 'Camila Ortiz', dni: '46901234', birth_date: '2006-11-07', graduation_year: 2024, curso: '6° B', is_active: false },
        { id: 'stu-010', full_name: 'Benjamín Castro', dni: '47012345', birth_date: '2007-04-19', graduation_year: 2025, curso: '5° A', is_active: true }
    ],

    analytics: [
        {
            id: 'ana-001', student_id: 'stu-001', status: 'aprobado',
            created_by: 'usr-002', assigned_to: 'usr-004',
            created_at: '2025-01-10T09:00:00Z', updated_at: '2025-01-18T14:30:00Z',
            grades: {
                '2022': { matematica: 8, lengua: 9, historia: 7, fisica: 7, quimica: 8, ingles: 9, ed_fisica: 8, tecnologia: 9 },
                '2023': { matematica: 9, lengua: 8, historia: 8, fisica: 8, quimica: 9, ingles: 10, ed_fisica: 9, tecnologia: 9 },
                '2024': { matematica: 9, lengua: 9, historia: 9, fisica: 9, quimica: 8, ingles: 10, ed_fisica: 9, tecnologia: 10 }
            },
            pending_subjects: [],
            equivalencies: [],
            documents: ['legajo_identidad.pdf', 'constancia_egreso.pdf']
        },
        {
            id: 'ana-002', student_id: 'stu-002', status: 'en_revision',
            created_by: 'usr-002', assigned_to: 'usr-004',
            created_at: '2025-01-15T10:30:00Z', updated_at: '2025-01-20T09:15:00Z',
            grades: {
                '2022': { matematica: 7, lengua: 8, historia: 6, fisica: 7, quimica: 7, ingles: 8, ed_fisica: 9, tecnologia: 8 },
                '2023': { matematica: 8, lengua: 7, historia: 7, fisica: 7, quimica: 8, ingles: 8, ed_fisica: 8, tecnologia: 9 },
                '2024': { matematica: 8, lengua: 8, historia: 8, fisica: 8, quimica: 7, ingles: 9, ed_fisica: 9, tecnologia: 8 }
            },
            pending_subjects: [],
            equivalencies: [],
            documents: ['legajo_identidad.pdf']
        },
        {
            id: 'ana-003', student_id: 'stu-003', status: 'devuelto',
            created_by: 'usr-002', assigned_to: 'usr-004',
            created_at: '2025-01-08T08:00:00Z', updated_at: '2025-01-19T11:00:00Z',
            grades: {
                '2022': { matematica: 6, lengua: 7, historia: 8, fisica: 6, quimica: 7, ingles: 7, ed_fisica: 8, tecnologia: 7 },
                '2023': { matematica: 7, lengua: 8, historia: 7, fisica: 7, quimica: 6, ingles: 8, ed_fisica: 9, tecnologia: 8 },
                '2024': { matematica: 7, lengua: 7, historia: 8, fisica: 7, quimica: 7, ingles: 8, ed_fisica: 8, tecnologia: 7 }
            },
            pending_subjects: [{ materia: 'Física', anio: '2022', tipo: 'adeudada' }],
            equivalencies: [],
            documents: ['legajo_identidad.pdf']
        },
        {
            id: 'ana-004', student_id: 'stu-004', status: 'borrador',
            created_by: 'usr-002', assigned_to: 'usr-004',
            created_at: '2025-01-22T13:00:00Z', updated_at: '2025-01-22T13:00:00Z',
            grades: {
                '2022': { matematica: 8, lengua: 9, historia: 7, fisica: 8, quimica: 8, ingles: 8, ed_fisica: 9, tecnologia: 9 },
                '2023': { matematica: null, lengua: 8, historia: 8, fisica: 7, quimica: 8, ingles: 9, ed_fisica: 8, tecnologia: 9 },
                '2024': {}
            },
            pending_subjects: [],
            equivalencies: [],
            documents: []
        },
        {
            id: 'ana-005', student_id: 'stu-005', status: 'enviado',
            created_by: 'usr-002', assigned_to: 'usr-004',
            created_at: '2024-12-10T09:00:00Z', updated_at: '2024-12-28T16:00:00Z',
            grades: {
                '2022': { matematica: 9, lengua: 9, historia: 9, fisica: 8, quimica: 9, ingles: 10, ed_fisica: 9, tecnologia: 10 },
                '2023': { matematica: 10, lengua: 9, historia: 9, fisica: 9, quimica: 9, ingles: 10, ed_fisica: 10, tecnologia: 10 },
                '2024': { matematica: 9, lengua: 10, historia: 9, fisica: 9, quimica: 10, ingles: 10, ed_fisica: 10, tecnologia: 10 }
            },
            pending_subjects: [],
            equivalencies: [],
            documents: ['legajo_identidad.pdf', 'constancia_egreso.pdf', 'acta_examen.pdf']
        },
        {
            id: 'ana-006', student_id: 'stu-006', status: 'enviado',
            created_by: 'usr-002', assigned_to: 'usr-004',
            created_at: '2024-11-05T10:00:00Z', updated_at: '2024-11-25T14:00:00Z',
            grades: {
                '2021': { matematica: 7, lengua: 8, historia: 7, fisica: 7, quimica: 7, ingles: 8, ed_fisica: 8, tecnologia: 8 },
                '2022': { matematica: 8, lengua: 8, historia: 8, fisica: 8, quimica: 8, ingles: 9, ed_fisica: 8, tecnologia: 9 },
                '2023': { matematica: 8, lengua: 8, historia: 8, fisica: 8, quimica: 8, ingles: 9, ed_fisica: 9, tecnologia: 9 }
            },
            pending_subjects: [],
            equivalencies: [],
            documents: ['legajo_identidad.pdf', 'constancia_egreso.pdf']
        },
        {
            id: 'ana-007', student_id: 'stu-009', status: 'borrador',
            created_by: 'usr-002', assigned_to: 'usr-004',
            created_at: '2025-01-23T10:00:00Z', updated_at: '2025-01-23T10:00:00Z',
            grades: {
                '2022': { matematica: 7, lengua: 7, historia: 8, fisica: 6, quimica: 7, ingles: 7, ed_fisica: 8, tecnologia: 8 },
                '2023': {},
                '2024': {}
            },
            pending_subjects: [],
            equivalencies: [],
            documents: []
        }
    ],

    history: [
        { id: 'h-001', analytic_id: 'ana-001', user_id: 'usr-002', action: 'Analítico creado', previous_status: null, new_status: 'borrador', observation: null, created_at: '2025-01-10T09:00:00Z' },
        { id: 'h-002', analytic_id: 'ana-001', user_id: 'usr-002', action: 'Enviado a revisión', previous_status: 'borrador', new_status: 'en_revision', observation: null, created_at: '2025-01-12T11:30:00Z' },
        { id: 'h-003', analytic_id: 'ana-001', user_id: 'usr-004', action: 'Devuelto con observación', previous_status: 'en_revision', new_status: 'devuelto', observation: 'Verificar calificación de Física en 2022. El registro físico indica 9 y no 7 como está cargado.', created_at: '2025-01-14T10:15:00Z' },
        { id: 'h-004', analytic_id: 'ana-001', user_id: 'usr-002', action: 'Corregido y re-enviado', previous_status: 'devuelto', new_status: 'en_revision', observation: null, created_at: '2025-01-16T09:00:00Z' },
        { id: 'h-005', analytic_id: 'ana-001', user_id: 'usr-004', action: 'Analítico aprobado', previous_status: 'en_revision', new_status: 'aprobado', observation: null, created_at: '2025-01-18T14:30:00Z' },

        { id: 'h-006', analytic_id: 'ana-002', user_id: 'usr-002', action: 'Analítico creado', previous_status: null, new_status: 'borrador', observation: null, created_at: '2025-01-15T10:30:00Z' },
        { id: 'h-007', analytic_id: 'ana-002', user_id: 'usr-002', action: 'Enviado a revisión', previous_status: 'borrador', new_status: 'en_revision', observation: null, created_at: '2025-01-20T09:15:00Z' },

        { id: 'h-008', analytic_id: 'ana-003', user_id: 'usr-002', action: 'Analítico creado', previous_status: null, new_status: 'borrador', observation: null, created_at: '2025-01-08T08:00:00Z' },
        { id: 'h-009', analytic_id: 'ana-003', user_id: 'usr-002', action: 'Enviado a revisión', previous_status: 'borrador', new_status: 'en_revision', observation: null, created_at: '2025-01-10T09:00:00Z' },
        { id: 'h-010', analytic_id: 'ana-003', user_id: 'usr-004', action: 'Devuelto con observación', previous_status: 'en_revision', new_status: 'devuelto', observation: 'Falta registrar la materia Física adeudada del año 2022 según el acta de examen adjunta. Corregir antes de aprobar.', created_at: '2025-01-19T11:00:00Z' },

        { id: 'h-011', analytic_id: 'ana-004', user_id: 'usr-002', action: 'Analítico creado', previous_status: null, new_status: 'borrador', observation: null, created_at: '2025-01-22T13:00:00Z' },

        { id: 'h-012', analytic_id: 'ana-005', user_id: 'usr-002', action: 'Analítico creado', previous_status: null, new_status: 'borrador', observation: null, created_at: '2024-12-10T09:00:00Z' },
        { id: 'h-013', analytic_id: 'ana-005', user_id: 'usr-002', action: 'Enviado a revisión', previous_status: 'borrador', new_status: 'en_revision', observation: null, created_at: '2024-12-15T10:00:00Z' },
        { id: 'h-014', analytic_id: 'ana-005', user_id: 'usr-004', action: 'Analítico aprobado', previous_status: 'en_revision', new_status: 'aprobado', observation: null, created_at: '2024-12-20T11:00:00Z' },
        { id: 'h-015', analytic_id: 'ana-005', user_id: 'usr-002', action: 'Enviado a SInIDE/ReFE', previous_status: 'aprobado', new_status: 'enviado', observation: null, created_at: '2024-12-28T16:00:00Z' },

        { id: 'h-016', analytic_id: 'ana-006', user_id: 'usr-002', action: 'Analítico creado', previous_status: null, new_status: 'borrador', observation: null, created_at: '2024-11-05T10:00:00Z' },
        { id: 'h-017', analytic_id: 'ana-006', user_id: 'usr-002', action: 'Enviado a revisión', previous_status: 'borrador', new_status: 'en_revision', observation: null, created_at: '2024-11-10T09:00:00Z' },
        { id: 'h-018', analytic_id: 'ana-006', user_id: 'usr-004', action: 'Analítico aprobado', previous_status: 'en_revision', new_status: 'aprobado', observation: null, created_at: '2024-11-15T10:00:00Z' },
        { id: 'h-019', analytic_id: 'ana-006', user_id: 'usr-002', action: 'Enviado a SInIDE/ReFE', previous_status: 'aprobado', new_status: 'enviado', observation: null, created_at: '2024-11-25T14:00:00Z' }
    ],
    activity_feed: [
        { id: 'af1', type: 'info', text: 'Se ha cargado un nuevo analítico para Valentina Rodríguez', timestamp: new Date(Date.now() - 3600000).toISOString(), icon: 'file-plus', route: 'analiticos/ana-001' },
        { id: 'af2', type: 'success', text: 'Analítico aprobado: Tomás Pérez (6° B)', timestamp: new Date(Date.now() - 7200000).toISOString(), icon: 'check', route: 'analiticos/ana-002' },
        { id: 'af3', type: 'warning', text: 'Observación en analítico de Lucía Herrera', timestamp: new Date(Date.now() - 86400000).toISOString(), icon: 'alert-triangle', route: 'analiticos/ana-003' },
        { id: 'af4', type: 'info', text: 'Nuevo mensaje de Secretaría: "Revisar legajos 2024"', timestamp: new Date(Date.now() - 172800000).toISOString(), icon: 'message-square', route: 'configuracion' }
    ]
};

// ============================================================
// STATE MANAGEMENT (Observer pattern)
// ============================================================

const AppState = (function () {
    const _state = {
        currentUser: null,
        theme: localStorage.getItem('eduadmin_theme') || 'light',
        notifications: [],
        analyticsDirtyData: {}
    };
    const _listeners = {};

    return {
        get(key) { return _state[key]; },
        set(key, value) {
            _state[key] = value;
            if (_listeners[key]) {
                _listeners[key].forEach(fn => fn(value));
            }
        },
        subscribe(key, fn) {
            if (!_listeners[key]) _listeners[key] = [];
            _listeners[key].push(fn);
        }
    };
})();

// ============================================================
// AUTHENTICATION
// ============================================================

const Auth = {
    async login(email, password) {
        if (!email || !password) {
            return { success: false, error: 'Email o contraseña incorrectos.' };
        }

        if (!supabaseClient) {
            console.warn('Usando Login Mock (Supabase no configurado)');
            return this._loginMock(email, password);
        }

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                return { success: false, error: error.message || 'Error al iniciar sesión.' };
            }

            const user = data.user;

            // Consultar la tabla profiles para obtener metadata adicional (rol, full_name)
            let userRole = ROLES.ATENCION;
            let userFullName = user.user_metadata?.full_name || user.email.split('@')[0];

            try {
                const { data: profileData, error: profileError } = await supabaseClient
                    .from('profiles')
                    .select('role, full_name')
                    .eq('id', user.id)
                    .single();

                if (!profileError && profileData) {
                    if (profileData.role) userRole = profileData.role;
                    if (profileData.full_name) userFullName = profileData.full_name;
                }
            } catch (err) {
                console.error('Error fetching profile in login:', err);
            }

            const safeUser = {
                id: user.id,
                email: user.email,
                full_name: userFullName,
                role: userRole,
                is_active: true
            };

            AppState.set('currentUser', safeUser);
            sessionStorage.setItem('eduadmin_user', JSON.stringify(safeUser));
            return { success: true, user: safeUser };
        } catch (err) {
            console.error('Login error:', err);
            return { success: false, error: 'Ocurrió un error inesperado.' };
        }
    },

    async logout() {
        if (supabaseClient) await supabaseClient.auth.signOut();
        AppState.set('currentUser', null);
        sessionStorage.removeItem('eduadmin_user');
    },

    async restoreSession() {
        if (!supabaseClient) {
            const stored = sessionStorage.getItem('eduadmin_user');
            if (stored) {
                try { AppState.set('currentUser', JSON.parse(stored)); } catch (e) { }
            }
            return;
        }

        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            const user = session.user;

            // Consultar la tabla profiles para obtener metadata adicional (rol, full_name)
            let userRole = ROLES.ATENCION;
            let userFullName = user.user_metadata?.full_name || user.email.split('@')[0];

            try {
                const { data: profileData, error: profileError } = await supabaseClient
                    .from('profiles')
                    .select('role, full_name')
                    .eq('id', user.id)
                    .single();

                if (!profileError && profileData) {
                    if (profileData.role) userRole = profileData.role;
                    if (profileData.full_name) userFullName = profileData.full_name;
                }
            } catch (err) {
                console.error('Error fetching profile in restoreSession:', err);
            }

            const safeUser = {
                id: user.id,
                email: user.email,
                full_name: userFullName,
                role: userRole,
                is_active: true
            };
            AppState.set('currentUser', safeUser);
            sessionStorage.setItem('eduadmin_user', JSON.stringify(safeUser));
        } else {
            AppState.set('currentUser', null);
            sessionStorage.removeItem('eduadmin_user');
        }
    },

    _loginMock(email, password) {
        const user = MOCK_DB.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user || user.password !== password) {
            return { success: false, error: 'Email o contraseña incorrectos.' };
        }
        const { password: _pw, ...safeUser } = user;
        AppState.set('currentUser', safeUser);
        sessionStorage.setItem('eduadmin_user', JSON.stringify(safeUser));
        return { success: true, user: safeUser };
    },

    getCurrentUser() { return AppState.get('currentUser'); },
    isAuthenticated() { return !!AppState.get('currentUser'); },

    hasRole(...roles) {
        const user = this.getCurrentUser();
        return user && roles.includes(user.role);
    },

    canEditAnalytic() {
        return this.hasRole(ROLES.SECRETARIA, ROLES.SUPER_ADMIN);
    },

    canApproveAnalytic() {
        return this.hasRole(ROLES.DIRECTOR, ROLES.SUPER_ADMIN);
    },

    canManageUsers() {
        return this.hasRole(ROLES.SUPER_ADMIN);
    }
};

// ============================================================
// REPOSITORY — data access layer
// ============================================================

const AnalyticRepository = {
    getAll(filters) {
        let list = [...MOCK_DB.analytics];
        if (filters) {
            if (filters.status && filters.status !== 'all') {
                list = list.filter(a => a.status === filters.status);
            }
            if (filters.year && filters.year !== 'all') {
                list = list.filter(a => Object.keys(a.grades).includes(filters.year));
            }
            if (filters.query) {
                const q = filters.query.toLowerCase();
                list = list.filter(a => {
                    const stu = MOCK_DB.students.find(s => s.id === a.student_id);
                    return stu && (stu.full_name.toLowerCase().includes(q) || stu.dni.includes(q));
                });
            }
        }
        return list;
    },

    getById(id) {
        return MOCK_DB.analytics.find(a => a.id === id) || null;
    },

    getHistoryByAnalyticId(analyticId) {
        return MOCK_DB.history
            .filter(h => h.analytic_id === analyticId)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    changeStatus(analyticId, newStatus, observation) {
        const analytic = MOCK_DB.analytics.find(a => a.id === analyticId);
        if (!analytic) return { success: false, error: 'Analítico no encontrado.' };

        const user = Auth.getCurrentUser();
        const prevStatus = analytic.status;

        // Add history entry (append-only — no UPDATE/DELETE)
        const actionLabel = {
            en_revision: 'Enviado a revisión',
            aprobado: 'Analítico aprobado',
            devuelto: 'Devuelto con observación',
            enviado: 'Enviado a SInIDE/ReFE'
        }[newStatus] || 'Estado actualizado';

        MOCK_DB.history.push({
            id: 'h-' + Date.now(),
            analytic_id: analyticId,
            user_id: user.id,
            action: actionLabel,
            previous_status: prevStatus,
            new_status: newStatus,
            observation: observation || null,
            created_at: new Date().toISOString()
        });

        analytic.status = newStatus;
        analytic.updated_at = new Date().toISOString();
        return { success: true };
    },

    createAnalytic(data) {
        const user = Auth.getCurrentUser();
        const newAnalytic = {
            id: 'ana-' + Date.now(),
            student_id: data.student_id,
            status: STATUS.BORRADOR,
            created_by: user.id,
            assigned_to: 'usr-004',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            grades: data.grades || {},
            pending_subjects: data.pending_subjects || [],
            equivalencies: data.equivalencies || [],
            documents: data.documents || []
        };
        MOCK_DB.analytics.push(newAnalytic);
        MOCK_DB.history.push({
            id: 'h-' + Date.now(),
            analytic_id: newAnalytic.id,
            user_id: user.id,
            action: 'Analítico creado',
            previous_status: null,
            new_status: STATUS.BORRADOR,
            observation: null,
            created_at: new Date().toISOString()
        });
        return { success: true, analytic: newAnalytic };
    }
};

const StudentRepository = {
    getAll() { return MOCK_DB.students; },
    getById(id) { return MOCK_DB.students.find(s => s.id === id) || null; },
    search(query) {
        if (!query || query.length < 3) return [];
        const q = query.toLowerCase();
        return MOCK_DB.students.filter(s =>
            s.full_name.toLowerCase().includes(q) || s.dni.includes(q)
        );
    },
    getAnalytics(studentId) {
        return MOCK_DB.analytics.filter(a => a.student_id === studentId);
    }
};

const UserRepository = {
    getAll() { return MOCK_DB.users.map(u => { const { password: _, ...safe } = u; return safe; }); },
    getById(id) {
        const u = MOCK_DB.users.find(u => u.id === id);
        if (!u) return null;
        const { password: _, ...safe } = u;
        return safe;
    },
    create(data) {
        const exists = MOCK_DB.users.find(u => u.email === data.email);
        if (exists) return { success: false, error: 'Ya existe un usuario con ese email.' };
        const newUser = {
            id: 'usr-' + Date.now(),
            full_name: data.full_name,
            email: data.email,
            role: data.role,
            is_active: true,
            password: 'temp123',
            created_at: new Date().toISOString()
        };
        MOCK_DB.users.push(newUser);
        return { success: true, user: newUser };
    },
    toggleActive(id) {
        const user = MOCK_DB.users.find(u => u.id === id);
        if (!user) return { success: false };
        const currentUser = Auth.getCurrentUser();
        if (user.id === currentUser.id) return { success: false, error: 'No podés desactivar tu propia cuenta.' };
        user.is_active = !user.is_active;
        return { success: true, is_active: user.is_active };
    }
};

const DashboardRepository = {
    getMetrics() {
        const analytics = MOCK_DB.analytics;
        return {
            totalEnProceso: analytics.filter(a => ['borrador', 'en_revision', 'devuelto'].includes(a.status)).length,
            aprobadosMes: analytics.filter(a => a.status === 'aprobado').length,
            conProblemas: analytics.filter(a => a.status === 'devuelto').length,
            totalAlumnos: MOCK_DB.students.length
        };
    },
    getRecentActivity() {
        return MOCK_DB.history
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 8);
    },
    getActiveAlerts() {
        return MOCK_DB.analytics
            .filter(a => a.status === 'devuelto' || a.status === 'en_revision')
            .map(a => ({
                analytic: a,
                student: MOCK_DB.students.find(s => s.id === a.student_id),
                isUrgent: a.status === 'devuelto'
            }))
            .slice(0, 5);
    }
};

// ============================================================
// UTILITIES
// ============================================================

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatDate(isoString) {
    if (!isoString) return '—';
    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date(isoString));
}

function formatDateTime(isoString) {
    if (!isoString) return '—';
    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(new Date(isoString));
}

function timeAgo(isoString) {
    if (!isoString) return '';
    const now = new Date();
    const date = new Date(isoString);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} hs`;
    if (diff < 86400 * 30) return `hace ${Math.floor(diff / 86400)} días`;
    return formatDate(isoString);
}

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function getUserById(id) { return UserRepository.getById(id); }
function getStudentById(id) { return StudentRepository.getById(id); }

function gradeAverage(gradesObj) {
    const vals = Object.values(gradesObj || {}).filter(v => v !== null && v !== undefined && v !== '');
    if (!vals.length) return null;
    return (vals.reduce((a, b) => a + Number(b), 0) / vals.length).toFixed(1);
}

function canTransitionAnalytic(currentStatus, newStatus, userRole) {
    const allowed = ANALYTIC_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) return false;
    const key = `${currentStatus}_${newStatus}`;
    const roles = TRANSITION_ROLES[key] || [];
    return roles.includes(userRole);
}
