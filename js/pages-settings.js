/* ============================================================
   EDUADMIN — pages-settings.js
   Settings Page Rendering
   ============================================================ */

'use strict';

function renderSettingsPage() {
    const institution = MOCK_DB.institution;
    const currentTheme = AppState.get('theme');

    return `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Configuración</h1>
        <div class="page-subtitle">Ajustes institucionales y del sistema</div>
      </div>
    </div>

    <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--sp-6);">
        <!-- Perfil Institucional -->
        <div class="card" id="inst-profile-card">
            <div class="card-header" style="justify-content: space-between;">
                <span class="card-title">
                    <i data-lucide="building" style="margin-right: 8px; width: 18px; height: 18px; display: inline-block; vertical-align: middle;"></i>
                    Perfil Institucional
                </span>
                <button id="btn-edit-inst" class="btn btn-outline" style="height: 32px; padding: 0 var(--sp-3); font-size: 13px;" onclick="toggleInstEditMode(true)">
                    <i data-lucide="edit-2" style="width: 14px; height: 14px; margin-right: 4px;"></i> Editar
                </button>
            </div>
            <div class="card-body">
                <div class="grid-form" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--sp-4);">
                    <div class="form-group">
                        <label class="form-label">Nombre de la Institución</label>
                        <input type="text" id="inst-name" class="form-input inst-input" value="${escapeHtml(institution.name)}" disabled>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Nombre Completo</label>
                        <input type="text" id="inst-full-name" class="form-input inst-input" value="${escapeHtml(institution.full_name)}" disabled>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Número de CUE</label>
                        <input type="text" id="inst-cue" class="form-input inst-input" value="${escapeHtml(institution.cue)}" disabled>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Jurisdicción</label>
                        <input type="text" id="inst-jur" class="form-input inst-input" value="${escapeHtml(institution.jurisdiction)}" disabled>
                    </div>
                </div>
                
                <div id="inst-edit-actions" style="display: none; justify-content: flex-end; gap: var(--sp-3); margin-top: var(--sp-5); border-top: 1px solid var(--border); padding-top: var(--sp-4);">
                    <button class="btn btn-outline" onclick="toggleInstEditMode(false)">Cancelar</button>
                    <button class="btn btn-primary" onclick="saveInstProfile()">Guardar Cambios</button>
                </div>
            </div>
        </div>
    
        <script>
        window.toggleInstEditMode = function(isEditing) {
            const inputs = document.querySelectorAll('.inst-input');
            inputs.forEach(input => {
                input.disabled = !isEditing;
                if(isEditing) {
                    input.style.backgroundColor = 'var(--bg-surface)';
                    input.style.opacity = '1';
                } else {
                    input.style.backgroundColor = '';
                    input.style.opacity = '';
                }
            });
            
            document.getElementById('btn-edit-inst').style.display = isEditing ? 'none' : 'inline-flex';
            document.getElementById('inst-edit-actions').style.display = isEditing ? 'flex' : 'none';
            
            if(isEditing) {
                document.getElementById('inst-name').focus();
            } else {
                // Restore original values if canceled
                document.getElementById('inst-name').value = "${escapeHtml(institution.name)}";
                document.getElementById('inst-full-name').value = "${escapeHtml(institution.full_name)}";
                document.getElementById('inst-cue').value = "${escapeHtml(institution.cue)}";
                document.getElementById('inst-jur').value = "${escapeHtml(institution.jurisdiction)}";
            }
        };
        
        window.saveInstProfile = function() {
            // Update MOCK_DB
            MOCK_DB.institution.name = document.getElementById('inst-name').value;
            MOCK_DB.institution.full_name = document.getElementById('inst-full-name').value;
            MOCK_DB.institution.cue = document.getElementById('inst-cue').value;
            MOCK_DB.institution.jurisdiction = document.getElementById('inst-jur').value;
            
            ToastService.success('Perfil institucional actualizado');
            window.toggleInstEditMode(false);
            
            // Re-render to update sidebar
            setTimeout(() => Router.navigate('configuracion'), 500);
        };
        </script>

        <!-- Preferencias del Sistema -->
        <div class="card">
            <div class="card-header">
                <span class="card-title">
                    <i data-lucide="settings" style="margin-right: 8px; width: 18px; height: 18px; display: inline-block; vertical-align: middle;"></i>
                    Preferencias del Sistema
                </span>
            </div>
            <div class="card-body">
                <div style="display: flex; flex-direction: column; gap: var(--sp-4);">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: var(--sp-4); border-bottom: 1px solid var(--border);">
                        <div>
                            <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Modo Oscuro</div>
                            <div style="font-size: 13px; color: var(--text-muted);">Cambiar la apariencia de la plataforma a tonos oscuros (se aplica globlamente).</div>
                        </div>
                        <button class="theme-switch" onclick="toggleTheme()" aria-label="Cambiar tema" style="margin: 0; padding: 0 4px;">
                            ${currentTheme === 'dark'
            ? '<i data-lucide="moon" style="width: 16px; height: 16px; margin-left: 28px; color: white;"></i>'
            : '<i data-lucide="sun" style="width: 16px; height: 16px; color: #f59e0b;"></i>'}
                        </button>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Notificaciones por Email</div>
                            <div style="font-size: 13px; color: var(--text-muted);">Recibir resúmenes diarios de cambios de estado en analíticos.</div>
                        </div>
                        <label style="position: relative; display: inline-block; width: 44px; height: 24px;">
                            <input type="checkbox" style="opacity: 0; width: 0; height: 0;" checked onchange="ToastService.success('Preferencias actualizadas')">
                            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--color-blue); transition: .4s; border-radius: 34px;">
                                <span style="position: absolute; content: ''; height: 18px; width: 18px; left: 23px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%;"></span>
                            </span>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <!-- Acerca de -->
        <div class="card">
            <div class="card-header">
                <span class="card-title">
                    <i data-lucide="info" style="margin-right: 8px; width: 18px; height: 18px; display: inline-block; vertical-align: middle;"></i>
                    Acerca de EduAdmin
                </span>
            </div>
            <div class="card-body" style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: var(--sp-6);">
                <div style="width: 48px; height: 48px; background: var(--color-blue); border-radius: var(--r-md); color: white; display: flex; align-items: center; justify-content: center; margin-bottom: var(--sp-3);">
                    <i data-lucide="graduation-cap" style="width: 24px; height: 24px;"></i>
                </div>
                <div style="font-weight: 700; font-size: 18px; color: var(--text-primary); font-family: var(--font-display); margin-bottom: 2px;">EduAdmin</div>
                <div style="font-size: 13px; color: var(--text-muted); margin-bottom: var(--sp-4);">Versión 1.0.4 (Build 240)</div>
                <div style="font-size: 13px; color: var(--text-secondary); max-width: 400px; line-height: 1.5; margin-bottom: var(--sp-4);">
                    Sistema de gestión de analíticos educativos diseñado para cumplir con los estándares de Provincia de Buenos Aires.
                </div>
                <div style="display: flex; gap: var(--sp-3);">
                    <a href="#" style="font-size: 13px; color: var(--color-blue); font-weight: 500;" onclick="ToastService.info('Funcionalidad en desarrollo'); return false;">Términos de Uso</a>
                    <span style="color: var(--border-strong)">•</span>
                    <a href="#" style="font-size: 13px; color: var(--color-blue); font-weight: 500;" onclick="ToastService.info('Funcionalidad en desarrollo'); return false;">Soporte Técnico</a>
                </div>
            </div>
        </div>
    </div>
    `;
}
