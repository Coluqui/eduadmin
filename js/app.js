/* ============================================================
   EDUADMIN — app.js
   Application initialization + entry point
   ============================================================ */

'use strict';

(function init() {
    // 1. Restore theme preference
    const savedTheme = localStorage.getItem('eduadmin_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    AppState.set('theme', savedTheme);

    // 2. Restore session from Supabase, then load live data before first render
    Auth.restoreSession().then(async () => {
        if (Auth.isAuthenticated()) {
            await DataLoader.loadAll();
        }
        Router.render();
    });

    // 3. Listen for hash changes (SPA navigation)
    window.addEventListener('hashchange', function () {
        Router.render();
    });

    // 4. Listen for popstate (browser back/forward)
    window.addEventListener('popstate', function () {
        Router.render();
    });

    // 5. Global delegated event listener for keyboard navigation
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modal-overlay');
            if (modal) closeModal();
        }
    });

})();
