// frontend/js/ui.js
// Módulo UI reutilizable - Funciones y componentes compartidos
/**
 * Módulo UI con funciones reutilizables para toda la aplicación
 * Contiene utilidades para notificaciones, modales, validaciones, etc.
 */
export const UI = {
    // ==========================================
    // NOTIFICACIONES
    // ==========================================
    /**
     * Mostrar notificación toast
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duración en ms (default: 3000)
     */
    showNotification(message, type = 'info', duration = 3000) {
        // Remover notificaciones existentes
        const existingNotifications = document.querySelectorAll('.ui-notification');
        existingNotifications.forEach(notification => notification.remove());
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `ui-notification ui-notification--${type}`;
        notification.innerHTML = `
      <div class="ui-notification__content">
        <div class="ui-notification__icon">
          ${this._getNotificationIcon(type)}
        </div>
        <div class="ui-notification__message">${message}</div>
        <button class="ui-notification__close" onclick="this.parentElement.parentElement.remove()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;
        // Agregar estilos inline si no existen
        this._ensureNotificationStyles();
        // Agregar al DOM
        document.body.appendChild(notification);
        // Animar entrada
        setTimeout(() => {
            notification.classList.add('ui-notification--show');
        }, 100);
        // Auto-remover
        setTimeout(() => {
            notification.classList.remove('ui-notification--show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    },
    /**
     * Obtener icono para notificación
     * @private
     */
    _getNotificationIcon(type) {
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"></polyline></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
        };
        return icons[type] || icons.info;
    },
    /**
     * Asegurar que los estilos de notificación existan
     * @private
     */
    _ensureNotificationStyles() {
        if (document.getElementById('ui-notification-styles'))
            return;
        const styles = document.createElement('style');
        styles.id = 'ui-notification-styles';
        styles.textContent = `
      .ui-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        background: var(--bg-surface, #334155);
        border-radius: var(--radius-md, 8px);
        box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
        transform: translateX(100%);
        transition: transform 0.3s ease;
      }
      .ui-notification--show {
        transform: translateX(0);
      }
      .ui-notification__content {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
      }
      .ui-notification__icon {
        flex-shrink: 0;
        margin-top: 2px;
      }
      .ui-notification__message {
        flex: 1;
        color: var(--text-primary, #e2e8f0);
        font-size: 14px;
        line-height: 1.5;
      }
      .ui-notification__close {
        background: none;
        border: none;
        color: var(--text-secondary, #94a3b8);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s;
      }
      .ui-notification__close:hover {
        background: var(--bg-elevated, #475569);
      }
      .ui-notification--success .ui-notification__icon { color: var(--success, #10b981); }
      .ui-notification--error .ui-notification__icon { color: var(--error, #ef4444); }
      .ui-notification--warning .ui-notification__icon { color: var(--warning, #f59e0b); }
      .ui-notification--info .ui-notification__icon { color: var(--info, #3b82f6); }
    `;
        document.head.appendChild(styles);
    },
    // ==========================================
    // MODALES
    // ==========================================
    /**
     * Crear y mostrar modal
     * @param {string} title - Título del modal
     * @param {string} content - Contenido HTML del modal
     * @param {Object} options - Opciones del modal
     */
    createModal(title, content, options = {}) {
        const defaults = {
            closable: true,
            size: 'medium', // 'small', 'medium', 'large'
            onClose: null,
            onConfirm: null,
            confirmText: 'Confirmar',
            cancelText: 'Cancelar'
        };
        const config = { ...defaults, ...options };
        // Crear overlay
        const overlay = document.createElement('div');
        overlay.className = 'ui-modal-overlay';
        // Crear modal
        const modal = document.createElement('div');
        modal.className = `ui-modal ui-modal--${config.size}`;
        modal.innerHTML = `
      <div class="ui-modal__header">
        <h3 class="ui-modal__title">${title}</h3>
        ${config.closable ? `
          <button class="ui-modal__close" onclick="UI.closeModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        ` : ''}
      </div>
      <div class="ui-modal__body">
        ${content}
      </div>
      ${config.onConfirm ? `
        <div class="ui-modal__footer">
          <button class="btn btn--ghost" onclick="UI.closeModal()">${config.cancelText}</button>
          <button class="btn btn--primary" onclick="UI._handleModalConfirm()">${config.confirmText}</button>
        </div>
      ` : ''}
    `;
        overlay.appendChild(modal);
        // Asegurar estilos
        this._ensureModalStyles();
        // Agregar al DOM
        document.body.appendChild(overlay);
        // Guardar callback de confirmación
        if (config.onConfirm) {
            this._modalConfirmCallback = config.onConfirm;
        }
        // Guardar callback de cierre
        if (config.onClose) {
            this._modalCloseCallback = config.onClose;
        }
        // Animar entrada
        setTimeout(() => {
            overlay.classList.add('ui-modal-overlay--show');
        }, 10);
        // Cerrar con ESC
        if (config.closable) {
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    this.closeModal();
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        }
        return overlay;
    },
    /**
     * Cerrar modal activo
     */
    closeModal() {
        const overlay = document.querySelector('.ui-modal-overlay');
        if (overlay) {
            overlay.classList.remove('ui-modal-overlay--show');
            setTimeout(() => {
                overlay.remove();
                if (this._modalCloseCallback) {
                    this._modalCloseCallback();
                    this._modalCloseCallback = null;
                }
            }, 300);
        }
    },
    /**
     * Manejar confirmación de modal
     * @private
     */
    _handleModalConfirm() {
        if (this._modalConfirmCallback) {
            this._modalConfirmCallback();
            this._modalConfirmCallback = null;
        }
        this.closeModal();
    },
    /**
     * Asegurar estilos de modal
     * @private
     */
    _ensureModalStyles() {
        if (document.getElementById('ui-modal-styles'))
            return;
        const styles = document.createElement('style');
        styles.id = 'ui-modal-styles';
        styles.textContent = `
      .ui-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        padding: 20px;
      }
      .ui-modal-overlay--show {
        opacity: 1;
      }
      .ui-modal {
        background: var(--bg-surface, #334155);
        border-radius: var(--radius-lg, 12px);
        box-shadow: var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1));
        transform: scale(0.9);
        transition: transform 0.3s ease;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .ui-modal-overlay--show .ui-modal {
        transform: scale(1);
      }
      .ui-modal--small { width: 100%; max-width: 400px; }
      .ui-modal--medium { width: 100%; max-width: 600px; }
      .ui-modal--large { width: 100%; max-width: 800px; }
      .ui-modal__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px;
        border-bottom: 1px solid var(--border-color, #374151);
      }
      .ui-modal__title {
        margin: 0;
        color: var(--text-primary, #e2e8f0);
        font-size: 18px;
        font-weight: 600;
      }
      .ui-modal__close {
        background: none;
        border: none;
        color: var(--text-secondary, #94a3b8);
        cursor: pointer;
        padding: 8px;
        border-radius: 6px;
        transition: background-color 0.2s;
      }
      .ui-modal__close:hover {
        background: var(--bg-elevated, #475569);
      }
      .ui-modal__body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
        color: var(--text-primary, #e2e8f0);
      }
      .ui-modal__footer {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding: 20px;
        border-top: 1px solid var(--border-color, #374151);
      }
    `;
        document.head.appendChild(styles);
    },
    // ==========================================
    // UTILIDADES DE FECHA
    // ==========================================
    /**
     * Formatear fecha para mostrar
     * @param {string|Date} date - Fecha a formatear
     * @param {string} format - Formato: 'short', 'long', 'relative'
     * @returns {string} Fecha formateada
     */
    formatDate(date, format = 'short') {
        if (!date)
            return '';
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime()))
            return 'Fecha inválida';
        const now = new Date();
        const diffMs = now - dateObj;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        switch (format) {
            case 'relative':
                if (diffDays === 0)
                    return 'Hoy';
                if (diffDays === 1)
                    return 'Ayer';
                if (diffDays < 7)
                    return `Hace ${diffDays} días`;
                if (diffDays < 30)
                    return `Hace ${Math.floor(diffDays / 7)} semanas`;
                if (diffDays < 365)
                    return `Hace ${Math.floor(diffDays / 30)} meses`;
                return `Hace ${Math.floor(diffDays / 365)} años`;
            case 'long':
                return dateObj.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            case 'short':
            default:
                return dateObj.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
        }
    },
    /**
     * Formatear hora
     * @param {string} time - Hora en formato HH:MM
     * @returns {string} Hora formateada
     */
    formatTime(time) {
        if (!time)
            return '';
        // Si ya está en formato HH:MM, devolverlo
        if (/^\d{2}:\d{2}$/.test(time)) {
            return time;
        }
        // Si es un objeto Date
        if (time instanceof Date) {
            return time.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }
        return time;
    },
    // ==========================================
    // VALIDACIONES
    // ==========================================
    /**
     * Validar formulario
     * @param {HTMLFormElement} form - Formulario a validar
     * @param {Object} rules - Reglas de validación
     * @returns {Object} Resultado de validación
     */
    validateForm(form, rules = {}) {
        const errors = {};
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        // Validaciones por defecto
        const defaultRules = {
            required: (value, fieldName) => {
                if (!value || value.trim() === '') {
                    return `${fieldName} es requerido`;
                }
                return null;
            },
            email: (value) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (value && !emailRegex.test(value)) {
                    return 'Email inválido';
                }
                return null;
            },
            minLength: (value, fieldName, minLength) => {
                if (value && value.length < minLength) {
                    return `${fieldName} debe tener al menos ${minLength} caracteres`;
                }
                return null;
            },
            date: (value) => {
                if (value && isNaN(new Date(value).getTime())) {
                    return 'Fecha inválida';
                }
                return null;
            }
        };
        // Aplicar reglas
        Object.keys(rules).forEach(fieldName => {
            const fieldRules = rules[fieldName];
            const fieldValue = data[fieldName];
            fieldRules.forEach(rule => {
                if (typeof rule === 'string') {
                    // Regla simple
                    const error = defaultRules[rule]?.(fieldValue, fieldName);
                    if (error) {
                        errors[fieldName] = error;
                    }
                }
                else if (typeof rule === 'object') {
                    // Regla con parámetros
                    const { type, ...params } = rule;
                    const error = defaultRules[type]?.(fieldValue, fieldName, ...Object.values(params));
                    if (error) {
                        errors[fieldName] = error;
                    }
                }
                else if (typeof rule === 'function') {
                    // Regla personalizada
                    const error = rule(fieldValue, fieldName, data);
                    if (error) {
                        errors[fieldName] = error;
                    }
                }
            });
        });
        return {
            isValid: Object.keys(errors).length === 0,
            errors,
            data
        };
    },
    /**
     * Mostrar errores de validación en el formulario
     * @param {HTMLFormElement} form - Formulario
     * @param {Object} errors - Errores de validación
     */
    showFormErrors(form, errors) {
        // Limpiar errores previos
        form.querySelectorAll('.form-error').forEach(error => error.remove());
        form.querySelectorAll('.form-input--error').forEach(input => {
            input.classList.remove('form-input--error');
        });
        // Mostrar nuevos errores
        Object.keys(errors).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.classList.add('form-input--error');
                const errorElement = document.createElement('div');
                errorElement.className = 'form-error';
                errorElement.textContent = errors[fieldName];
                field.parentNode.appendChild(errorElement);
            }
        });
    },
    // ==========================================
    // UTILIDADES GENERALES
    // ==========================================
    /**
     * Debounce function
     * @param {Function} func - Función a debounce
     * @param {number} wait - Tiempo de espera en ms
     * @returns {Function} Función debounced
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    /**
     * Throttle function
     * @param {Function} func - Función a throttle
     * @param {number} limit - Límite de tiempo en ms
     * @returns {Function} Función throttled
     */
    throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    /**
     * Generar ID único
     * @returns {string} ID único
     */
    generateId() {
        return 'ui_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    },
    /**
     * Capitalizar primera letra
     * @param {string} str - String a capitalizar
     * @returns {string} String capitalizado
     */
    capitalize(str) {
        if (!str)
            return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },
    /**
     * Formatear número
     * @param {number} num - Número a formatear
     * @param {Object} options - Opciones de formato
     * @returns {string} Número formateado
     */
    formatNumber(num, options = {}) {
        const defaults = {
            locale: 'es-ES',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        };
        const config = { ...defaults, ...options };
        return new Intl.NumberFormat(config.locale, config).format(num);
    }
};
// Hacer UI disponible globalmente
if (typeof window !== 'undefined') {
    window.UI = UI;
}
// Exportar por defecto
export default UI;
//# sourceMappingURL=ui.js.map