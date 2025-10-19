// frontend/js/mapa_reporte.js
// Módulo simplificado para formulario de reportes - Flujo original
import { UI } from './ui.js';
import { JSONUtils } from './json-utils.js';
// Configuración de API
const API_BASE = '/api';
/**
 * Módulo de Reporte Simplificado - Flujo original
 * Maneja solo el formulario de datos y redirección al mapa
 */
export const MapaReporteManager = {
    // Estado interno del módulo
    _state: {
        selectedBarrio: '',
        reporteForm: null,
        capitanes: [],
        _saveTimeout: null
    },
    // ==========================================
    // INICIALIZACIÓN
    // ==========================================
    /**
     * Inicializar el módulo
     */
    async init() {
        try {
            console.log('📍 Inicializando MapaReporteManager...');
            // Obtener elementos del DOM
            this._state.reporteForm = document.getElementById('datos-form');
            if (!this._state.reporteForm) {
                throw new Error('Formulario de reporte no encontrado');
            }
            // Configurar event listeners
            this._setupEventListeners();
            // Cargar datos iniciales
            await this._loadInitialData();
            // Restaurar datos del formulario si existen
            this._restoreFormData();
            console.log('✅ MapaReporteManager inicializado correctamente');
        }
        catch (error) {
            console.error('❌ Error al inicializar MapaReporteManager:', error);
            UI.showNotification('Error al inicializar el formulario', 'error');
        }
    },
    /**
     * Configurar event listeners
     * @private
     */
    _setupEventListeners() {
        // Formulario de reporte
        if (this._state.reporteForm) {
            this._state.reporteForm.addEventListener('submit', (e) => this.handleReporteSubmit(e));
        }
        // Auto-guardar datos cuando cambien los campos (incluye estado manual)
        const autoSaveFields = ['capitan-select', 'fecha-reporte', 'estado-reporte'];
        autoSaveFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('change', () => {
                    // Guardar con un pequeño delay para evitar guardado excesivo
                    clearTimeout(this._saveTimeout);
                    this._saveTimeout = setTimeout(() => this._saveFormData(), 500);
                });
            }
        });
        // Botón volver
        const btnVolver = document.getElementById('btn-volver-home');
        if (btnVolver) {
            btnVolver.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
        // Selector de barrio
        const barrioSelect = document.getElementById('barrio-select');
        if (barrioSelect) {
            barrioSelect.addEventListener('change', (e) => {
                this._state.selectedBarrio = e.target.value;
            });
        }
        // Establecer fecha actual por defecto
        const fechaInput = document.getElementById('fecha-reporte');
        if (fechaInput) {
            fechaInput.value = new Date().toISOString().split('T')[0];
        }
        // Configurar dropdown de observaciones
        this._setupObservacionesDropdown();
        // Configurar tooltip de información de estados
        this._setupEstadoTooltip();
    },
    /**
     * Configurar dropdown de observaciones
     * @private
     */
    _setupObservacionesDropdown() {
        const select = document.getElementById('observaciones-select');
        const otroContainer = document.getElementById('observaciones-otro-container');
        const otroTextarea = document.getElementById('observaciones-otro');
        const charCounter = document.getElementById('char-counter');
        if (select) {
            select.addEventListener('change', (e) => {
                if (e.target.value === 'otro') {
                    otroContainer.style.display = 'block';
                    otroTextarea.focus();
                }
                else {
                    otroContainer.style.display = 'none';
                    otroTextarea.value = '';
                    if (charCounter)
                        charCounter.textContent = '0';
                }
            });
        }
        if (otroTextarea && charCounter) {
            otroTextarea.addEventListener('input', (e) => {
                charCounter.textContent = e.target.value.length;
            });
        }
    },
    /**
     * Configurar tooltip para explicar los estados
     * @private
     */
    _setupEstadoTooltip() {
        const btn = document.getElementById('estado-info-btn');
        const tooltip = document.getElementById('estado-tooltip');
        if (!btn || !tooltip)
            return;
        let hideTimer = null;
        const positionTooltip = () => {
            const rect = btn.getBoundingClientRect();
            const scrollY = window.scrollY || document.documentElement.scrollTop;
            const scrollX = window.scrollX || document.documentElement.scrollLeft;
            const top = rect.bottom + scrollY + 8; // 8px separación
            // Alinear con el botón pero mantener margen en viewport
            let left = rect.left + scrollX;
            const maxLeft = scrollX + document.documentElement.clientWidth - tooltip.offsetWidth - 12;
            if (left > maxLeft)
                left = Math.max(scrollX + 12, maxLeft);
            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;
        };
        const showTooltip = () => {
            clearTimeout(hideTimer);
            positionTooltip();
            tooltip.classList.add('is-visible');
            tooltip.setAttribute('aria-hidden', 'false');
            hideTimer = setTimeout(hideTooltip, 5500); // Ocultar automáticamente
        };
        const hideTooltip = () => {
            tooltip.classList.remove('is-visible');
            tooltip.setAttribute('aria-hidden', 'true');
        };
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (tooltip.classList.contains('is-visible')) {
                hideTooltip();
            }
            else {
                showTooltip();
            }
        });
        // Mostrar también al pasar el cursor (desktop)
        btn.addEventListener('mouseenter', () => {
            showTooltip();
        });
        btn.addEventListener('mouseleave', () => {
            clearTimeout(hideTimer);
            hideTimer = setTimeout(hideTooltip, 250);
        });
        // Cerrar al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!tooltip.classList.contains('is-visible'))
                return;
            const isClickInside = tooltip.contains(e.target) || btn.contains(e.target);
            if (!isClickInside)
                hideTooltip();
        });
        // Reposicionar en resize/scroll
        window.addEventListener('resize', () => {
            if (tooltip.classList.contains('is-visible'))
                positionTooltip();
        });
        window.addEventListener('scroll', () => {
            if (tooltip.classList.contains('is-visible'))
                positionTooltip();
        }, { passive: true });
    },
    /**
     * Cargar datos iniciales
     * @private
     */
    async _loadInitialData() {
        try {
            // Cargar capitanes
            await this._loadCapitanes();
            // Cargar barrios disponibles
            await this._loadBarrios();
        }
        catch (error) {
            console.error('❌ Error al cargar datos iniciales:', error);
        }
    },
    /**
     * Cargar lista de capitanes
     * @private
     */
    async _loadCapitanes() {
        try {
            console.log('🔄 Cargando capitanes desde API...');
            const response = await fetch(`${API_BASE}/capitanes`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('📊 Respuesta de capitanes:', data);
            if (data.success && Array.isArray(data.data)) {
                this._state.capitanes = data.data;
                this._populateCapitanesSelect();
                console.log(`✅ ${data.data.length} capitanes cargados`);
            }
            else {
                console.error('❌ Respuesta inválida:', data);
            }
        }
        catch (error) {
            console.error('❌ Error al cargar capitanes:', error);
            // Mostrar mensaje de error al usuario
            const select = document.getElementById('capitan-select');
            if (select) {
                select.innerHTML = '<option value="" disabled selected>Error al cargar capitanes</option>';
            }
        }
    },
    /**
     * Cargar barrios disponibles
     * @private
     */
    async _loadBarrios() {
        try {
            // Lista de barrios con nombres estéticos (con tildes) y archivos SVG correspondientes
            const barrios = [
                { nombre: 'Acacios', archivo: 'Acacios.svg' },
                { nombre: 'Alcalá', archivo: 'Alcala.svg' },
                { nombre: 'Ciudad Jardín', archivo: 'Ciudad Jardin.svg' },
                { nombre: 'Guaimaral', archivo: 'Guaimaral.svg' },
                { nombre: 'La Mar y Gratamira', archivo: 'La Mar y Gratamira.svg' },
                { nombre: 'Niza', archivo: 'Niza.svg' },
                { nombre: 'Prados Norte', archivo: 'Prados Norte.svg' },
                { nombre: 'Próceres', archivo: 'Proceres.svg' },
                { nombre: 'San Eduardo', archivo: 'San Eduardo.svg' },
                { nombre: 'Santa Elena', archivo: 'Santa Elena.svg' },
                { nombre: 'Tasajero', archivo: 'Tasajero.svg' },
                { nombre: 'Zulima', archivo: 'Zulima.svg' }
            ];
            this._populateBarriosSelect(barrios);
        }
        catch (error) {
            console.error('❌ Error al cargar barrios:', error);
        }
    },
    /**
     * Poblar select de capitanes
     * @private
     */
    _populateCapitanesSelect() {
        const select = document.getElementById('capitan-select');
        if (!select)
            return;
        // Limpiar opciones existentes (excepto la primera)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        // Agregar capitanes
        this._state.capitanes.forEach(capitan => {
            const option = document.createElement('option');
            option.value = `${capitan.nombre} ${capitan.apellido}`;
            option.textContent = `${capitan.nombre} ${capitan.apellido}`;
            select.appendChild(option);
        });
    },
    /**
     * Poblar select de barrios
     * @private
     */
    _populateBarriosSelect(barrios) {
        const select = document.getElementById('barrio-select');
        if (!select)
            return;
        // Limpiar opciones existentes (excepto la primera)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        // Agregar barrios
        barrios.forEach(barrio => {
            const option = document.createElement('option');
            option.value = JSON.stringify(barrio);
            option.textContent = barrio.nombre;
            select.appendChild(option);
        });
    },
    /**
     * Guardar datos del formulario en localStorage
     * @private
     */
    _saveFormData() {
        try {
            const formData = {
                capitan: document.getElementById('capitan-select')?.value || '',
                fecha: document.getElementById('fecha-reporte')?.value || '',
                // ❌ estado: document.getElementById('estado-reporte')?.value || '', // Ya no manual
                timestamp: Date.now()
            };
            JSONUtils.setToStorage('form_cache_reporte', formData);
            console.log('💾 Datos del formulario guardados en caché');
        }
        catch (error) {
            console.error('❌ Error al guardar datos del formulario:', error);
        }
    },
    /**
     * Restaurar datos del formulario desde localStorage
     * @private
     */
    _restoreFormData() {
        try {
            const cachedData = localStorage.getItem('form_cache_reporte');
            if (!cachedData)
                return;
            const formData = JSONUtils.safeParse(cachedData);
            if (!formData) {
                console.warn('🚨 Datos de caché corruptos, limpiando...');
                localStorage.removeItem('form_cache_reporte');
                return;
            }
            // Verificar que los datos no sean muy antiguos (1 hora)
            const oneHour = 60 * 60 * 1000;
            if (Date.now() - formData.timestamp > oneHour) {
                localStorage.removeItem('form_cache_reporte');
                return;
            }
            // Restaurar valores (incluye estado manual)
            const capitanSelect = document.getElementById('capitan-select');
            const fechaInput = document.getElementById('fecha-reporte');
            const estadoSelect = document.getElementById('estado-reporte');
            if (capitanSelect && formData.capitan) {
                capitanSelect.value = formData.capitan;
            }
            if (fechaInput && formData.fecha) {
                fechaInput.value = formData.fecha;
            }
            if (estadoSelect && formData.estado) {
                estadoSelect.value = formData.estado;
            }
            console.log('🔄 Datos del formulario restaurados desde caché');
            // Notificación removida para flujo más limpio
        }
        catch (error) {
            console.error('❌ Error al restaurar datos del formulario:', error);
            localStorage.removeItem('form_cache_reporte');
        }
    },
    /**
     * Limpiar caché del formulario
     * @private
     */
    _clearFormCache() {
        localStorage.removeItem('form_cache_reporte');
        console.log('🗑️ Caché del formulario limpiado');
    },
    /**
     * Limpiar caché del formulario (función pública)
     * Se puede llamar desde mapas.js cuando se complete exitosamente un reporte
     */
    clearFormCache() {
        this._clearFormCache();
    },
    /**
     * Obtener valor final de observaciones
     * @private
     * @returns {string|null} Valor de observaciones o null si está vacío
     */
    _getObservacionesValue() {
        const select = document.getElementById('observaciones-select');
        const otroTextarea = document.getElementById('observaciones-otro');
        if (!select || !select.value)
            return null;
        if (select.value === 'otro') {
            return otroTextarea.value.trim() || null;
        }
        return select.value;
    },
    /**
     * Manejar envío del formulario
     */
    async handleReporteSubmit(event) {
        event.preventDefault();
        try {
            // Obtener datos del formulario (con estado manual)
            const formData = new FormData(this._state.reporteForm);
            const data = {
                capitan: formData.get('capitanSelect'),
                fecha: formData.get('fechaReporte'),
                barrio: formData.get('barrioSelect'),
                observaciones: this._getObservacionesValue(),
                estado: formData.get('estadoReporte')
            };
            // Validar datos (incluye estado)
            if (!this._validateReporteData(data)) {
                return;
            }
            // Guardar datos del formulario en caché antes de redirigir
            this._saveFormData();
            // Parsear barrio seleccionado
            const barrioData = JSONUtils.safeParse(data.barrio);
            if (!barrioData) {
                UI.showNotification('Error: Datos de barrio inválidos', 'error');
                return;
            }
            // Los ciclos los gestiona el backend; el estado lo define el usuario
            console.log('✅ Estado del reporte definido manualmente por el usuario');
            // SPRINT 3: Validar manzanas seleccionadas antes de continuar
            if (window.MapasManager && typeof window.MapasManager.validateSelectedTerritories === 'function') {
                const validation = window.MapasManager.validateSelectedTerritories();
                if (validation.hasWarning) {
                    const confirmed = await window.MapasManager.showConfirmationModal(validation.message);
                    if (!confirmed) {
                        UI.showNotification('Envío de reporte cancelado', 'info');
                        return;
                    }
                }
            }
            // Redirigir al mapa con parámetros (incluye estado manual)
            const params = new URLSearchParams({
                barrio: barrioData.nombre,
                archivo: barrioData.archivo,
                capitan: data.capitan,
                fecha: data.fecha,
                estado: data.estado
            });
            // Agregar observaciones si existen
            if (data.observaciones) {
                params.set('observaciones', data.observaciones);
            }
            window.location.href = `mapa.html?${params.toString()}`;
        }
        catch (error) {
            console.error('❌ Error al procesar formulario:', error);
            UI.showNotification('Error al procesar el formulario', 'error');
        }
    },
    /**
     * Validar datos del reporte
     * @private
     */
    _validateReporteData(data) {
        if (!data.capitan) {
            UI.showNotification('Por favor selecciona un capitán', 'warning');
            return false;
        }
        if (!data.fecha) {
            UI.showNotification('Por favor selecciona una fecha', 'warning');
            return false;
        }
        if (!data.estado) {
            UI.showNotification('Por favor selecciona un estado', 'warning');
            return false;
        }
        if (!data.barrio) {
            UI.showNotification('Por favor selecciona un barrio', 'warning');
            return false;
        }
        return true;
    }
};
// Exportar para uso global
if (typeof window !== 'undefined') {
    window.MapaReporteManager = MapaReporteManager;
}
export default MapaReporteManager;
//# sourceMappingURL=mapa_reporte.js.map