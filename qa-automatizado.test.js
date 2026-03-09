/**
 * EduAdmin — qa-automatizado.test.js
 * Tests automatizados con Vitest para autenticación y roles.
 * Ejecutar: npx vitest run qa-automatizado.test.js
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================
// MOCKS DE SUPABASE
// ============================================================

vi.mock('./js/supabase-config.js', () => ({
    supabaseClient: null
}));

// Mock del cliente Supabase con respuestas configurables
const mockSupabase = {
    auth: {
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn()
    },
    from: vi.fn()
};

// Helper para crear la cadena de query mock (from → select → eq → single)
function createQueryMock(data, error = null) {
    const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data, error })
    };
    mockSupabase.from.mockReturnValue(mockChain);
    return mockChain;
}

// ============================================================
// CONSTANTES Y HELPERS
// ============================================================

const ROLES = {
    SUPER_ADMIN: 'super_admin',
    SECRETARIA: 'secretaria',
    ATENCION: 'atencion',
    DIRECTOR: 'director'
};

const NAV_ITEMS_DEF = [
    { id: 'dashboard', roles: ['super_admin', 'secretaria', 'atencion', 'director'] },
    { id: 'analiticos', roles: ['super_admin', 'secretaria', 'director'] },
    { id: 'alumnos', roles: ['super_admin', 'secretaria', 'atencion', 'director'] },
    { id: 'usuarios', roles: ['super_admin'] },
    { id: 'configuracion', roles: ['super_admin'] }
];

/** Simula qué ítems del menú puede ver un usuario según su rol */
function getVisibleNavItems(userRole) {
    return NAV_ITEMS_DEF.filter(item => item.roles.includes(userRole)).map(i => i.id);
}

/** Simula resolución de rol desde tabla profiles */
async function resolveUserRoleFromProfiles(userId, supabase) {
    const { data, error } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', userId)
        .single();

    if (error || !data) return ROLES.ATENCION; // fallback seguro
    return data.role;
}

/** Función de login simplificada que refleja la lógica de core.js */
async function authLogin(email, password, supabase) {
    if (!email || !password) {
        return { success: false, error: 'Email o contraseña incorrectos.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data?.user) {
        return { success: false, error: error?.message || 'Credenciales inválidas.' };
    }

    const user = data.user;
    const role = await resolveUserRoleFromProfiles(user.id, supabase);

    return {
        success: true,
        user: {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email.split('@')[0],
            role
        }
    };
}

// ============================================================
// 1. AUTENTICACIÓN
// ============================================================

describe('QA-AUTH: Autenticación', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // QA-AUTH-01
    it('Login con credenciales correctas (director@agustinalvarez) → debe retornar usuario con super_admin', async () => {
        const fakeUser = { id: 'uuid-director', email: 'director@agustinalvarez.edu.ar', user_metadata: { full_name: 'Director Álvarez' } };
        mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: { user: fakeUser }, error: null });
        createQueryMock({ role: 'super_admin', full_name: 'Director Álvarez' });

        const result = await authLogin('director@agustinalvarez.edu.ar', 'correctpass', mockSupabase);

        expect(result.success).toBe(true);
        expect(result.user.role).toBe('super_admin');
        expect(result.user.email).toBe('director@agustinalvarez.edu.ar');
    });

    // QA-AUTH-02
    it('Login con contraseña incorrecta → debe retornar error y success=false', async () => {
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
            data: { user: null },
            error: { message: 'Invalid login credentials' }
        });

        const result = await authLogin('director@agustinalvarez.edu.ar', 'wrongpass', mockSupabase);

        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();
    });

    // QA-AUTH-03
    it('Login con email inexistente → debe retornar error y success=false', async () => {
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
            data: { user: null },
            error: { message: 'User not found' }
        });

        const result = await authLogin('noexiste@escuela.edu.ar', 'anypass', mockSupabase);

        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();
    });

    // QA-AUTH-04
    it('Email vacío → debe retornar error sin llamar a Supabase', async () => {
        const result = await authLogin('', 'password', mockSupabase);

        expect(result.success).toBe(false);
        expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    // QA-AUTH-05
    it('Contraseña vacía → debe retornar error sin llamar a Supabase', async () => {
        const result = await authLogin('director@agustinalvarez.edu.ar', '', mockSupabase);

        expect(result.success).toBe(false);
        expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    // QA-AUTH-06
    it('Si profiles no tiene el rol, debe usar fallback atencion', async () => {
        const fakeUser = { id: 'uuid-unknown', email: 'nuevo@escuela.edu.ar', user_metadata: {} };
        mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: { user: fakeUser }, error: null });
        createQueryMock(null, { message: 'No rows found' }); // Sin perfil

        const result = await authLogin('nuevo@escuela.edu.ar', 'pass', mockSupabase);

        expect(result.success).toBe(true);
        expect(result.user.role).toBe(ROLES.ATENCION); // fallback seguro
    });

});

// ============================================================
// 2. ROLES Y MENÚ LATERAL
// ============================================================

describe('QA-ROLES: Visibilidad del menú según rol', () => {

    it('super_admin → ve todos los ítems del menú', () => {
        const visible = getVisibleNavItems('super_admin');
        expect(visible).toContain('dashboard');
        expect(visible).toContain('alumnos');
        expect(visible).toContain('analiticos');
        expect(visible).toContain('usuarios');
        expect(visible).toContain('configuracion');
        expect(visible).toHaveLength(5);
    });

    it('secretaria → ve dashboard, alumnos y analiticos — NO usuarios ni configuracion', () => {
        const visible = getVisibleNavItems('secretaria');
        expect(visible).toContain('dashboard');
        expect(visible).toContain('alumnos');
        expect(visible).toContain('analiticos');
        expect(visible).not.toContain('usuarios');
        expect(visible).not.toContain('configuracion');
    });

    it('atencion → ve solo dashboard y alumnos', () => {
        const visible = getVisibleNavItems('atencion');
        expect(visible).toContain('dashboard');
        expect(visible).toContain('alumnos');
        expect(visible).not.toContain('analiticos');
        expect(visible).not.toContain('usuarios');
        expect(visible).not.toContain('configuracion');
        expect(visible).toHaveLength(2);
    });

    it('director → ve dashboard, alumnos y analiticos — NO usuarios ni configuracion', () => {
        const visible = getVisibleNavItems('director');
        expect(visible).toContain('dashboard');
        expect(visible).toContain('alumnos');
        expect(visible).toContain('analiticos');
        expect(visible).not.toContain('usuarios');
        expect(visible).not.toContain('configuracion');
    });

    it('rol inexistente → no ve ningún ítem', () => {
        const visible = getVisibleNavItems('desconocido');
        expect(visible).toHaveLength(0);
    });

});

// ============================================================
// 3. PERMISOS DE RUTAS
// ============================================================

describe('QA-PERMISOS: Control de acceso por ruta', () => {

    const ROUTE_ROLES = {
        login: null,
        dashboard: ['super_admin', 'secretaria', 'atencion', 'director'],
        analiticos: ['super_admin', 'secretaria', 'atencion', 'director'],
        alumnos: ['super_admin', 'secretaria', 'atencion', 'director'],
        usuarios: ['super_admin'],
        configuracion: ['super_admin']
    };

    function canAccess(route, userRole) {
        const allowed = ROUTE_ROLES[route];
        if (allowed === null) return true; // ruta pública
        if (!userRole) return false; // sin sesión
        return allowed.includes(userRole);
    }

    it('atencion no puede acceder a configuracion', () => {
        expect(canAccess('configuracion', 'atencion')).toBe(false);
    });

    it('atencion no puede acceder a usuarios', () => {
        expect(canAccess('usuarios', 'atencion')).toBe(false);
    });

    it('super_admin puede acceder a configuracion', () => {
        expect(canAccess('configuracion', 'super_admin')).toBe(true);
    });

    it('secretaria puede acceder a analiticos', () => {
        expect(canAccess('analiticos', 'secretaria')).toBe(true);
    });

    it('usuario sin sesión (null) no puede acceder al dashboard', () => {
        expect(canAccess('dashboard', null)).toBe(false);
    });

    it('login es ruta pública — accesible sin sesión', () => {
        expect(canAccess('login', null)).toBe(true);
    });

});

// ============================================================
// 4. TRANSICIONES DE ESTADO — ANALÍTICOS
// ============================================================

describe('QA-ANA: Transiciones de estado en analíticos', () => {

    const ANALYTIC_TRANSITIONS = {
        borrador: ['en_revision'],
        en_revision: ['aprobado', 'devuelto'],
        devuelto: ['en_revision'],
        aprobado: ['enviado'],
        enviado: []
    };

    const TRANSITION_ROLES = {
        borrador_en_revision: ['secretaria', 'super_admin'],
        en_revision_aprobado: ['director', 'super_admin'],
        en_revision_devuelto: ['director', 'super_admin'],
        devuelto_en_revision: ['secretaria', 'super_admin'],
        aprobado_enviado: ['secretaria', 'super_admin']
    };

    function canTransition(currentStatus, newStatus, userRole) {
        const allowed = ANALYTIC_TRANSITIONS[currentStatus] || [];
        if (!allowed.includes(newStatus)) return false;
        const key = `${currentStatus}_${newStatus}`;
        const roles = TRANSITION_ROLES[key] || [];
        return roles.includes(userRole);
    }

    it('secretaria puede enviar borrador a revisión', () => {
        expect(canTransition('borrador', 'en_revision', 'secretaria')).toBe(true);
    });

    it('atencion NO puede enviar borrador a revisión', () => {
        expect(canTransition('borrador', 'en_revision', 'atencion')).toBe(false);
    });

    it('director puede aprobar un analítico en revisión', () => {
        expect(canTransition('en_revision', 'aprobado', 'director')).toBe(true);
    });

    it('secretaria NO puede aprobar un analítico en revisión', () => {
        expect(canTransition('en_revision', 'aprobado', 'secretaria')).toBe(false);
    });

    it('director puede devolver un analítico en revisión', () => {
        expect(canTransition('en_revision', 'devuelto', 'director')).toBe(true);
    });

    it('no se puede saltar de borrador a aprobado directamente', () => {
        expect(canTransition('borrador', 'aprobado', 'super_admin')).toBe(false);
    });

    it('no se puede revertir un analítico enviado', () => {
        expect(canTransition('enviado', 'aprobado', 'super_admin')).toBe(false);
        expect(canTransition('enviado', 'borrador', 'super_admin')).toBe(false);
    });

    it('super_admin puede ejecutar cualquier transición válida', () => {
        expect(canTransition('borrador', 'en_revision', 'super_admin')).toBe(true);
        expect(canTransition('en_revision', 'aprobado', 'super_admin')).toBe(true);
        expect(canTransition('aprobado', 'enviado', 'super_admin')).toBe(true);
    });

});

// ============================================================
// 5. RESOLUCIÓN DE ROL DESDE PROFILES
// ============================================================

describe('QA-PROFILES: Lectura de rol desde tabla profiles', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Devuelve el rol correcto cuando profiles responde con datos válidos', async () => {
        createQueryMock({ role: 'super_admin', full_name: 'Director Test' });

        const role = await resolveUserRoleFromProfiles('uuid-001', mockSupabase);
        expect(role).toBe('super_admin');
    });

    it('Devuelve el rol secretaria cuando profiles lo indica', async () => {
        createQueryMock({ role: 'secretaria', full_name: 'Secretaria Test' });

        const role = await resolveUserRoleFromProfiles('uuid-002', mockSupabase);
        expect(role).toBe('secretaria');
    });

    it('Fallback a atencion cuando profiles retorna error', async () => {
        createQueryMock(null, { message: 'Not found' });

        const role = await resolveUserRoleFromProfiles('uuid-404', mockSupabase);
        expect(role).toBe(ROLES.ATENCION);
    });

    it('Fallback a atencion cuando profiles retorna null', async () => {
        createQueryMock(null);

        const role = await resolveUserRoleFromProfiles('uuid-null', mockSupabase);
        expect(role).toBe(ROLES.ATENCION);
    });

});
