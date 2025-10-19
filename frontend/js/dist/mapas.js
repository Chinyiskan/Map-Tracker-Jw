// frontend/js/mapas.js
// Módulo de Mapas - Gestión de mapas SVG y territorios
import { UI } from './ui.js';
import { JSONUtils } from './json-utils.js';
// Configuración de API
const API_BASE = '/api';
// SPRINT 4 - Colores más saturados y visibles para estados
const REAL_TIME_COLORS = {
    'pendiente': {
        fill: 'rgba(255, 77, 77, 0.65)', // Rojo más saturado - Sin trabajar
        stroke: 'rgba(255, 77, 77, 0.9)',
        label: 'Pendiente'
    },
    'trabajada': {
        fill: 'rgba(39, 174, 96, 0.65)', // Verde más saturado - Trabajada
        stroke: 'rgba(39, 174, 96, 0.95)',
        label: 'Trabajada'
    }
};
// SPRINT 4 - Colores más saturados para selección
const SELECTION_COLORS = {
    'selected_new': {
        fill: 'rgba(41, 128, 185, 0.75)', // Azul más saturado - Selección nueva
        stroke: 'rgba(41, 128, 185, 1)',
        strokeWidth: '3'
    },
    'selected_worked': {
        fill: 'rgba(211, 84, 0, 0.75)', // Naranja más saturado - Selección trabajada
        stroke: 'rgba(211, 84, 0, 1)',
        strokeWidth: '3'
    }
};
/**
 * Módulo de Mapas - Gestión completa de mapas SVG y territorios
 * Maneja carga de mapas, interacciones, territorios y reportes
 */
export const MapasManager = {
    // Estado interno del módulo
    _state: {
        currentMap: null,
        currentBarrio: '',
        territories: [],
        reportes: [],
        selectedTerritories: [], // Cambio: array para múltiples selecciones
        mapContainer: null,
        svgElement: null,
        // Nuevo: estado en tiempo real de territorios
        territoryRealTimeStatus: new Map(), // ID -> 'pendiente'|'trabajada'
        // Clean Architecture: Información de ciclos y progreso
        cicloActivo: null, // Información del ciclo activo del barrio
        progresoBarrio: null, // Progreso detallado del barrio
        // Legacy: Información de ciclos (mantener para compatibilidad)
        currentCycle: 1,
        cycleStartDate: null,
        cycleHistory: new Map(), // barrio -> {cycleNumber, completedDate, territories}
        // Modo consulta
        isConsultaMode: false
    },
    // Configuración de barrios disponibles
    _barrios: [
        'Alcalá', 'Acacios', 'Ciudad Jardín', 'Guaimaral',
        'La Mar y Gratamira', 'Niza', 'Prados Norte', 'Próceres',
        'San Eduardo', 'Santa Elena', 'Tasajero', 'Zulima'
    ],
    // ==========================================
    // INICIALIZACIÓN
    // ==========================================
    /**
     * Inicializar el módulo de mapas
     */
    async init() {
        try {
            console.log('🗺️ Inicializando MapasManager...');
            // Detectar modo consulta
            this._detectConsultaMode();
            // Obtener contenedor del mapa
            this._state.mapContainer = document.getElementById('mapa-container');
            if (!this._state.mapContainer) {
                throw new Error('Contenedor de mapa no encontrado');
            }
            // Configurar event listeners
            this._setupEventListeners();
            // SPRINT 4: Selector de barrios eliminado
            // this._populateBarrioSelector();
            // Cargar mapa inicial si hay barrio seleccionado
            const initialBarrio = this._getInitialBarrio();
            if (initialBarrio) {
                await this.loadMap(initialBarrio);
            }
            console.log('✅ MapasManager inicializado correctamente');
            // Notificación removida para flujo de reportes más limpio
        }
        catch (error) {
            console.error('❌ Error al inicializar MapasManager:', error);
            UI.showNotification('Error al cargar el módulo de mapas', 'error');
        }
    },
    /**
     * Configurar event listeners
     * @private
     */
    _setupEventListeners() {
        // SPRINT 4: Selector de barrio eliminado del HTML
        // const barrioSelector = document.getElementById('barrio-selector');
        // if (barrioSelector) {
        //   barrioSelector.addEventListener('change', (e) => {
        //     const barrio = e.target.value;
        //     if (barrio) {
        //       this.loadMap(barrio);
        //     } else {
        //       this.clearMap();
        //     }
        //   });
        // }
        // Botón de actualizar
        const updateBtn = document.getElementById('btn-actualizar-mapa');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => {
                if (this._state.currentBarrio) {
                    this.refreshMap();
                }
            });
        }
        // Filtros de territorio
        const filtroEstado = document.getElementById('filtro-estado-territorio');
        if (filtroEstado) {
            filtroEstado.addEventListener('change', () => {
                this._applyTerritoryFilters();
            });
        }
        // Configurar botón de enviar reporte
        const enviarReporteBtn = document.getElementById('btn-enviar-reporte');
        if (enviarReporteBtn) {
            enviarReporteBtn.addEventListener('click', async () => {
                await this.sendReporteToBackend();
            });
        }
        // Configurar botones según el modo (consulta vs reporte)
        this._setupModeButtons();
        // Limpiar selecciones
        const btnLimpiar = document.getElementById('btn-limpiar-seleccion');
        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', () => {
                this._state.selectedTerritories = [];
                this._updateTerritorySelection();
                this._showSelectedTerritories();
            });
        }
    },
    /**
     * SPRINT 4: Función eliminada - Selector de barrio removido
     * @private
     */
    // _populateBarrioSelector() {
    //   const selector = document.getElementById('barrio-selector');
    //   if (!selector) return;
    //   
    //   selector.innerHTML = '<option value="">Seleccionar barrio</option>';
    //   
    //   this._barrios.forEach(barrio => {
    //     const option = document.createElement('option');
    //     option.value = barrio;
    //     option.textContent = barrio;
    //     selector.appendChild(option);
    //   });
    // },
    /**
     * Configurar botones según el modo (consulta vs reporte)
     * @private
     */
    _setupModeButtons() {
        // Detectar si venimos desde el formulario (con parámetros URL)
        const urlParams = new URLSearchParams(window.location.search);
        // Clean Architecture: Ya no usamos 'estado', solo verificamos capitan y fecha
        const hasReportParams = urlParams.has('capitan') && urlParams.has('fecha') && urlParams.has('barrio');
        const btnCrearReporte = document.getElementById('btn-crear-reporte');
        const btnEnviarReporte = document.getElementById('btn-enviar-reporte');
        console.log('🔧 Setup Mode Buttons - hasReportParams:', hasReportParams);
        console.log('🔧 URL Params:', {
            capitan: urlParams.get('capitan'),
            fecha: urlParams.get('fecha'),
            barrio: urlParams.get('barrio')
        });
        if (hasReportParams) {
            // Modo reporte: mostrar botón "Enviar Reporte", ocultar "Crear Reporte"
            console.log('🔧 Activando modo REPORTE');
            if (btnCrearReporte)
                btnCrearReporte.style.display = 'none';
            if (btnEnviarReporte)
                btnEnviarReporte.style.display = 'inline-flex';
        }
        else {
            // Modo normal: mostrar botón "Crear Reporte", ocultar "Enviar Reporte"
            console.log('🔧 Activando modo CONSULTA');
            if (btnCrearReporte)
                btnCrearReporte.style.display = 'inline-flex';
            if (btnEnviarReporte)
                btnEnviarReporte.style.display = 'none';
        }
        // En modo consulta, ocultar ambos botones
        if (this._state.isConsultaMode) {
            console.log('🔧 Modo consulta detectado - ocultando botones');
            if (btnCrearReporte)
                btnCrearReporte.style.display = 'none';
            if (btnEnviarReporte)
                btnEnviarReporte.style.display = 'none';
        }
    },
    /**
     * Obtener barrio inicial desde URL o localStorage
     * @private
     */
    _getInitialBarrio() {
        // Primero, intentar obtener barrio de parámetros URL (tanto consulta como reportes)
        const urlParams = new URLSearchParams(window.location.search);
        const barrioFromUrl = urlParams.get('barrio');
        if (barrioFromUrl) {
            const mode = this._state.isConsultaMode ? 'consulta' : 'reporte';
            console.log(`📍 Barrio desde URL (modo ${mode}):`, barrioFromUrl);
            return barrioFromUrl;
        }
        // Fallback: obtener barrio de localStorage (solo para casos legacy)
        const storedBarrio = localStorage.getItem('barrio');
        if (storedBarrio) {
            console.log('📍 Barrio desde localStorage:', storedBarrio);
            // Manejar tanto string simple como objeto JSON usando JSONUtils
            const parsedBarrio = JSONUtils.safeParse(storedBarrio);
            if (parsedBarrio && typeof parsedBarrio === 'object' && parsedBarrio.nombre) {
                console.log('📍 Barrio extraído del objeto:', parsedBarrio.nombre);
                return parsedBarrio.nombre;
            }
            else if (typeof storedBarrio === 'string') {
                // Si no es JSON válido, asumir que es string simple
                console.log('📍 Barrio como string simple:', storedBarrio);
                return storedBarrio;
            }
        }
        // Si no hay barrio seleccionado, no cargar mapa automáticamente
        console.log('📍 No hay barrio seleccionado');
        return null;
    },
    /**
     * Detectar si estamos en modo consulta
     * @private
     */
    _detectConsultaMode() {
        const urlParams = new URLSearchParams(window.location.search);
        const modo = urlParams.get('modo');
        if (modo === 'consulta') {
            this._state.isConsultaMode = true;
            this._enableConsultaMode();
            console.log('🔍 Modo consulta activado');
        }
    },
    /**
     * Activar modo consulta (solo lectura)
     * @private
     */
    _enableConsultaMode() {
        // Cambiar título para indicar modo consulta
        const titulo = document.getElementById('titulo-barrio');
        if (titulo) {
            const textoOriginal = titulo.textContent;
            if (!textoOriginal.includes('(Solo Consulta)')) {
                titulo.textContent = textoOriginal + ' (Solo Consulta)';
            }
        }
        // Ocultar botón "Crear Reporte"
        const btnCrearReporte = document.getElementById('btn-crear-reporte');
        if (btnCrearReporte) {
            btnCrearReporte.style.display = 'none';
        }
        // Cambiar botón "Volver" para regresar a consulta.html
        const btnVolver = document.getElementById('btn-volver');
        if (btnVolver) {
            btnVolver.onclick = () => window.location.href = 'consulta.html';
        }
        // Ocultar leyendas de selección en modo consulta
        const legendSelection = document.querySelectorAll('.legend-selection');
        legendSelection.forEach(legend => {
            legend.style.display = 'none';
        });
    },
    // ==========================================
    // GESTIÓN DE MAPAS
    // ==========================================
    /**
     * Cargar mapa SVG de un barrio específico
     */
    /**
     * Encontrar barrio válido comparando con y sin tildes
     * @param {string} barrio - Nombre del barrio a buscar
     * @returns {string|null} Nombre del barrio válido o null
     * @private
     */
    _findValidBarrio(barrio) {
        if (!barrio)
            return null;
        // Buscar coincidencia exacta primero
        if (this._barrios.includes(barrio)) {
            return barrio;
        }
        // Buscar coincidencia normalizando (sin tildes)
        const normalizedInput = this._normalizeBarrioName(barrio);
        for (const validBarrio of this._barrios) {
            const normalizedValid = this._normalizeBarrioName(validBarrio);
            if (normalizedInput === normalizedValid) {
                console.log(`🔄 Barrio normalizado: "${barrio}" → "${validBarrio}"`);
                return validBarrio;
            }
        }
        return null;
    },
    async loadMap(barrio) {
        try {
            // Encontrar barrio válido (con o sin tildes)
            const validBarrio = this._findValidBarrio(barrio);
            if (!validBarrio) {
                throw new Error(`Barrio no válido: "${barrio}"`);
            }
            // Usar el barrio válido encontrado
            barrio = validBarrio;
            // Notificación de carga removida para flujo más limpio
            // Limpiar mapa anterior
            this.clearMap();
            // Actualizar estado
            this._state.currentBarrio = barrio;
            // Guardar en localStorage
            localStorage.setItem('ultimo_barrio_seleccionado', barrio);
            // Actualizar selector
            const selector = document.getElementById('barrio-selector');
            if (selector) {
                selector.value = barrio;
            }
            // Cargar archivo SVG
            const svgContent = await this._loadSVGFile(barrio);
            // Renderizar mapa
            this._renderMap(svgContent);
            // Cargar datos de territorios
            await this._loadTerritoryData(barrio);
            // Configurar interacciones del mapa
            this._setupMapInteractions();
            // CLEAN ARCHITECTURE: Cargar datos usando nuevas APIs
            console.log('🔄 Cargando datos con Clean Architecture...');
            // Cargar reportes del barrio
            this._state.reportes = await this._loadBarrioReportes(barrio);
            // Cargar ciclo activo
            this._state.cicloActivo = await this._loadCicloActivo(barrio);
            // Cargar progreso del barrio
            this._state.progresoBarrio = await this._loadProgresoBarrio(barrio);
            // Aplicar estilos basados en los datos cargados
            this._analyzeBasicTerritoryStatus(barrio);
            this._applyTerritoryStyles();
            // Mostrar progreso actualizado
            this._showBarrioProgressCleanArchitecture();
            // Notificación de mapa cargado removida para flujo más limpio
        }
        catch (error) {
            console.error('❌ Error al cargar mapa:', error);
            UI.showNotification(`Error al cargar mapa de ${barrio}`, 'error');
        }
    },
    /**
     * Cargar archivo SVG
     * @private
     */
    /**
     * Normalizar nombre de barrio para nombre de archivo
     * @param {string} barrio - Nombre del barrio
     * @returns {string} Nombre normalizado sin tildes
     * @private
     */
    _normalizeBarrioName(barrio) {
        // Mapeo específico para archivos SVG existentes
        const barrioFileMap = {
            'Alcalá': 'Alcala',
            'Acacios': 'Acacios',
            'Ciudad Jardín': 'Ciudad Jardin',
            'Guaimaral': 'Guaimaral',
            'La Mar y Gratamira': 'La Mar y Gratamira',
            'Niza': 'Niza',
            'Prados Norte': 'Prados Norte',
            'Próceres': 'Proceres',
            'San Eduardo': 'San Eduardo',
            'Santa Elena': 'Santa Elena',
            'Tasajero': 'Tasajero',
            'Zulima': 'Zulima'
        };
        // Usar mapeo específico si existe
        if (barrioFileMap[barrio]) {
            console.log(`📁 Mapeo de archivo: ${barrio} → ${barrioFileMap[barrio]}`);
            return barrioFileMap[barrio];
        }
        // Fallback: normalización general
        return barrio
            .replace(/á/g, 'a')
            .replace(/é/g, 'e')
            .replace(/í/g, 'i')
            .replace(/ó/g, 'o')
            .replace(/ú/g, 'u')
            .replace(/Á/g, 'A')
            .replace(/É/g, 'E')
            .replace(/Í/g, 'I')
            .replace(/Ó/g, 'O')
            .replace(/Ú/g, 'U');
    },
    async _loadSVGFile(barrio) {
        try {
            // Normalizar nombre del barrio para el archivo
            const normalizedBarrio = this._normalizeBarrioName(barrio);
            const svgPath = `mapas/${normalizedBarrio}.svg`;
            console.log(`📁 Cargando SVG: ${barrio} → ${svgPath}`);
            const response = await fetch(svgPath);
            if (!response.ok) {
                throw new Error(`No se pudo cargar el archivo SVG: ${response.status}`);
            }
            return await response.text();
        }
        catch (error) {
            console.error('❌ Error al cargar archivo SVG:', error);
            throw new Error(`Archivo de mapa no encontrado para ${barrio}`);
        }
    },
    /**
     * Renderizar mapa en el contenedor
     * @private
     */
    _renderMap(svgContent) {
        if (!this._state.mapContainer)
            return;
        // Insertar SVG en el contenedor
        this._state.mapContainer.innerHTML = svgContent;
        // Obtener elemento SVG
        this._state.svgElement = this._state.mapContainer.querySelector('svg');
        if (this._state.svgElement) {
            // Configurar SVG para responsividad
            this._state.svgElement.setAttribute('width', '100%');
            this._state.svgElement.setAttribute('height', '100%');
            this._state.svgElement.style.maxWidth = '100%';
            this._state.svgElement.style.height = 'auto';
            // Agregar clase CSS
            this._state.svgElement.classList.add('territorio-map');
            // Inicializar controles de zoom
            this._initZoomControls();
        }
    },
    /**
     * Cargar datos de territorios
     * @private
     */
    async _loadTerritoryData(barrio) {
        try {
            // Cargar reportes del barrio
            const reportes = await this._loadBarrioReportes(barrio);
            this._state.reportes = reportes;
            // Extraer información de territorios desde el SVG
            this._extractTerritoriesFromSVG();
            // Calcular estadísticas por territorio
            this._calculateTerritoryStats();
        }
        catch (error) {
            console.error('❌ Error al cargar datos de territorios:', error);
            UI.showNotification('Error al cargar datos de territorios', 'error');
        }
    },
    /**
     * Cargar reportes del barrio
     * @private
     */
    async _loadBarrioReportes(barrio) {
        try {
            // Usar nuevo endpoint específico de Clean Architecture
            const response = await fetch(`${API_BASE}/reportes/barrio/${encodeURIComponent(barrio)}`);
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Error al cargar reportes');
            }
            console.log(`📊 Reportes cargados para ${barrio}:`, result.total || 0);
            return result.data || [];
        }
        catch (error) {
            console.error('❌ Error al cargar reportes del barrio:', error);
            return [];
        }
    },
    /**
     * Cargar información del ciclo activo del barrio
     * @param {string} barrio - Nombre del barrio
     * @returns {Object|null} Información del ciclo activo
     * @private
     */
    async _loadCicloActivo(barrio) {
        try {
            const response = await fetch(`${API_BASE}/ciclos/barrio/${encodeURIComponent(barrio)}/activo`);
            const result = await response.json();
            if (!result.success) {
                // No hay ciclo activo, esto es normal
                console.log(`ℹ️ No hay ciclo activo para ${barrio}`);
                return null;
            }
            console.log(`🔄 Ciclo activo para ${barrio}:`, result.data);
            return result.data;
        }
        catch (error) {
            console.error('❌ Error al cargar ciclo activo:', error);
            return null;
        }
    },
    /**
     * Cargar progreso del barrio
     * @param {string} barrio - Nombre del barrio
     * @returns {Object|null} Información del progreso
     * @private
     */
    async _loadProgresoBarrio(barrio) {
        try {
            const response = await fetch(`${API_BASE}/ciclos/barrio/${encodeURIComponent(barrio)}/progreso`);
            const result = await response.json();
            if (!result.success) {
                console.log(`ℹ️ No hay progreso disponible para ${barrio}`);
                return null;
            }
            console.log(`📈 Progreso para ${barrio}:`, result.data);
            return result.data;
        }
        catch (error) {
            console.error('❌ Error al cargar progreso del barrio:', error);
            return null;
        }
    },
    /**
     * Extraer territorios desde el SVG
     * @private
     */
    _extractTerritoriesFromSVG() {
        if (!this._state.svgElement)
            return;
        // Buscar elementos que representen territorios
        const territoryElements = this._state.svgElement.querySelectorAll('[id*="territorio"], [id*="T-"], [id*="manzana-"], [class*="territorio"], path[id], polygon[id], rect[id]');
        this._state.territories = Array.from(territoryElements).map(element => {
            const id = element.id || element.getAttribute('data-territorio') || 'sin-id';
            const numero = this._extractTerritoryNumber(id);
            return {
                id: id,
                numero: numero,
                element: element,
                reportes: [],
                ultimoReporte: null,
                estado: 'disponible' // disponible, asignado, completado
            };
        });
        console.log(`📍 Encontrados ${this._state.territories.length} territorios en ${this._state.currentBarrio}`);
    },
    /**
     * Extraer número de territorio desde ID
     * @private
     */
    _extractTerritoryNumber(id) {
        // Intentar extraer número del ID
        const match = id.match(/\d+/);
        return match ? parseInt(match[0]) : null;
    },
    /**
     * Calcular estadísticas por territorio
     * @private
     */
    _calculateTerritoryStats() {
        let trabajadas = 0;
        let pendientes = 0;
        this._state.territories.forEach(territory => {
            // Usar el estado en tiempo real que ya está calculado
            const realTimeStatus = this._state.territoryRealTimeStatus.get(territory.id) || 'pendiente';
            if (realTimeStatus === 'trabajada') {
                trabajadas++;
            }
            else {
                pendientes++;
            }
            // También actualizar reportes por territorio para otras funciones
            territory.reportes = this._state.reportes.filter(reporte => {
                return this._matchTerritoryWithReporte(territory, reporte);
            });
            // Encontrar último reporte
            if (territory.reportes.length > 0) {
                territory.ultimoReporte = territory.reportes.reduce((latest, current) => {
                    return new Date(current.fecha) > new Date(latest.fecha) ? current : latest;
                });
                // Determinar estado basado en último reporte
                const daysSinceLastReport = this._getDaysSince(territory.ultimoReporte.fecha);
                if (daysSinceLastReport <= 30) {
                    territory.estado = 'completado';
                }
                else if (daysSinceLastReport <= 60) {
                    territory.estado = 'asignado';
                }
                else {
                    territory.estado = 'disponible';
                }
            }
            else {
                territory.estado = 'disponible';
            }
        });
        return {
            trabajadas,
            pendientes,
            total: this._state.territories.length
        };
    },
    /**
     * SPRINT 1 - Task 1.3: Analizar estado básico de territorios
     * Lógica simple: reportes de últimos 30 días
     * @private
     */
    _analyzeBasicTerritoryStatus(barrio) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 días atrás
        let trabajadasCount = 0;
        this._state.territories.forEach(territory => {
            const matchingReportes = this._state.reportes.filter(reporte => {
                const reporteDate = new Date(reporte.fecha);
                const matchesTerritory = this._matchTerritoryWithReporte(territory, reporte);
                const isRecent = reporteDate > cutoffDate;
                return matchesTerritory && isRecent;
            });
            const hasRecentReport = matchingReportes.length > 0;
            const status = hasRecentReport ? 'trabajada' : 'pendiente';
            if (hasRecentReport) {
                trabajadasCount++;
            }
            this._state.territoryRealTimeStatus.set(territory.id, status);
        });
        console.log(`📊 Análisis legacy: ${trabajadasCount}/${this._state.territories.length} territorios trabajados`);
        // Aplicar estilos después del análisis
        this._applyBasicRealTimeStyles();
        // SPRINT 2: Detectar ciclo completo
        this._detectCompleteCycle(barrio);
    },
    /**
     * SPRINT 2 - Task 2.1: Detectar si todas las manzanas han sido trabajadas
     * @private
     */
    _detectCompleteCycle(barrio) {
        const totalTerritories = this._state.territories.length;
        const trabajadas = Array.from(this._state.territoryRealTimeStatus.values())
            .filter(status => status === 'trabajada').length;
        const isComplete = trabajadas === totalTerritories;
        const progress = Math.round((trabajadas / totalTerritories) * 100);
        if (isComplete) {
            this._handleCycleComplete(barrio);
        }
        return {
            isComplete,
            progress,
            trabajadas,
            total: totalTerritories
        };
    },
    /**
     * SPRINT 2 - Task 2.2: Manejar ciclo completo y reinicio
     * @private
     */
    _handleCycleComplete(barrio) {
        // Incrementar ciclo actual directamente
        this._state.currentCycle = this._state.currentCycle + 1;
        const cycleInfo = {
            barrio,
            completedDate: new Date().toISOString(),
            cycleNumber: this._state.currentCycle,
            territories: this._state.territories.length
        };
        // Guardar en localStorage
        this._saveCycleInfo(cycleInfo);
        // Reiniciar estados
        this._resetTerritoryStatus();
        // Actualizar fecha de inicio
        this._state.cycleStartDate = new Date().toISOString();
        // Notificar al usuario
        UI.showNotification(`🎉 ¡Ciclo completo en ${barrio}! Iniciando nuevo seguimiento.`, 'success');
        // Ciclo completado
        // SPRINT 3: Actualizar progreso después del reinicio
        setTimeout(() => {
            this._showBarrioProgress();
        }, 100);
    },
    /**
     * SPRINT 2 - Task 2.3: Obtener número de ciclo actual
     * @private
     */
    _getCurrentCycleNumber(barrio) {
        const cycleData = this._loadCycleInfo(barrio);
        return cycleData ? cycleData.cycleNumber : 0;
    },
    /**
     * SPRINT 2 - Task 2.4: Guardar información de ciclo en localStorage
     * @private
     */
    _saveCycleInfo(cycleInfo) {
        try {
            const key = `cycle_${cycleInfo.barrio}`;
            JSONUtils.setToStorage(key, cycleInfo);
            // Guardar también en historial
            this._state.cycleHistory.set(cycleInfo.barrio, cycleInfo);
            console.log('💾 Información de ciclo guardada:', cycleInfo);
        }
        catch (error) {
            console.error('❌ Error al guardar información de ciclo:', error);
        }
    },
    /**
     * SPRINT 2 - Task 2.5: Cargar información de ciclo desde localStorage
     * @private
     */
    _loadCycleInfo(barrio) {
        try {
            const key = `cycle_${barrio}`;
            return JSONUtils.getFromStorage(key, null);
        }
        catch (error) {
            console.error('❌ Error al cargar información de ciclo:', error);
            return null;
        }
    },
    /**
     * SPRINT 2 - Task 2.6: Reiniciar estados de territorio
     * @private
     */
    _resetTerritoryStatus() {
        // Limpiar estados en tiempo real
        this._state.territoryRealTimeStatus.clear();
        // Re-analizar con estados limpios
        this._state.territories.forEach(territory => {
            this._state.territoryRealTimeStatus.set(territory.id, 'pendiente');
        });
        // Aplicar estilos actualizados
        this._applyBasicRealTimeStyles();
        console.log('🔄 Estados de territorio reiniciados');
    },
    /**
     * SPRINT 2 - Task 2.7: Inicializar información de ciclos al cargar barrio
     * @private
     */
    _initializeCycleInfo(barrio) {
        try {
            // Cargar información de ciclo existente
            const cycleData = this._loadCycleInfo(barrio);
            if (cycleData && cycleData.cycleNumber) {
                // CORREGIDO: Usar cycleStartDate, no completedDate
                this._state.currentCycle = cycleData.cycleNumber;
                this._state.cycleStartDate = cycleData.cycleStartDate || new Date().toISOString();
                this._state.cycleHistory.set(barrio, cycleData);
                console.log(`📊 Ciclo ${cycleData.cycleNumber} cargado para ${barrio}`);
                console.log(`📅 Fecha inicio ciclo: ${this._state.cycleStartDate}`);
            }
            else {
                // Primer ciclo para este barrio
                this._state.currentCycle = 1;
                this._state.cycleStartDate = new Date().toISOString();
                // Guardar el primer ciclo
                const initialCycleInfo = {
                    barrio,
                    cycleNumber: 1,
                    cycleStartDate: this._state.cycleStartDate,
                    territories: this._state.territories.length
                };
                this._saveCycleInfo(initialCycleInfo);
                console.log(`🆕 Iniciando primer ciclo para ${barrio}`);
                console.log(`📅 Fecha inicio ciclo: ${this._state.cycleStartDate}`);
            }
        }
        catch (error) {
            console.error('❌ Error al inicializar información de ciclos:', error);
            // Valores por defecto en caso de error
            this._state.currentCycle = 1;
            this._state.cycleStartDate = new Date().toISOString();
        }
    },
    /**
     * SPRINT 3 - Task 3.1: Validar selecciones antes de envío
     * @private
     */
    _validateTerritorySelections() {
        const trabajadasSeleccionadas = this._state.selectedTerritories.filter(territory => {
            const status = this._state.territoryRealTimeStatus.get(territory.id);
            return status === 'trabajada';
        });
        if (trabajadasSeleccionadas.length > 0) {
            const manzanas = trabajadasSeleccionadas
                .map(t => t.numero || t.id)
                .join(', ');
            return {
                hasWarning: true,
                message: `⚠️ Las manzanas ${manzanas} ya fueron trabajadas recientemente.\n\n¿Confirmas enviar este reporte?`,
                territories: trabajadasSeleccionadas
            };
        }
        return { hasWarning: false };
    },
    /**
     * SPRINT 3 - Task 3.2: Mostrar progreso del barrio
     * @private
     */
    _showBarrioProgress() {
        // Calcular estadísticas basadas en el estado actual
        const stats = this._calculateTerritoryStats();
        const trabajadas = stats.trabajadas || 0;
        const total = this._state.territories.length;
        const progress = total > 0 ? Math.round((trabajadas / total) * 100) : 0;
        const isComplete = progress === 100;
        const progressHTML = `
      <div class="barrio-progress mb-sm" style="
        background: var(--bg-surface);
        padding: var(--space-sm);
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-color);
      ">
        <div class="flex justify-between items-center mb-xs">
          <span class="text-sm font-semibold">${this._state.currentBarrio}</span>
          <span class="text-xs text-muted">${trabajadas}/${total} (${progress}%)</span>
        </div>
        <div class="progress-bar" style="
          width: 100%;
          height: 6px;
          background: var(--border-color);
          border-radius: 3px;
          overflow: hidden;
        ">
          <div style="
            width: ${progress}%;
            height: 100%;
            background: var(--success);
            transition: width 0.3s ease;
          "></div>
        </div>
        <div class="text-xs text-muted mt-xs">
          Ciclo ${this._state.currentCycle} • ${isComplete ? '🎉 ¡Completado!' : 'En progreso'}
        </div>
      </div>
    `;
        // Insertar antes de la leyenda
        const leyenda = document.querySelector('.flex.justify-center.gap-md.mb-sm');
        if (leyenda) {
            // Remover progreso anterior si existe
            const existingProgress = document.querySelector('.barrio-progress');
            if (existingProgress) {
                existingProgress.remove();
            }
            leyenda.insertAdjacentHTML('beforebegin', progressHTML);
        }
        // Progreso actualizado silenciosamente
    },
    /**
     * Mostrar progreso del barrio usando Clean Architecture
     * @private
     */
    _showBarrioProgressCleanArchitecture() {
        const progressContainer = document.getElementById('barrio-progress');
        if (!progressContainer)
            return;
        const barrio = this._state.currentBarrio;
        const cicloActivo = this._state.cicloActivo;
        const reportes = this._state.reportes;
        // Calcular estadísticas básicas
        const stats = this._calculateTerritoryStats();
        const trabajadas = stats.trabajadas || 0;
        const total = this._state.territories.length;
        const progress = total > 0 ? Math.round((trabajadas / total) * 100) : 0;
        // Progreso logging
        console.log(`📊 Progreso ${barrio}:`, {
            trabajadas,
            total,
            progress,
            territoryRealTimeStatus: this._state.territoryRealTimeStatus.size
        });
        // Información del ciclo
        let cicloNumero = 1;
        let estadoCiclo = 'activo';
        if (cicloActivo) {
            cicloNumero = cicloActivo.numero_ciclo || 1;
            estadoCiclo = cicloActivo.estado || 'activo';
        }
        const isComplete = progress === 100;
        // Obtener fecha del último reporte para modo consulta
        let ultimoReporteInfo = '';
        if (this._state.isConsultaMode && reportes && reportes.length > 0) {
            // Encontrar el reporte más reciente
            const ultimoReporte = reportes.reduce((latest, current) => {
                const currentDate = new Date(current.fecha);
                const latestDate = new Date(latest.fecha);
                return currentDate > latestDate ? current : latest;
            });
            if (ultimoReporte && ultimoReporte.fecha) {
                const fechaFormateada = UI.formatDate(ultimoReporte.fecha, 'short');
                ultimoReporteInfo = `
           <div class="flex justify-between items-center mt-xs">
             <span class="text-xs text-muted">📅 Último reporte:</span>
             <span class="text-xs text-primary font-medium">${fechaFormateada}</span>
           </div>
         `;
            }
        }
        // Usar variables del design system para mantener consistencia visual
        const backgroundColor = 'var(--bg-secondary)';
        const borderColor = 'var(--border-color)';
        const progressColor = isComplete ? 'var(--success)' : 'var(--info)';
        const progressHTML = `
      <div class="barrio-progress" style="
        background: ${backgroundColor};
        padding: 12px;
        border-radius: 6px;
        border: 1px solid ${borderColor};
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      ">
        <div class="flex justify-between items-center mb-xs">
          <span class="text-sm font-semibold text-primary">${barrio}</span>
          <span class="text-xs text-muted">${trabajadas}/${total} (${progress}%)</span>
        </div>
        <div class="progress-bar" style="
          width: 100%;
          height: 6px;
          background: var(--bg-surface);
          border-radius: 3px;
          overflow: hidden;
        ">
          <div class="progress-fill" style="
            width: ${progress}%;
            height: 100%;
            background: ${progressColor};
            transition: width 0.3s ease;
          "></div>
        </div>
        <div class="flex justify-between items-center mt-xs">
          <span class="text-xs text-muted">Ciclo ${cicloNumero}</span>
          <span class="text-xs ${isComplete ? 'text-success' : 'text-muted'}">
            ${isComplete ? '🎉 ¡Completado!' : 'En progreso'}
          </span>
        </div>
        ${ultimoReporteInfo}
      </div>
    `;
        progressContainer.innerHTML = progressHTML;
    },
    /**
     * SPRINT 3 - Task 3.3: Mostrar modal de confirmación
     * @private
     */
    _showConfirmationModal(message) {
        return new Promise((resolve) => {
            const modalHTML = `
        <div id="validation-modal" class="modal-overlay" style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        ">
          <div class="modal-content" style="
            background: var(--bg-surface);
            padding: var(--space-lg);
            border-radius: var(--radius-md);
            max-width: 400px;
            margin: var(--space-md);
            box-shadow: var(--shadow-lg);
          ">
            <div class="modal-header mb-md">
              <h3 class="text-lg font-semibold text-primary">Confirmar Reporte</h3>
            </div>
            <div class="modal-body mb-lg">
              <p class="text-sm" style="white-space: pre-line;">${message}</p>
            </div>
            <div class="modal-actions flex gap-sm justify-end">
              <button id="modal-cancel" class="btn btn--secondary">
                Cancelar
              </button>
              <button id="modal-confirm" class="btn btn--primary">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            const modal = document.getElementById('validation-modal');
            const cancelBtn = document.getElementById('modal-cancel');
            const confirmBtn = document.getElementById('modal-confirm');
            const cleanup = () => {
                if (modal) {
                    modal.remove();
                }
            };
            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });
            confirmBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });
            // Cerrar con ESC
            const handleKeydown = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(false);
                    document.removeEventListener('keydown', handleKeydown);
                }
            };
            document.addEventListener('keydown', handleKeydown);
        });
    },
    /**
     * Relacionar territorio con reporte
     * CORREGIDO: Maneja múltiples territorios separados por comas
     * @private
     */
    _matchTerritoryWithReporte(territory, reporte) {
        // CORREGIDO: Usar campo 'manzanas' en lugar de 'territorio'
        if (!reporte.manzanas) {
            console.log('⚠️ Reporte sin manzanas:', reporte.id);
            return false;
        }
        const reporteManzanas = reporte.manzanas.toString().trim();
        const territoryId = territory.id;
        const territoryNumber = territory.numero;
        // Extraer código de manzana del ID (ej: "manzana-Z-177" -> "Z-177")
        const territoryCode = territoryId.replace('manzana-', '');
        console.log('🔍 Comparando territorio:', {
            territoryId,
            territoryCode,
            territoryNumber,
            reporteManzanas
        });
        // Dividir múltiples manzanas por comas
        const manzanas = reporteManzanas.split(',').map(t => t.trim());
        // Buscar coincidencia con cualquiera de las manzanas
        const match = manzanas.some(manzana => {
            const isMatch = (manzana === territoryCode || // Coincidencia con código (Z-177)
                manzana === territoryId || // Coincidencia exacta con ID
                manzana === territoryNumber?.toString() || // Por número
                manzana === `${territoryNumber}` // Número como string
            );
            if (isMatch) {
                console.log('✅ MATCH encontrado:', {
                    manzana,
                    territoryCode,
                    territoryId,
                    territoryNumber
                });
            }
            return isMatch;
        });
        return match;
    },
    /**
     * Obtener días desde una fecha
     * @private
     */
    _getDaysSince(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },
    // ==========================================
    // INTERACCIONES DEL MAPA
    // ==========================================
    /**
     * Configurar interacciones del mapa
     * @private
     */
    _setupMapInteractions() {
        if (!this._state.svgElement)
            return;
        this._state.territories.forEach(territory => {
            const element = territory.element;
            // Agregar cursor pointer
            element.style.cursor = 'pointer';
            // Configurar touchAction para permitir clicks en zoom
            if (!this._state.isConsultaMode) {
                element.style.touchAction = 'manipulation';
            }
            // Event listeners
            element.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectTerritory(territory.id);
            });
            element.addEventListener('mouseenter', (e) => {
                this._showTerritoryTooltip(e, territory);
            });
            element.addEventListener('mouseleave', () => {
                this._hideTerritoryTooltip();
            });
        });
    },
    /**
     * Seleccionar territorio
     */
    selectTerritory(territoryId) {
        // En modo consulta, no permitir selección de territorios
        if (this._state.isConsultaMode) {
            console.log('🔍 Selección deshabilitada en modo consulta');
            return;
        }
        const territory = this._state.territories.find(t => t.id === territoryId);
        if (!territory)
            return;
        // Verificar si ya está seleccionado
        const index = this._state.selectedTerritories.findIndex(t => t.id === territoryId);
        if (index >= 0) {
            // Deseleccionar si ya estaba seleccionado
            this._state.selectedTerritories.splice(index, 1);
        }
        else {
            // Agregar a selecciones
            this._state.selectedTerritories.push(territory);
        }
        // Actualizar estilos visuales
        this._updateTerritorySelection();
        // Mostrar manzanas seleccionadas
        this._showSelectedTerritories();
        console.log('📍 Territorios seleccionados:', this._state.selectedTerritories.map(t => t.numero || t.id));
    },
    /**
     * Mostrar tooltip del territorio
     * @private
     */
    _showTerritoryTooltip(event, territory) {
        const tooltip = this._getOrCreateTooltip();
        // Contenido simplificado - solo número de manzana
        const barrioPrefix = this._state.currentBarrio ? this._state.currentBarrio.charAt(0).toLowerCase() : 'm';
        const numeroManzana = territory.numero || territory.id;
        const content = `
      <div class="territory-tooltip">
        <span class="manzana-number">Manzana ${barrioPrefix}-${numeroManzana}</span>
      </div>
    `;
        tooltip.innerHTML = content;
        tooltip.style.display = 'block';
        tooltip.style.left = event.pageX + 10 + 'px';
        tooltip.style.top = event.pageY + 10 + 'px';
        // Auto-ocultar después de 2 segundos
        clearTimeout(this._tooltipTimeout);
        this._tooltipTimeout = setTimeout(() => {
            this._hideTerritoryTooltip();
        }, 2000);
    },
    /**
     * Ocultar tooltip del territorio
     * @private
     */
    _hideTerritoryTooltip() {
        const tooltip = document.getElementById('territory-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
        // Limpiar timeout si existe
        if (this._tooltipTimeout) {
            clearTimeout(this._tooltipTimeout);
            this._tooltipTimeout = null;
        }
    },
    /**
     * Obtener o crear tooltip
     * @private
     */
    _getOrCreateTooltip() {
        let tooltip = document.getElementById('territory-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'territory-tooltip';
            tooltip.className = 'territory-tooltip';
            tooltip.style.cssText = `
        position: absolute;
        background: var(--bg-surface);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: var(--space-xs) var(--space-sm);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        display: none;
        white-space: nowrap;
        font-size: var(--font-size-md);
        font-weight: 600;
        color: var(--text-primary);
        pointer-events: none;
        transition: opacity 0.2s ease;
      `;
            // Agregar estilos específicos para el contenido
            const style = document.createElement('style');
            style.textContent = `
        .territory-tooltip .manzana-number {
          display: block;
          font-size: var(--font-size-md);
          font-weight: 600;
          color: var(--text-primary);
          text-align: center;
        }
      `;
            if (!document.querySelector('style[data-tooltip-styles]')) {
                style.setAttribute('data-tooltip-styles', 'true');
                document.head.appendChild(style);
            }
            document.body.appendChild(tooltip);
        }
        return tooltip;
    },
    // Funciones de animación y sonido eliminadas para mantener simplicidad
    /**
     * Inicializar controles de zoom
     * @private
     */
    _initZoomControls() {
        const zoomControls = document.getElementById('zoom-controls');
        const btnZoomIn = document.getElementById('btn-zoom-in');
        const btnZoomOut = document.getElementById('btn-zoom-out');
        const btnZoomCenter = document.getElementById('btn-zoom-center');
        if (!zoomControls || !btnZoomIn || !btnZoomOut || !btnZoomCenter)
            return;
        // Inicializar estado de zoom
        if (!this._state.zoomState) {
            this._state.zoomState = {
                scale: 1,
                translateX: 0,
                translateY: 0,
                minScale: 0.5,
                maxScale: 3
            };
        }
        // Event listeners para botones de zoom
        btnZoomIn.addEventListener('click', () => this._zoomIn());
        btnZoomOut.addEventListener('click', () => this._zoomOut());
        btnZoomCenter.addEventListener('click', () => this._zoomCenter());
        // Mostrar controles solo cuando hay un mapa cargado
        if (this._state.svgElement) {
            zoomControls.style.display = 'flex';
        }
        // Inicializar gestos táctiles para zoom
        this._initTouchGestures();
    },
    /**
     * Acercar zoom
     * @private
     */
    _zoomIn() {
        if (!this._state.svgElement || !this._state.zoomState)
            return;
        const newScale = Math.min(this._state.zoomState.scale * 1.3, this._state.zoomState.maxScale);
        this._applyZoom(newScale, this._state.zoomState.translateX, this._state.zoomState.translateY);
    },
    /**
     * Alejar zoom
     * @private
     */
    _zoomOut() {
        if (!this._state.svgElement || !this._state.zoomState)
            return;
        const newScale = Math.max(this._state.zoomState.scale / 1.3, this._state.zoomState.minScale);
        this._applyZoom(newScale, this._state.zoomState.translateX, this._state.zoomState.translateY);
    },
    /**
     * Centrar y resetear zoom
     * @private
     */
    _zoomCenter() {
        if (!this._state.svgElement || !this._state.zoomState)
            return;
        this._applyZoom(1, 0, 0);
    },
    /**
     * Aplicar transformación de zoom al SVG
     * @private
     */
    _applyZoom(scale, translateX, translateY) {
        if (!this._state.svgElement || !this._state.zoomState)
            return;
        // Actualizar estado
        this._state.zoomState.scale = scale;
        this._state.zoomState.translateX = translateX;
        this._state.zoomState.translateY = translateY;
        // Aplicar transformación
        const transform = `translate(${translateX}, ${translateY}) scale(${scale})`;
        this._state.svgElement.style.transform = transform;
        this._state.svgElement.style.transformOrigin = 'center center';
        this._state.svgElement.style.transition = 'transform 0.3s ease';
    },
    /**
     * Inicializar gestos táctiles para zoom con pellizco
     * @private
     */
    _initTouchGestures() {
        if (!this._state.mapContainer)
            return;
        let initialDistance = 0;
        let initialScale = 1;
        let isZooming = false;
        let isPanning = false;
        let lastTouchCenter = { x: 0, y: 0 };
        let lastPanPosition = { x: 0, y: 0 };
        let initialTranslate = { x: 0, y: 0 };
        // Prevenir el zoom del navegador
        this._state.mapContainer.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                // Calcular distancia inicial entre dedos
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                initialDistance = this._getTouchDistance(touch1, touch2);
                initialScale = this._state.zoomState?.scale || 1;
                isZooming = true;
                // Calcular centro entre los dos dedos
                lastTouchCenter = this._getTouchCenter(touch1, touch2);
                // Deshabilitar transición durante el gesto
                if (this._state.svgElement) {
                    this._state.svgElement.style.transition = 'none';
                }
            }
            else if (e.touches.length === 1 && this._state.zoomState?.scale > 1) {
                // Verificar si el toque es en un territorio SVG
                const target = e.target;
                const isTerritoryElement = target && (target.tagName === 'path' || target.tagName === 'polygon' || target.tagName === 'circle');
                // Solo iniciar paneo si no es un territorio o estamos en modo consulta
                if (!isTerritoryElement || this._state.isConsultaMode) {
                    e.preventDefault();
                    isPanning = true;
                    lastPanPosition = {
                        x: e.touches[0].clientX,
                        y: e.touches[0].clientY
                    };
                    initialTranslate = {
                        x: this._state.zoomState?.translateX || 0,
                        y: this._state.zoomState?.translateY || 0
                    };
                    if (this._state.svgElement) {
                        this._state.svgElement.style.transition = 'none';
                    }
                }
            }
        }, { passive: false });
        this._state.mapContainer.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && isZooming) {
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDistance = this._getTouchDistance(touch1, touch2);
                const currentCenter = this._getTouchCenter(touch1, touch2);
                // Calcular nuevo scale basado en la distancia
                const scaleChange = currentDistance / initialDistance;
                let newScale = initialScale * scaleChange;
                // Aplicar límites de zoom
                const minScale = this._state.zoomState?.minScale || 0.5;
                const maxScale = this._state.zoomState?.maxScale || 3;
                newScale = Math.max(minScale, Math.min(maxScale, newScale));
                // Obtener posición relativa al contenedor
                const containerRect = this._state.mapContainer.getBoundingClientRect();
                const relativeCenter = {
                    x: currentCenter.x - containerRect.left,
                    y: currentCenter.y - containerRect.top
                };
                // Calcular nuevo translate para mantener el punto de pellizco fijo
                const containerCenterX = containerRect.width / 2;
                const containerCenterY = containerRect.height / 2;
                const deltaX = relativeCenter.x - containerCenterX;
                const deltaY = relativeCenter.y - containerCenterY;
                const scaleDiff = newScale - initialScale;
                const newTranslateX = -deltaX * scaleDiff;
                const newTranslateY = -deltaY * scaleDiff;
                // Aplicar zoom sin transición
                this._applyZoomInstant(newScale, newTranslateX, newTranslateY);
                lastTouchCenter = currentCenter;
            }
            else if (e.touches.length === 1 && isPanning) {
                // Manejar paneo con un dedo solo si realmente estamos en modo paneo
                e.preventDefault();
                const currentTouch = e.touches[0];
                const deltaX = currentTouch.clientX - lastPanPosition.x;
                const deltaY = currentTouch.clientY - lastPanPosition.y;
                const newTranslateX = initialTranslate.x + deltaX;
                const newTranslateY = initialTranslate.y + deltaY;
                // Aplicar paneo sin transición
                this._applyZoomInstant(this._state.zoomState?.scale || 1, newTranslateX, newTranslateY);
            }
        }, { passive: false });
        this._state.mapContainer.addEventListener('touchend', (e) => {
            if (isZooming) {
                isZooming = false;
            }
            if (isPanning) {
                isPanning = false;
            }
            // Restaurar transición cuando termine cualquier gesto
            if (this._state.svgElement && !isZooming && !isPanning) {
                this._state.svgElement.style.transition = 'transform 0.3s ease';
            }
        });
        // Configurar touchAction para permitir clicks en territorios pero prevenir zoom del navegador
        this._state.mapContainer.style.touchAction = 'manipulation';
        // Aplicar touchAction específico a elementos SVG de territorios
        if (this._state.svgElement) {
            const territoryElements = this._state.svgElement.querySelectorAll('path, polygon, circle');
            territoryElements.forEach(element => {
                // Permitir clicks en territorios en modo reporte
                if (!this._state.isConsultaMode) {
                    element.style.touchAction = 'manipulation';
                }
            });
        }
    },
    /**
     * Calcular distancia entre dos puntos táctiles
     * @private
     */
    _getTouchDistance(touch1, touch2) {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    },
    /**
     * Calcular centro entre dos puntos táctiles
     * @private
     */
    _getTouchCenter(touch1, touch2) {
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
        };
    },
    /**
     * Aplicar zoom sin transición (para gestos en tiempo real)
     * @private
     */
    _applyZoomInstant(scale, translateX, translateY) {
        if (!this._state.svgElement || !this._state.zoomState)
            return;
        // Actualizar estado
        this._state.zoomState.scale = scale;
        this._state.zoomState.translateX = translateX;
        this._state.zoomState.translateY = translateY;
        // Aplicar transformación sin transición
        const transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        this._state.svgElement.style.transform = transform;
        this._state.svgElement.style.transformOrigin = 'center center';
    },
    /**
     * Mostrar manzanas seleccionadas
     * @private
     */
    _showSelectedTerritories() {
        const listaManzanas = document.getElementById('lista-manzanas');
        const manzanasContainer = document.getElementById('manzanas-container');
        if (!listaManzanas || !manzanasContainer)
            return;
        // En modo consulta, siempre ocultar la sección de manzanas seleccionadas
        if (this._state.isConsultaMode) {
            listaManzanas.style.display = 'none';
            return;
        }
        if (this._state.selectedTerritories.length === 0) {
            // Ocultar si no hay selecciones
            listaManzanas.style.display = 'none';
            return;
        }
        // Mostrar lista
        listaManzanas.style.display = 'block';
        // Generar HTML de manzanas seleccionadas
        const manzanasHTML = this._state.selectedTerritories.map(territory => {
            const numero = territory.numero || territory.id;
            const estadoClass = this._getEstadoBadgeClass(territory.estado);
            return `
        <div class="manzana-item" data-territory-id="${territory.id}" style="
          display: inline-flex;
          align-items: center;
          gap: var(--space-xs);
          padding: var(--space-xs) var(--space-sm);
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          font-size: var(--font-size-sm);
          margin-bottom: var(--space-xs);
        ">
          <span class="manzana-numero" style="font-weight: 600;">${numero}</span>
          <span class="manzana-estado badge badge--${estadoClass}" style="
            font-size: var(--font-size-xs);
            padding: 2px 6px;
          ">${this._getEstadoLabel(territory.estado)}</span>
          <button class="btn-remove-manzana" onclick="MapasManager.removeTerritorySelection('${territory.id}')" style="
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: 2px;
            font-size: 12px;
          " title="Quitar selección">
            ✕
          </button>
        </div>
      `;
        }).join('');
        manzanasContainer.innerHTML = manzanasHTML;
    },
    /**
     * Remover territorio de selección
     */
    removeTerritorySelection(territoryId) {
        const index = this._state.selectedTerritories.findIndex(t => t.id === territoryId);
        if (index >= 0) {
            this._state.selectedTerritories.splice(index, 1);
            this._updateTerritorySelection();
            this._showSelectedTerritories();
        }
    },
    // ==========================================
    // ESTILOS Y VISUALIZACIÓN
    // ==========================================
    /**
     * Aplicar estilos a los territorios
     * @private
     */
    _applyTerritoryStyles() {
        this._state.territories.forEach(territory => {
            const element = territory.element;
            // Limpiar clases anteriores
            element.classList.remove('territory-disponible', 'territory-asignado', 'territory-completado', 'territory-selected');
            // Aplicar clase según estado
            element.classList.add(`territory-${territory.estado}`);
            // Aplicar estilos CSS
            this._applyTerritoryElementStyles(element, territory.estado);
        });
        // SPRINT 4: Aplicar estilos en tiempo real
        this._applyBasicRealTimeStyles();
    },
    /**
     * Aplicar estilos CSS a elemento de territorio
     * REMOVIDO: Esta función interfería con los estilos de tiempo real
     * Los estilos ahora se manejan en _applyBasicRealTimeStyles
     * @private
     */
    _applyTerritoryElementStyles(element, estado) {
        // Función deshabilitada para evitar conflictos con estilos de tiempo real
        // Los estilos se aplican ahora en _applyBasicRealTimeStyles()
        return;
    },
    /**
     * SPRINT 1 - Task 1.4: Aplicar estilos básicos en tiempo real
     * Solo aplica a territorios NO seleccionados
     * @private
     */
    _applyBasicRealTimeStyles() {
        this._state.territories.forEach(territory => {
            const element = territory.element;
            const status = this._state.territoryRealTimeStatus.get(territory.id) || 'pendiente';
            // Comparar por ID en lugar de por referencia de objeto
            const isSelected = this._state.selectedTerritories.some(selected => selected.id === territory.id);
            if (!isSelected && element) {
                // Solo aplicar si NO está seleccionado
                const colorConfig = REAL_TIME_COLORS[status];
                element.style.fill = colorConfig.fill;
                element.style.stroke = colorConfig.stroke;
                element.style.strokeWidth = '1';
            }
            // Si está seleccionado, mantener estilos de selección existentes
        });
    },
    /**
     * Actualizar selección visual de territorio
     * @private
     */
    /**
     * Aplicar todos los estilos de manera centralizada y unificada
     * Esta función es la única responsable de aplicar colores
     * @private
     */
    _applyAllTerritoryStyles() {
        this._state.territories.forEach(territory => {
            if (!territory.element)
                return;
            const isSelected = this._state.selectedTerritories.some(selected => selected.id === territory.id);
            // Obtener estado desde EstadosManager si está disponible, sino usar el local
            let status = 'pendiente';
            if (window.EstadosManager && window.EstadosManager._state.territoryStatus) {
                status = window.EstadosManager._state.territoryStatus.get(territory.id) || 'pendiente';
            }
            else {
                status = this._state.territoryRealTimeStatus.get(territory.id) || 'pendiente';
            }
            if (isSelected) {
                // Aplicar estilos de selección
                territory.element.classList.add('territory-selected');
                const isWorked = status === 'trabajada';
                const colorConfig = isWorked ? SELECTION_COLORS.selected_worked : SELECTION_COLORS.selected_new;
                territory.element.style.strokeWidth = colorConfig.strokeWidth;
                territory.element.style.stroke = colorConfig.stroke;
                territory.element.style.fill = colorConfig.fill;
            }
            else {
                // Aplicar estilos de estado normal
                territory.element.classList.remove('territory-selected');
                const colorConfig = REAL_TIME_COLORS[status];
                territory.element.style.strokeWidth = '1';
                territory.element.style.stroke = colorConfig.stroke;
                territory.element.style.fill = colorConfig.fill;
            }
        });
    },
    _updateTerritorySelection() {
        // Aplicar todos los estilos de manera centralizada
        this._applyAllTerritoryStyles();
    },
    // ==========================================
    // UTILIDADES
    // ==========================================
    /**
     * Obtener etiqueta de estado
     * @private
     */
    _getEstadoLabel(estado) {
        const labels = {
            // Estados legacy (compatibilidad)
            disponible: 'Disponible',
            asignado: 'En progreso',
            // Estados nuevos del sistema mejorado
            iniciando: '🟢 Iniciando',
            en_progreso: '🔵 En Progreso',
            finalizando: '🟠 Finalizando',
            completado: '🎉 Completado',
            // Estados adicionales para compatibilidad
            trabajando: '🔵 Trabajando',
            iniciado: '🟢 Iniciado'
        };
        return labels[estado] || 'Desconocido';
    },
    /**
     * Obtener clase CSS para badge de estado
     * @private
     */
    _getEstadoBadgeClass(estado) {
        const classes = {
            // Estados legacy (compatibilidad)
            disponible: 'info',
            asignado: 'warning',
            // Estados nuevos del sistema mejorado
            iniciando: 'success', // Verde para inicio
            en_progreso: 'primary', // Azul para progreso
            finalizando: 'warning', // Naranja para finalizando
            completado: 'success', // Verde para completado
            // Estados adicionales para compatibilidad
            trabajando: 'primary', // Azul para trabajando
            iniciado: 'success' // Verde para iniciado
        };
        return classes[estado] || 'info';
    },
    /**
     * Aplicar filtros de territorio
     * @private
     */
    _applyTerritoryFilters() {
        const filtroEstado = document.getElementById('filtro-estado-territorio');
        const estadoFiltro = filtroEstado ? filtroEstado.value : '';
        this._state.territories.forEach(territory => {
            const shouldShow = !estadoFiltro || territory.estado === estadoFiltro;
            territory.element.style.display = shouldShow ? 'block' : 'none';
        });
    },
    /**
     * Limpiar mapa actual
     */
    clearMap() {
        if (this._state.mapContainer) {
            this._state.mapContainer.innerHTML = '';
        }
        this._state.currentMap = null;
        this._state.currentBarrio = '';
        this._state.territories = [];
        this._state.selectedTerritory = null;
        this._state.svgElement = null;
        // Limpiar panel de información
        const infoPanel = document.getElementById('territory-info-panel');
        if (infoPanel) {
            infoPanel.style.display = 'none';
        }
    },
    /**
     * Refrescar mapa actual
     */
    async refreshMap() {
        if (this._state.currentBarrio) {
            await this.loadMap(this._state.currentBarrio);
        }
    },
    // ==========================================
    // MÉTODOS PÚBLICOS ADICIONALES
    // ==========================================
    /**
     * Crear reporte para territorio específico
     */
    createReporteForTerritory(territoryId) {
        const territory = this._state.territories.find(t => t.id === territoryId);
        if (!territory) {
            UI.showNotification('Territorio no encontrado', 'error');
            return;
        }
        // Redirigir a página de reporte con datos pre-llenados
        const params = new URLSearchParams({
            barrio: this._state.currentBarrio,
            territorio: territory.numero || territory.id
        });
        window.location.href = `reportes.html?${params.toString()}`;
    },
    /**
     * SPRINT 3 - Método público: Validar selecciones antes de envío
     * Para uso desde mapa_reporte.js
     */
    validateSelectedTerritories() {
        return this._validateTerritorySelections();
    },
    /**
     * SPRINT 3 - Método público: Mostrar modal de confirmación
     * Para uso desde mapa_reporte.js
     */
    async showConfirmationModal(message) {
        return await this._showConfirmationModal(message);
    },
    // Función _createSendReportButton eliminada - solo usar "Crear Reporte"
    /**
     * NUEVO: Enviar reporte al backend
     * Función para crear reportes desde el mapa
     */
    async sendReporteToBackend() {
        try {
            console.log('🚀 INICIANDO sendReporteToBackend');
            // Validar que hay territorios seleccionados
            console.log('📍 Territorios seleccionados:', this._state.selectedTerritories.length);
            if (this._state.selectedTerritories.length === 0) {
                console.log('❌ No hay territorios seleccionados');
                UI.showNotification('Selecciona al menos una manzana', 'warning');
                return false;
            }
            // Obtener datos de la URL (enviados desde reportes.html)
            const urlParams = new URLSearchParams(window.location.search);
            const capitan = urlParams.get('capitan');
            const fecha = urlParams.get('fecha');
            const barrio = urlParams.get('barrio');
            const observaciones = urlParams.get('observaciones');
            const estado = urlParams.get('estado');
            console.log('📝 Datos de URL:', { capitan, fecha, barrio, observaciones, estado });
            // Validar datos requeridos (incluye 'estado' manual)
            if (!capitan || !fecha || !barrio || !estado) {
                console.log('❌ Faltan datos requeridos');
                UI.showNotification('Faltan datos del reporte (incluye estado). Vuelve a reportes.html', 'error');
                return false;
            }
            // Preparar lista de manzanas seleccionadas
            const manzanasSeleccionadas = this._state.selectedTerritories.map(territory => {
                // Extraer número de manzana del ID (ej: "manzana-Z-174" -> "Z-174")
                return territory.id.replace('manzana-', '');
            });
            // Preparar datos del reporte con estado manual
            const reporteData = {
                nombre_capitan: capitan,
                fecha: fecha,
                barrio: barrio,
                manzanas: manzanasSeleccionadas.join(','), // Enviar como string separado por comas
                estado: estado, // Incluir estado definido manualmente
                observaciones: observaciones || null // Incluir observaciones si existen
            };
            console.log('📤 Enviando reporte al backend con estado manual:', reporteData);
            // Enviar al backend usando nueva API
            const response = await fetch(`${API_BASE}/reportes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reporteData)
            });
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Error al crear reporte');
            }
            console.log('✅ Reporte creado exitosamente:', result.data);
            // Mostrar información del ciclo si está disponible
            if (result.data.ciclo) {
                console.log('🔄 Información del ciclo:', result.data.ciclo);
            }
            // Mostrar mensaje de éxito prominente
            UI.showNotification('¡Reporte enviado exitosamente! 🎉', 'success', 3000);
            // Limpiar caché del formulario
            if (window.MapaReporteManager && typeof window.MapaReporteManager.clearFormCache === 'function') {
                window.MapaReporteManager.clearFormCache();
            }
            // Limpiar selecciones
            this._state.selectedTerritories = [];
            this._updateTerritorySelection();
            // Recargar datos para mostrar el nuevo reporte
            await this.refreshMap();
            // Redirigir suavemente al index después de 2 segundos
            setTimeout(() => {
                // Mostrar mensaje de redirección
                UI.showNotification('Regresando al inicio...', 'info', 1000);
                // Redirigir con transición suave después de 1 segundo más
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }, 2000);
            return true;
        }
        catch (error) {
            console.error('❌ Error al enviar reporte:', error);
            UI.showNotification('Error al enviar reporte: ' + error.message, 'error');
            return false;
        }
    },
    /**
     * Ver historial completo del territorio
     */
    viewTerritoryHistory(territoryId) {
        const territory = this._state.territories.find(t => t.id === territoryId);
        if (!territory) {
            UI.showNotification('Territorio no encontrado', 'error');
            return;
        }
        const content = `
      <div class="territory-history">
        <h3>Historial - Territorio ${territory.numero || territory.id}</h3>
        <p><strong>Barrio:</strong> ${this._state.currentBarrio}</p>
        <p><strong>Total reportes:</strong> ${territory.reportes.length}</p>
        
        ${territory.reportes.length > 0 ? `
          <div class="reports-table">
            <table class="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Reportado por</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${territory.reportes.map(reporte => `
                  <tr>
                    <td>${UI.formatDate(reporte.fecha)}</td>
                    <td>${reporte.nombre} ${reporte.apellido}</td>
                    <td>
                      <span class="badge badge--${this._getEstadoBadgeClass(reporte.estado || 'completado')}">
                        ${reporte.estado || 'Completado'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<p class="text-muted">No hay reportes registrados para este territorio.</p>'}
      </div>
    `;
        UI.createModal(`Historial - Territorio ${territory.numero || territory.id}`, content, {
            size: 'large'
        });
    },
    // Lógica de detección automática de estados eliminada: ahora el estado se define manualmente
    // por el usuario en reportes.html y se envía directamente al backend.
};
// Hacer MapasManager disponible globalmente
if (typeof window !== 'undefined') {
    window.MapasManager = MapasManager;
}
// Exportar por defecto
export default MapasManager;
//# sourceMappingURL=mapas.js.map