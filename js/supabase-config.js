/* ============================================================
   EDUADMIN — supabase-config.js
   Supabase Client Initialization
   ============================================================ */

'use strict';

/**
 * CONFIGURACIÓN DE SUPABASE
 * Se inyectan automáticamente desde Vercel vía Vite en index.html
 */
const SUPABASE_URL = (window.ENV && window.ENV.SUPABASE_URL && window.ENV.SUPABASE_URL !== '%VITE_SUPABASE_URL%')
    ? window.ENV.SUPABASE_URL
    : 'https://apswmoescwxoleaprbuk.supabase.co';
const SUPABASE_ACCESS_TOKEN = (window.ENV && window.ENV.SUPABASE_ANON_KEY && window.ENV.SUPABASE_ANON_KEY !== '%VITE_SUPABASE_ANON_KEY%')
    ? window.ENV.SUPABASE_ANON_KEY
    : 'TU_ACCES_TOKEN_AQUI';

// Inicialización del cliente
let supabaseClient = null;

if (typeof window.supabase !== 'undefined' && SUPABASE_URL !== 'https://TU_PROYECTO.supabase.co') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ACCESS_TOKEN);
} else {
    // supabaseClient remains null
}

if (!supabaseClient && typeof SUPABASE_URL !== 'undefined') {
    console.warn('Supabase JS no se ha cargado correctamente o las credenciales faltan.');
}

