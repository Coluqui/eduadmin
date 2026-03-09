/* ============================================================
   EDUADMIN — pages-login.js
   Login page renderer
   ============================================================ */

'use strict';

function renderLoginPage() {
  return `
    <div class="login-page">
      <div class="login-card">
        <div class="login-logo">
          <div class="login-logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M4 22L14 6L24 22H4Z" fill="white" fill-opacity="0.95"/>
              <rect x="9" y="17" width="10" height="2.5" rx="1.25" fill="white" fill-opacity="0.7"/>
            </svg>
          </div>
          <span class="login-logo-text">EduAdmin</span>
        </div>

        <div class="login-welcome">
          <div class="login-title">Bienvenido/a</div>
          <div class="login-subtitle">Iniciá sesión para acceder a la plataforma</div>
        </div>

        <div id="login-error" class="banner banner-error hidden" style="margin-bottom:16px">
          <i data-lucide="alert-circle"></i>
          <span id="login-error-msg">Email o contraseña incorrectos.</span>
        </div>

        <form class="login-form" onsubmit="handleLoginSubmit(event)">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label" for="login-email">Email institucional</label>
            <input type="email" id="login-email" class="form-input"
              placeholder="usuario@escuela.edu.ar"
              autocomplete="email" required>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label" for="login-password">Contraseña</label>
            <div class="input-wrapper">
              <input type="password" id="login-password" class="form-input"
                placeholder="Tu contraseña" autocomplete="current-password" required>
              <span class="input-suffix" onclick="togglePasswordVisibility()">
                <i data-lucide="eye" id="pw-toggle-icon"></i>
              </span>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-lg login-submit w-full" id="login-btn">
            <i data-lucide="log-in"></i> Ingresar
          </button>
        </form>

        <div class="login-forgot">
          <a href="#" onclick="handleForgotPassword(event)">Olvidé mi contraseña</a>
        </div>
      </div>
    </div>`;
}
