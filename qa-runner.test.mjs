/**
 * EduAdmin — qa-runner.test.mjs
 * Runner de tests compatible con Node.js built-in test runner (sin npm)
 * Ejecucion: node --test qa-runner.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ============================================================
// CONSTANTES (replicadas del código de la app)
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

const ROUTE_ROLES = {
    login: null,
    dashboard: ['super_admin', 'secretaria', 'atencion', 'director'],
    analiticos: ['super_admin', 'secretaria', 'atencion', 'director'],
    alumnos: ['super_admin', 'secretaria', 'atencion', 'director'],
    usuarios: ['super_admin'],
    configuracion: ['super_admin']
};

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

// ============================================================
// HELPERS (lógica aislada para test)
// ============================================================

function getVisibleNavItems(userRole) {
    return NAV_ITEMS_DEF.filter(item => item.roles.includes(userRole)).map(i => i.id);
}

function canAccess(route, userRole) {
    const allowed = ROUTE_ROLES[route];
    if (allowed === null) return true;
    if (!userRole) return false;
    return allowed.includes(userRole);
}

function canTransition(currentStatus, newStatus, userRole) {
    const allowed = ANALYTIC_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) return false;
    const key = `${currentStatus}_${newStatus}`;
    const roles = TRANSITION_ROLES[key] || [];
    return roles.includes(userRole);
}

async function authLogin(email, password, supabase) {
    if (!email || !password) {
        return { success: false, error: 'Email o contraseña incorrectos.' };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data?.user) {
        return { success: false, error: error?.message || 'Credenciales inválidas.' };
    }
    const user = data.user;
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

    const role = (!profileError && profile?.role) ? profile.role : ROLES.ATENCION;

    return {
        success: true,
        user: {
            id: user.id,
            email: user.email,
            full_name: profile?.full_name || user.email.split('@')[0],
            role
        }
    };
}

// ============================================================
// MOCK SUPABASE
// ============================================================

function createMockSupabase({ authResult, profileResult }) {
    return {
        auth: {
            signInWithPassword: async () => authResult
        },
        from: () => ({
            select: function () { return this; },
            eq: function () { return this; },
            single: async () => profileResult
        })
    };
}

// ============================================================
// SUITE 1 — AUTENTICACIÓN
// ============================================================

describe('QA-AUTH: Autenticación', () => {

    it('Login con credenciales correctas → success=true y rol super_admin', async () => {
        const supabase = createMockSupabase({
            authResult: {
                data: { user: { id: 'uid-1', email: 'director@agustinalvarez.edu.ar', user_metadata: { full_name: 'Director' } } },
                error: null
            },
            profileResult: { data: { role: 'super_admin', full_name: 'Director' }, error: null }
        });
        const result = await authLogin('director@agustinalvarez.edu.ar', 'correctpass', supabase);
        assert.equal(result.success, true);
        assert.equal(result.user.role, 'super_admin');
        assert.equal(result.user.email, 'director@agustinalvarez.edu.ar');
    });

    it('Login con contraseña incorrecta → success=false con error', async () => {
        const supabase = createMockSupabase({
            authResult: { data: { user: null }, error: { message: 'Invalid login credentials' } },
            profileResult: null
        });
        const result = await authLogin('director@agustinalvarez.edu.ar', 'wrongpass', supabase);
        assert.equal(result.success, false);
        assert.ok(result.error);
    });

    it('Login con email inexistente → success=false', async () => {
        const supabase = createMockSupabase({
            authResult: { data: { user: null }, error: { message: 'User not found' } },
            profileResult: null
        });
        const result = await authLogin('noexiste@escuela.edu.ar', 'anypass', supabase);
        assert.equal(result.success, false);
    });

    it('Email vacío → error sin llamar a Supabase', async () => {
        let called = false;
        const supabase = createMockSupabase({
            authResult: { data: {}, error: null },
            profileResult: null
        });
        // override para detectar si se llamó
        supabase.auth.signInWithPassword = async () => { called = true; return { data: {}, error: null }; };
        const result = await authLogin('', 'pass', supabase);
        assert.equal(result.success, false);
        assert.equal(called, false);
    });

    it('Contraseña vacía → error sin llamar a Supabase', async () => {
        let called = false;
        const supabase = createMockSupabase({ authResult: {}, profileResult: null });
        supabase.auth.signInWithPassword = async () => { called = true; return { data: {}, error: null }; };
        const result = await authLogin('usuario@edu.ar', '', supabase);
        assert.equal(result.success, false);
        assert.equal(called, false);
    });

    it('Profiles sin respuesta → fallback a rol atencion', async () => {
        const supabase = createMockSupabase({
            authResult: {
                data: { user: { id: 'uid-x', email: 'nuevo@edu.ar', user_metadata: {} } },
                error: null
            },
            profileResult: { data: null, error: { message: 'Not found' } }
        });
        const result = await authLogin('nuevo@edu.ar', 'pass', supabase);
        assert.equal(result.success, true);
        assert.equal(result.user.role, ROLES.ATENCION);
    });

});

// ============================================================
// SUITE 2 — ROLES Y NAVEGACIÓN
// ============================================================

describe('QA-ROLES: Visibilidad del menú según rol', () => {

    it('super_admin ve los 5 ítems', () => {
        const v = getVisibleNavItems('super_admin');
        assert.equal(v.length, 5);
        assert.ok(v.includes('configuracion'));
        assert.ok(v.includes('usuarios'));
    });

    it('secretaria NO ve usuarios ni configuracion', () => {
        const v = getVisibleNavItems('secretaria');
        assert.ok(!v.includes('usuarios'));
        assert.ok(!v.includes('configuracion'));
        assert.ok(v.includes('analiticos'));
    });

    it('atencion sólo ve dashboard y alumnos (2 ítems)', () => {
        const v = getVisibleNavItems('atencion');
        assert.equal(v.length, 2);
        assert.ok(!v.includes('analiticos'));
    });

    it('director NO ve usuarios ni configuracion', () => {
        const v = getVisibleNavItems('director');
        assert.ok(!v.includes('usuarios'));
        assert.ok(!v.includes('configuracion'));
        assert.ok(v.includes('analiticos'));
    });

    it('rol inexistente → 0 ítems visibles', () => {
        const v = getVisibleNavItems('fantasma');
        assert.equal(v.length, 0);
    });

});

// ============================================================
// SUITE 3 — PERMISOS DE RUTAS
// ============================================================

describe('QA-PERMISOS: Control de acceso por ruta', () => {

    it('atencion no accede a configuracion', () => {
        assert.equal(canAccess('configuracion', 'atencion'), false);
    });

    it('atencion no accede a usuarios', () => {
        assert.equal(canAccess('usuarios', 'atencion'), false);
    });

    it('super_admin accede a configuracion', () => {
        assert.equal(canAccess('configuracion', 'super_admin'), true);
    });

    it('secretaria accede a analiticos', () => {
        assert.equal(canAccess('analiticos', 'secretaria'), true);
    });

    it('sin sesión (null) no accede al dashboard', () => {
        assert.equal(canAccess('dashboard', null), false);
    });

    it('login es ruta pública', () => {
        assert.equal(canAccess('login', null), true);
    });

});

// ============================================================
// SUITE 4 — TRANSICIONES DE ESTADO EN ANALÍTICOS
// ============================================================

describe('QA-ANA: Transiciones de estado', () => {

    it('secretaria puede enviar borrador a revisión', () => {
        assert.equal(canTransition('borrador', 'en_revision', 'secretaria'), true);
    });

    it('atencion NO puede enviar borrador a revisión', () => {
        assert.equal(canTransition('borrador', 'en_revision', 'atencion'), false);
    });

    it('director puede aprobar en_revision', () => {
        assert.equal(canTransition('en_revision', 'aprobado', 'director'), true);
    });

    it('secretaria NO puede aprobar en_revision', () => {
        assert.equal(canTransition('en_revision', 'aprobado', 'secretaria'), false);
    });

    it('director puede devolver con observación', () => {
        assert.equal(canTransition('en_revision', 'devuelto', 'director'), true);
    });

    it('no se puede saltar de borrador a aprobado', () => {
        assert.equal(canTransition('borrador', 'aprobado', 'super_admin'), false);
    });

    it('analítico enviado no puede revertirse', () => {
        assert.equal(canTransition('enviado', 'aprobado', 'super_admin'), false);
        assert.equal(canTransition('enviado', 'borrador', 'super_admin'), false);
    });

    it('super_admin puede ejecutar toda la cadena válida', () => {
        assert.equal(canTransition('borrador', 'en_revision', 'super_admin'), true);
        assert.equal(canTransition('en_revision', 'aprobado', 'super_admin'), true);
        assert.equal(canTransition('aprobado', 'enviado', 'super_admin'), true);
    });

});
