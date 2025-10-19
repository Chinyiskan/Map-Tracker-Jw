/**
 * frontend/js/mapas.ts
 * Módulo de Mapas - Gestión de mapas SVG y territorios
 * Migrado a TypeScript con tipado completo
 */

import { UI } from './ui.js';
import { JSONUtils } from './json-utils.js';
import type { 
  MapState, 
  Territory, 
  TerritoryColors, 
  TerritoryColor,
  SelectionColors,
  SelectionColor,
  CicloActivo,
  ProgresoBarrio,
  CycleHistoryEntry,
  MapApiConfig,
  TerritoryApiData,
  ReporteResponse,
  MapUrlParams,
  TerritoryFilters,
  MapStatistics,
  MapInteractionConfig,
  TerritoryEvent,
  MapasManagerInterface,
  ReporteAPI
} from './types/index.js';

// Configuración de API
const API_BASE: string = '/api';

// SPRINT 4 - Colores más saturados y visibles para estados
const REAL_TIME_COLORS: TerritoryColors = {
  'pendiente': {
    fill: 'rgba(255, 77, 77, 0.65)',     // Rojo más saturado - Sin trabajar
    stroke: 'rgba(255, 77, 77, 0.9)',
    label: 'Pendiente'
  },
  'trabajada': {
    fill: 'rgba(39, 174, 96, 0.65)',     // Verde más saturado - Trabajada
    stroke: 'rgba(39, 174, 96, 0.95)',
    label: 'Trabajada'
  }
};

// SPRINT 4 - Colores más saturados para selección
const SELECTION_COLORS: SelectionColors = {
  'selected_new': {
    fill: 'rgba(41, 128, 185, 0.75)',    // Azul más saturado - Selección nueva
    stroke: 'rgba(41, 128, 185, 1)',
    strokeWidth: '3'
  },
  'selected_worked': {
    fill: 'rgba(211, 84, 0, 0.75)',      // Naranja más saturado - Selección trabajada
    stroke: 'rgba(211, 84, 0, 1)',
    strokeWidth: '3'
  }
};

/**
 * Módulo de Mapas - Gestión completa de mapas SVG y territorios
 * Maneja carga de mapas, interacciones, territorios y reportes
 */
export const MapasManager: MapasManagerInterface = {
  
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
    territoryRealTimeStatus: new Map<string, 'pendiente' | 'trabajada'>(),
    // Clean Architecture: Información de ciclos y progreso
    cicloActivo: null, // Información del ciclo activo del barrio
    progresoBarrio: null, // Progreso detallado del barrio
    // Legacy: Información de ciclos (mantener para compatibilidad)
    currentCycle: 1,
    cycleStartDate: null,
    cycleHistory: new Map<string, CycleHistoryEntry>(),
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
  async init(): Promise<void> {
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
      
      // Cargar mapa inicial si hay barrio seleccionado
      const initialBarrio = this._getInitialBarrio();
      if (initialBarrio) {
        await this.loadMap(initialBarrio);
      }
      
      console.log('✅ MapasManager inicializado correctamente');
      
    } catch (error) {
      console.error('❌ Error al inicializar MapasManager:', error);
      UI.showNotification('Error al cargar el módulo de mapas', 'error');
    }
  },
  
  /**
   * Configurar event listeners
   * @private
   */
  _setupEventListeners(): void {
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
   * Configurar botones según el modo (consulta vs reporte)
   * @private
   */
  _setupModeButtons(): void {
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
      if (btnCrearReporte) btnCrearReporte.style.display = 'none';
      if (btnEnviarReporte) btnEnviarReporte.style.display = 'inline-flex';
    } else {
      // Modo normal: mostrar botón "Crear Reporte", ocultar "Enviar Reporte"
      console.log('🔧 Activando modo CONSULTA');
      if (btnCrearReporte) btnCrearReporte.style.display = 'inline-flex';
      if (btnEnviarReporte) btnEnviarReporte.style.display = 'none';
    }
    
    // En modo consulta, ocultar ambos botones
    if (this._state.isConsultaMode) {
      console.log('🔧 Modo consulta detectado - ocultando botones');
      if (btnCrearReporte) btnCrearReporte.style.display = 'none';
      if (btnEnviarReporte) btnEnviarReporte.style.display = 'none';
    }
  },
  
  /**
   * Obtener barrio inicial desde URL o localStorage
   * @private
   */
  _getInitialBarrio(): string | null {
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
      } else if (typeof storedBarrio === 'string') {
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
  _detectConsultaMode(): void {
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
  _enableConsultaMode(): void {
    // Cambiar título para indicar modo consulta
    const titulo = document.getElementById('titulo-barrio');
    if (titulo) {
      const textoOriginal = titulo.textContent || '';
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
      (legend as HTMLElement).style.display = 'none';
    });
  },
  
  // ==========================================
  // GESTIÓN DE MAPAS
  // ==========================================
  
  /**
   * Encontrar barrio válido comparando con y sin tildes
   * @param barrio - Nombre del barrio a buscar
   * @returns Nombre del barrio válido o null
   * @private
   */
  _findValidBarrio(barrio: string): string | null {
    if (!barrio) return null;
    
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

  /**
   * Normalizar nombre de barrio (eliminar tildes y espacios)
   * @private
   */
  _normalizeBarrioName(barrio: string): string {
    return barrio
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },
  
  /**
   * Cargar mapa SVG de un barrio específico
   */
  async loadMap(barrio: string): Promise<void> {
    try {
      // Encontrar barrio válido (con o sin tildes)
      const validBarrio = this._findValidBarrio(barrio);
      
      if (!validBarrio) {
        throw new Error(`Barrio no válido: "${barrio}"`);
      }
      
      // Usar el barrio válido encontrado
      barrio = validBarrio;
      
      // Limpiar mapa anterior
      this.clearMap();
      
      // Actualizar estado
      this._state.currentBarrio = barrio;
      
      // Guardar en localStorage
      localStorage.setItem('ultimo_barrio_seleccionado', barrio);
      
      // Actualizar selector
      const selector = document.getElementById('barrio-selector') as HTMLSelectElement;
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
      
    } catch (error) {
      console.error('❌ Error al cargar mapa:', error);
      UI.showNotification(`Error al cargar mapa de ${barrio}`, 'error');
    }
  },

  /**
   * Cargar archivo SVG desde el servidor
   * @private
   */
  async _loadSVGFile(barrio: string): Promise<string> {
    const response = await fetch(`${API_BASE}/mapas/${encodeURIComponent(barrio)}.svg`);
    if (!response.ok) {
      throw new Error(`Error al cargar SVG: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  },

  /**
   * Renderizar mapa SVG en el contenedor
   * @private
   */
  _renderMap(svgContent: string): void {
    if (!this._state.mapContainer) {
      throw new Error('Contenedor de mapa no disponible');
    }

    this._state.mapContainer.innerHTML = svgContent;
    this._state.svgElement = this._state.mapContainer.querySelector('svg');
    
    if (!this._state.svgElement) {
      throw new Error('No se pudo encontrar elemento SVG en el contenido');
    }

    // Configurar SVG para responsividad
    this._state.svgElement.setAttribute('width', '100%');
    this._state.svgElement.setAttribute('height', '100%');
  },

  /**
   * Cargar datos de territorios desde API
   * @private
   */
  async _loadTerritoryData(barrio: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/territorios/${encodeURIComponent(barrio)}`);
      if (!response.ok) {
        throw new Error(`Error al cargar territorios: ${response.status}`);
      }
      
      const data: TerritoryApiData[] = await response.json();
      this._state.territories = data.map(item => ({
        id: item.id,
        nombre: item.nombre,
        barrio: item.barrio,
        estado: item.estado as 'pendiente' | 'trabajada' | 'completada',
        coordenadas: item.coordenadas,
        manzanas: item.manzanas,
        ultimaActualizacion: item.ultimaActualizacion
      }));
      
      console.log(`📍 Cargados ${this._state.territories.length} territorios para ${barrio}`);
      
    } catch (error) {
      console.error('❌ Error al cargar datos de territorios:', error);
      this._state.territories = [];
    }
  },

  /**
   * Cargar reportes del barrio
   * @private
   */
  async _loadBarrioReportes(barrio: string): Promise<ReporteAPI[]> {
    try {
      const response = await fetch(`${API_BASE}/reportes/barrio/${encodeURIComponent(barrio)}`);
      if (!response.ok) {
        throw new Error(`Error al cargar reportes: ${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : data.reportes || [];
      
    } catch (error) {
      console.error('❌ Error al cargar reportes del barrio:', error);
      return [];
    }
  },

  /**
   * Cargar ciclo activo del barrio
   * @private
   */
  async _loadCicloActivo(barrio: string): Promise<CicloActivo | null> {
    try {
      const response = await fetch(`${API_BASE}/ciclos/activo/${encodeURIComponent(barrio)}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`ℹ️ No hay ciclo activo para ${barrio}`);
          return null;
        }
        throw new Error(`Error al cargar ciclo activo: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('❌ Error al cargar ciclo activo:', error);
      return null;
    }
  },

  /**
   * Cargar progreso del barrio
   * @private
   */
  async _loadProgresoBarrio(barrio: string): Promise<ProgresoBarrio | null> {
    try {
      const response = await fetch(`${API_BASE}/progreso/barrio/${encodeURIComponent(barrio)}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`ℹ️ No hay datos de progreso para ${barrio}`);
          return null;
        }
        throw new Error(`Error al cargar progreso: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('❌ Error al cargar progreso del barrio:', error);
      return null;
    }
  },

  /**
   * Configurar interacciones del mapa
   * @private
   */
  _setupMapInteractions(): void {
    if (!this._state.svgElement) return;

    // Obtener todos los elementos de territorio (paths, polygons, etc.)
    const territoryElements = this._state.svgElement.querySelectorAll('[id*="manzana"], [id*="territorio"], [class*="territory"]');
    
    territoryElements.forEach(element => {
      // Click en territorio
      element.addEventListener('click', (event) => {
        this._handleTerritoryClick(event);
      });
      
      // Hover en territorio
      element.addEventListener('mouseenter', (event) => {
        this._handleTerritoryHover(event);
      });
      
      // Salir del hover
      element.addEventListener('mouseleave', (event) => {
        // Restaurar estilo original si no está seleccionado
        const territoryId = (event.target as SVGElement).id;
        if (!this._state.selectedTerritories.includes(territoryId)) {
          this._applyTerritoryStyles();
        }
      });
    });
  },

  /**
   * Manejar click en territorio
   * @private
   */
  _handleTerritoryClick(event: Event): void {
    if (this._state.isConsultaMode) return; // No permitir selección en modo consulta

    const element = event.target as SVGElement;
    const territoryId = element.id;
    
    if (!territoryId) return;

    // Toggle selección
    if (this._state.selectedTerritories.includes(territoryId)) {
      this.deselectTerritory(territoryId);
    } else {
      this.selectTerritory(territoryId);
    }
  },

  /**
   * Manejar hover en territorio
   * @private
   */
  _handleTerritoryHover(event: Event): void {
    const element = event.target as SVGElement;
    const territoryId = element.id;
    
    if (!territoryId) return;

    // Mostrar información del territorio
    const territory = this.getTerritoryById(territoryId);
    if (territory) {
      // Implementar tooltip o información hover
      console.log('Hover en territorio:', territory);
    }
  },

  /**
   * Seleccionar territorio
   */
  selectTerritory(territoryId: string): void {
    if (!this._state.selectedTerritories.includes(territoryId)) {
      this._state.selectedTerritories.push(territoryId);
      this._updateTerritorySelection();
      this._showSelectedTerritories();
    }
  },

  /**
   * Deseleccionar territorio
   */
  deselectTerritory(territoryId: string): void {
    const index = this._state.selectedTerritories.indexOf(territoryId);
    if (index > -1) {
      this._state.selectedTerritories.splice(index, 1);
      this._updateTerritorySelection();
      this._showSelectedTerritories();
    }
  },

  /**
   * Limpiar selección
   */
  clearSelection(): void {
    this._state.selectedTerritories = [];
    this._updateTerritorySelection();
    this._showSelectedTerritories();
  },

  /**
   * Aplicar estilos a territorios
   * @private
   */
  _applyTerritoryStyles(): void {
    if (!this._state.svgElement) return;

    this._state.territories.forEach(territory => {
      const element = this._state.svgElement!.querySelector(`#${territory.id}`) as SVGElement;
      if (!element) return;

      const colors = REAL_TIME_COLORS[territory.estado] || REAL_TIME_COLORS.pendiente;
      
      element.style.fill = colors.fill;
      element.style.stroke = colors.stroke;
      element.style.strokeWidth = '1';
    });
  },

  /**
   * Actualizar selección visual de territorios
   * @private
   */
  _updateTerritorySelection(): void {
    if (!this._state.svgElement) return;

    // Primero aplicar estilos normales
    this._applyTerritoryStyles();

    // Luego aplicar estilos de selección
    this._state.selectedTerritories.forEach(territoryId => {
      const element = this._state.svgElement!.querySelector(`#${territoryId}`) as SVGElement;
      if (!element) return;

      const territory = this.getTerritoryById(territoryId);
      const isWorked = territory?.estado === 'trabajada';
      const selectionColor = isWorked ? SELECTION_COLORS.selected_worked : SELECTION_COLORS.selected_new;
      
      element.style.fill = selectionColor.fill;
      element.style.stroke = selectionColor.stroke;
      element.style.strokeWidth = selectionColor.strokeWidth;
    });
  },

  /**
   * Aplicar filtros de territorio
   * @private
   */
  _applyTerritoryFilters(): void {
    const filtroEstado = document.getElementById('filtro-estado-territorio') as HTMLSelectElement;
    if (!filtroEstado || !this._state.svgElement) return;

    const estadoFiltro = filtroEstado.value;

    this._state.territories.forEach(territory => {
      const element = this._state.svgElement!.querySelector(`#${territory.id}`) as SVGElement;
      if (!element) return;

      const shouldShow = estadoFiltro === 'todos' || territory.estado === estadoFiltro;
      element.style.opacity = shouldShow ? '1' : '0.3';
    });
  },

  /**
   * Analizar estado básico de territorios
   * @private
   */
  _analyzeBasicTerritoryStatus(barrio: string): void {
    // Implementar análisis básico basado en reportes cargados
    this._state.reportes.forEach(reporte => {
      if (reporte.manzanas) {
        const manzanas = typeof reporte.manzanas === 'string' 
          ? reporte.manzanas.split(',').map(m => m.trim())
          : reporte.manzanas;
        
        manzanas.forEach(manzana => {
          this._state.territoryRealTimeStatus.set(manzana, 'trabajada');
        });
      }
    });
  },

  /**
   * Enviar reporte al backend
   */
  async sendReporteToBackend(): Promise<void> {
    try {
      const reporteData = this._prepareReporteData();
      
      if (!this._validateReporteData(reporteData)) {
        UI.showNotification('Datos de reporte inválidos', 'error');
        return;
      }

      const response = await fetch(`${API_BASE}/reportes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reporteData)
      });

      if (!response.ok) {
        throw new Error(`Error al enviar reporte: ${response.status}`);
      }

      const result: ReporteResponse = await response.json();
      
      if (result.success) {
        UI.showNotification('Reporte enviado exitosamente', 'success');
        // Limpiar selección después del envío
        this.clearSelection();
      } else {
        throw new Error(result.message || 'Error desconocido');
      }

    } catch (error) {
      console.error('❌ Error al enviar reporte:', error);
      UI.showNotification('Error al enviar reporte', 'error');
    }
  },

  /**
   * Preparar datos del reporte
   * @private
   */
  _prepareReporteData(): any {
    const urlParams = new URLSearchParams(window.location.search);
    
    return {
      capitan: urlParams.get('capitan'),
      fecha: urlParams.get('fecha'),
      barrio: this._state.currentBarrio,
      manzanas: this._state.selectedTerritories,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Validar datos del reporte
   * @private
   */
  _validateReporteData(data: any): boolean {
    return !!(data.capitan && data.fecha && data.barrio && data.manzanas?.length > 0);
  },

  /**
   * Mostrar territorios seleccionados
   * @private
   */
  _showSelectedTerritories(): void {
    const container = document.getElementById('selected-territories-list');
    if (!container) return;

    if (this._state.selectedTerritories.length === 0) {
      container.innerHTML = '<p class="text-gray-500">No hay territorios seleccionados</p>';
      return;
    }

    const html = this._state.selectedTerritories.map(territoryId => {
      const territory = this.getTerritoryById(territoryId);
      return `
        <div class="selected-territory-item">
          <span>${territory?.nombre || territoryId}</span>
          <button onclick="MapasManager.deselectTerritory('${territoryId}')" class="btn-remove">×</button>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  },

  /**
   * Mostrar progreso del barrio (Clean Architecture)
   * @private
   */
  _showBarrioProgressCleanArchitecture(): void {
    const progressContainer = document.getElementById('barrio-progress');
    if (!progressContainer) return;

    const progreso = this._state.progresoBarrio;
    const ciclo = this._state.cicloActivo;

    if (!progreso) {
      progressContainer.innerHTML = '<p class="text-gray-500">No hay datos de progreso disponibles</p>';
      return;
    }

    const html = `
      <div class="progress-info">
        <h3>Progreso de ${progreso.barrio}</h3>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progreso.porcentaje}%"></div>
        </div>
        <p>${progreso.manzanasCompletadas} de ${progreso.totalManzanas} manzanas (${progreso.porcentaje.toFixed(1)}%)</p>
        ${ciclo ? `<p>Ciclo activo: ${ciclo.nombre}</p>` : ''}
        <p>Última actualización: ${new Date(progreso.ultimaActualizacion).toLocaleDateString()}</p>
      </div>
    `;

    progressContainer.innerHTML = html;
  },

  /**
   * Actualizar estadísticas del mapa
   * @private
   */
  _updateMapStatistics(): void {
    // Implementar actualización de estadísticas
  },

  /**
   * Limpiar mapa
   */
  clearMap(): void {
    if (this._state.mapContainer) {
      this._state.mapContainer.innerHTML = '';
    }
    
    this._state.currentMap = null;
    this._state.svgElement = null;
    this._state.territories = [];
    this._state.selectedTerritories = [];
    this._state.territoryRealTimeStatus.clear();
  },

  /**
   * Refrescar mapa actual
   */
  async refreshMap(): Promise<void> {
    if (this._state.currentBarrio) {
      await this.loadMap(this._state.currentBarrio);
    }
  },

  // ==========================================
  // MÉTODOS PÚBLICOS
  // ==========================================

  /**
   * Obtener territorios seleccionados
   */
  getSelectedTerritories(): string[] {
    return [...this._state.selectedTerritories];
  },

  /**
   * Obtener barrio actual
   */
  getCurrentBarrio(): string {
    return this._state.currentBarrio;
  },

  /**
   * Obtener territorio por ID
   */
  getTerritoryById(id: string): Territory | null {
    return this._state.territories.find(t => t.id === id) || null;
  },

  /**
   * Establecer barrio
   */
  async setBarrio(barrio: string): Promise<void> {
    await this.loadMap(barrio);
  },

  /**
   * Obtener estadísticas del mapa
   */
  getMapStatistics(): MapStatistics {
    const total = this._state.territories.length;
    const pendientes = this._state.territories.filter(t => t.estado === 'pendiente').length;
    const trabajados = this._state.territories.filter(t => t.estado === 'trabajada').length;
    const completados = this._state.territories.filter(t => t.estado === 'completada').length;

    return {
      totalTerritorios: total,
      territoriosPendientes: pendientes,
      territoriosTrabajados: trabajados,
      territoriosCompletados: completados,
      porcentajeProgreso: total > 0 ? ((trabajados + completados) / total) * 100 : 0
    };
  },

  /**
   * Exportar datos del mapa
   */
  exportMapData(): any {
    return {
      barrio: this._state.currentBarrio,
      territories: this._state.territories,
      selectedTerritories: this._state.selectedTerritories,
      statistics: this.getMapStatistics(),
      timestamp: new Date().toISOString()
    };
  }
};

// Hacer MapasManager disponible globalmente
if (typeof window !== 'undefined') {
  (window as any).MapasManager = MapasManager;
}

// Exportar por defecto
export default MapasManager;