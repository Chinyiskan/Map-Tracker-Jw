/**
 * MapasConsultaManager - Gestión de consultas y búsquedas en mapas
 * Migrado a TypeScript desde mapas_consulta.js
 */

import { 
  ConsultaFilters, 
  ConsultaState, 
  ConsultaResultado,
  SearchStats,
  ExportData,
  MapasConsultaManagerInterface,
  ReporteAPI,
  SalidaAPI,
  SalidaCapitan,
  Capitan,
  FilterValidation
} from './types/index.js';

// Importar dependencias
import UI from './ui.js';
import MapasManager from './mapas.js';

// Configuración de la API
const API_BASE = '/api';

/**
 * Manager para consultas avanzadas de mapas y territorios
 */
const MapasConsultaManager: MapasConsultaManagerInterface = {
  // ==========================================
  // ESTADO INTERNO
  // ==========================================
  
  /**
   * Estado interno del módulo
   */
  _state: {
    currentFilters: {
      barrio: '',
      fechaInicio: '',
      fechaFin: '',
      estado: '',
      capitan: '',
      territorio: ''
    },
    reportes: [],
    salidas: [],
    capitanes: [],
    resultados: [],
    isLoading: false
  } as ConsultaState,

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================

  /**
   * Inicializar el módulo de consultas
   */
  async init(): Promise<void> {
    try {
      console.log('🔍 Inicializando MapasConsultaManager...');
      
      // Configurar event listeners
      this._setupEventListeners();
      
      // Cargar datos iniciales
      await this._loadInitialData();
      
      // Configurar filtros
      this._setupFilters();
      
      // Configurar fechas por defecto
      this._setupDefaultDates();
      
      console.log('✅ MapasConsultaManager inicializado correctamente');
      
    } catch (error) {
      console.error('❌ Error al inicializar MapasConsultaManager:', error);
      UI.showNotification('Error al inicializar consultas', 'error');
    }
  },

  /**
   * Configurar event listeners
   * @private
   */
  _setupEventListeners(): void {
    // Botón de búsqueda
    const btnBuscar = document.getElementById('btn-buscar');
    if (btnBuscar) {
      btnBuscar.addEventListener('click', () => this.executeSearch());
    }

    // Botón de limpiar filtros
    const btnLimpiar = document.getElementById('btn-limpiar-filtros');
    if (btnLimpiar) {
      btnLimpiar.addEventListener('click', () => this.clearFilters());
    }

    // Botón de exportar
    const btnExportar = document.getElementById('btn-exportar');
    if (btnExportar) {
      btnExportar.addEventListener('click', () => this.exportResults());
    }

    // Filtros con búsqueda automática
    const filtros = ['filtro-barrio-consulta', 'filtro-territorio-consulta', 'filtro-capitan-consulta'];
    filtros.forEach(filtroId => {
      const elemento = document.getElementById(filtroId);
      if (elemento) {
        elemento.addEventListener('change', () => this._applyFilters());
      }
    });

    // Enter en campos de fecha
    const fechaInicio = document.getElementById('fecha-inicio-consulta') as HTMLInputElement;
    const fechaFin = document.getElementById('fecha-fin-consulta') as HTMLInputElement;
    
    if (fechaInicio) {
      fechaInicio.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.executeSearch();
      });
    }
    
    if (fechaFin) {
      fechaFin.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.executeSearch();
      });
    }
  },

  /**
   * Cargar datos iniciales
   * @private
   */
  async _loadInitialData(): Promise<void> {
    try {
      // Cargar capitanes
      await this._loadCapitanes();
      
      // Poblar selectores
      this._populateBarriosSelector();
      this._populateCapitanesSelector();
      
    } catch (error) {
      console.error('❌ Error al cargar datos iniciales:', error);
      throw error;
    }
  },

  /**
   * Cargar lista de capitanes
   * @private
   */
  async _loadCapitanes(): Promise<Capitan[]> {
    try {
      const response = await fetch(`${API_BASE}/capitanes`);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      this._state.capitanes = data.capitanes || [];
      return this._state.capitanes;
      
    } catch (error) {
      console.error('❌ Error al cargar capitanes:', error);
      this._state.capitanes = [];
      return [];
    }
  },

  /**
   * Configurar filtros
   * @private
   */
  _setupFilters(): void {
    // Configurar filtros por defecto
    this._state.currentFilters = {
      barrio: '',
      territorio: '',
      capitan: '',
      fechaInicio: '',
      fechaFin: '',
      estado: ''
    };
  },

  /**
   * Configurar fechas por defecto
   * @private
   */
  _setupDefaultDates(): void {
    const fechaFin = document.getElementById('fecha-fin-consulta') as HTMLInputElement;
    const fechaInicio = document.getElementById('fecha-inicio-consulta') as HTMLInputElement;
    
    if (fechaFin) {
      fechaFin.value = new Date().toISOString().split('T')[0];
    }
    
    if (fechaInicio) {
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);
      fechaInicio.value = hace30Dias.toISOString().split('T')[0];
    }
  },

  // ==========================================
  // GESTIÓN DE FILTROS
  // ==========================================

  /**
   * Obtener filtros actuales
   * @private
   */
  _getCurrentFilters(): ConsultaFilters {
    const barrio = (document.getElementById('filtro-barrio-consulta') as HTMLSelectElement)?.value || '';
    const territorio = (document.getElementById('filtro-territorio-consulta') as HTMLInputElement)?.value || '';
    const capitan = (document.getElementById('filtro-capitan-consulta') as HTMLSelectElement)?.value || '';
    const fechaInicio = (document.getElementById('fecha-inicio-consulta') as HTMLInputElement)?.value || '';
    const fechaFin = (document.getElementById('fecha-fin-consulta') as HTMLInputElement)?.value || '';
    const estado = (document.getElementById('filtro-estado-consulta') as HTMLSelectElement)?.value || '';

    return {
      barrio,
      territorio,
      capitan,
      fechaInicio,
      fechaFin,
      estado
    };
  },

  /**
   * Aplicar filtros
   * @private
   */
  _applyFilters(): void {
    this._state.currentFilters = this._getCurrentFilters();
  },

  /**
   * Limpiar filtros
   */
  clearFilters(): void {
    // Limpiar campos del formulario
    const campos = [
      'filtro-barrio-consulta',
      'filtro-territorio-consulta', 
      'filtro-capitan-consulta',
      'filtro-estado-consulta',
      'filtro-tipo-consulta'
    ];

    campos.forEach(campoId => {
      const elemento = document.getElementById(campoId) as HTMLSelectElement | HTMLInputElement;
      if (elemento) {
        elemento.value = '';
      }
    });

    // Restablecer fechas por defecto
    this._setupDefaultDates();

    // Limpiar estado
    this._state.currentFilters = {
      barrio: '',
      fechaInicio: '',
      fechaFin: '',
      estado: '',
      capitan: '',
      territorio: ''
    };
    this._clearResults();

    UI.showNotification('Filtros limpiados', 'info');
  },

  /**
   * Validar filtros
   * @private
   */
  _validateFilters(filters: ConsultaFilters): FilterValidation {
    // Validar fechas
    if (filters.fechaInicio && filters.fechaFin) {
      const inicio = new Date(filters.fechaInicio);
      const fin = new Date(filters.fechaFin);
      
      if (inicio > fin) {
        return {
          isValid: false,
          message: 'La fecha de inicio no puede ser posterior a la fecha de fin'
        };
      }
    }

    return { isValid: true };
  },

  // ==========================================
  // BÚSQUEDA Y CONSULTAS
  // ==========================================

  /**
   * Ejecutar búsqueda
   */
  async executeSearch(): Promise<void> {
    try {
      this._showLoadingState();
      
      // Obtener filtros actuales
      const filters = this._getCurrentFilters();
      
      // Validar filtros
      const validation = this._validateFilters(filters);
      if (!validation.isValid) {
        UI.showNotification(validation.message || 'Filtros inválidos', 'error');
        this._hideLoadingState();
        return;
      }
      
      // Actualizar estado
      this._state.currentFilters = filters;
      
      console.log('🔍 Ejecutando búsqueda con filtros:', filters);
      
      // Realizar búsquedas paralelas
      const [reportes, salidas] = await Promise.all([
        this._searchReportes(filters),
        this._searchSalidas(filters)
      ]);
      
      // Procesar resultados
      const resultados = this._processSearchResults(reportes, salidas, filters);
      
      // Mostrar resultados
      this._displayResults(resultados);
      this._updateSearchStats(resultados);
      
      console.log(`✅ Búsqueda completada: ${resultados.length} resultados encontrados`);
      
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      UI.showNotification('Error al realizar la búsqueda', 'error');
    } finally {
      this._hideLoadingState();
    }
  },

  /**
   * Buscar reportes
   * @private
   */
  async _searchReportes(filters: ConsultaFilters): Promise<ReporteAPI[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.barrio) params.append('barrio', filters.barrio);
      if (filters.territorio) params.append('territorio', filters.territorio);
      if (filters.fechaInicio) params.append('fecha_inicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fecha_fin', filters.fechaFin);
      if (filters.estado) params.append('estado', filters.estado);
      
      const response = await fetch(`${API_BASE}/reportes/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      return data.reportes || [];
      
    } catch (error) {
      console.error('❌ Error al buscar reportes:', error);
      return [];
    }
  },

  /**
   * Buscar salidas
   * @private
   */
  async _searchSalidas(filters: ConsultaFilters): Promise<SalidaCapitan[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.barrio) params.append('barrio', filters.barrio);
      if (filters.capitan) params.append('capitan_id', filters.capitan);
      
      const response = await fetch(`${API_BASE}/salidas/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      return data.salidas || [];
      
    } catch (error) {
      console.error('❌ Error al buscar salidas:', error);
      return [];
    }
  },

  /**
   * Procesar resultados de búsqueda
   * @private
   */
  _processSearchResults(reportes: ReporteAPI[], salidas: SalidaCapitan[], filters: ConsultaFilters): ConsultaResultado[] {
    const resultados: ConsultaResultado[] = [];
    
    // Procesar reportes
    reportes.forEach(reporte => {
      resultados.push({
        tipo: 'reporte',
        id: reporte.id,
        fecha: reporte.fecha,
        barrio: reporte.barrio,
        territorio: null, // Los reportes no tienen territorio específico
        persona: reporte.capitan,
        estado: reporte.estado || 'completado',
        data: reporte
      });
    });
    
    // Procesar salidas
    salidas.forEach(salida => {
      resultados.push({
        tipo: 'salida',
        id: salida.id,
        fecha: null, // Las salidas no tienen fecha específica
        barrio: salida.barrio_asignado,
        territorio: null,
        persona: salida.capitanes ? `${salida.capitanes.nombre} ${salida.capitanes.apellido}` : 'Sin asignar',
        estado: 'programado',
        data: salida
      });
    });
    
    // Ordenar por fecha (más recientes primero)
    resultados.sort((a, b) => {
      if (!a.fecha && !b.fecha) return 0;
      if (!a.fecha) return 1;
      if (!b.fecha) return -1;
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
    
    this._state.resultados = resultados;
    return resultados;
  },

  // ==========================================
  // VISUALIZACIÓN DE RESULTADOS
  // ==========================================

  /**
   * Mostrar resultados
   * @private
   */
  _displayResults(resultados: ConsultaResultado[]): void {
    const container = document.getElementById('resultados-consulta');
    if (!container) return;
    
    if (resultados.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">🔍</div>
          <h3>No se encontraron resultados</h3>
          <p>Intenta ajustar los filtros de búsqueda</p>
        </div>
      `;
      return;
    }
    
    const resultadosHTML = resultados.map(resultado => this._createResultCard(resultado)).join('');
    
    container.innerHTML = `
      <div class="resultados-header">
        <h3>Resultados de la búsqueda (${resultados.length})</h3>
        <div class="resultados-actions">
          <button class="btn btn--sm btn--ghost" onclick="MapasConsultaManager.toggleViewMode()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Vista
          </button>
        </div>
      </div>
      <div class="resultados-grid">
        ${resultadosHTML}
      </div>
    `;
  },

  /**
   * Crear tarjeta de resultado
   * @private
   */
  _createResultCard(resultado: ConsultaResultado): string {
    const tipoIcon = resultado.tipo === 'reporte' ? '📋' : '🚪';
    const tipoLabel = resultado.tipo === 'reporte' ? 'Reporte' : 'Salida';
    
    return `
      <div class="resultado-card" data-tipo="${resultado.tipo}" data-id="${resultado.id}">
        <div class="resultado-header">
          <div class="resultado-tipo">
            <span class="tipo-icon">${tipoIcon}</span>
            <span class="tipo-label">${tipoLabel}</span>
          </div>
          <span class="badge badge--${this._getEstadoBadgeClass(resultado.estado)}">
            ${UI.capitalize(resultado.estado)}
          </span>
        </div>
        
        <div class="resultado-body">
          <div class="resultado-info">
            <div class="info-item">
              <span class="info-label">Barrio:</span>
              <span class="info-value">${resultado.barrio}</span>
            </div>
            
            ${resultado.territorio ? `
              <div class="info-item">
                <span class="info-label">Territorio:</span>
                <span class="info-value">${resultado.territorio}</span>
              </div>
            ` : ''}
            
            <div class="info-item">
              <span class="info-label">${resultado.tipo === 'reporte' ? 'Reportado por' : 'Capitán'}:</span>
              <span class="info-value">${resultado.persona}</span>
            </div>
            
            ${resultado.fecha ? `
              <div class="info-item">
                <span class="info-label">Fecha:</span>
                <span class="info-value">${UI.formatDate(resultado.fecha)}</span>
              </div>
            ` : ''}
            
            ${resultado.tipo === 'salida' && (resultado.data as SalidaCapitan).dia_semana ? `
              <div class="info-item">
                <span class="info-label">Día:</span>
                <span class="info-value">${UI.capitalize((resultado.data as SalidaCapitan).dia_semana)}</span>
              </div>
            ` : ''}
            
            ${resultado.tipo === 'salida' && (resultado.data as SalidaCapitan).hora ? `
              <div class="info-item">
                <span class="info-label">Hora:</span>
                <span class="info-value">${UI.formatTime((resultado.data as SalidaCapitan).hora)}</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="resultado-actions">
          <button class="btn btn--sm btn--ghost" onclick="MapasConsultaManager.viewDetails('${resultado.tipo}', ${resultado.id})">
            Ver Detalles
          </button>
          ${resultado.tipo === 'reporte' && resultado.territorio ? `
            <button class="btn btn--sm btn--primary" onclick="MapasConsultaManager.showInMap('${resultado.barrio}', '${resultado.territorio}')">
              Ver en Mapa
            </button>
          ` : ''}
        </div>
      </div>
    `;
  },

  /**
   * Actualizar estadísticas de búsqueda
   * @private
   */
  _updateSearchStats(resultados: ConsultaResultado[]): void {
    const statsContainer = document.getElementById('search-stats');
    if (!statsContainer) return;
    
    const reportes = resultados.filter(r => r.tipo === 'reporte');
    const salidas = resultados.filter(r => r.tipo === 'salida');
    
    const stats: SearchStats = {
      total: resultados.length,
      reportes: reportes.length,
      salidas: salidas.length,
      barrios: Array.from(new Set(resultados.map(r => r.barrio))).length,
      territorios: Array.from(new Set(resultados.filter(r => r.territorio).map(r => r.territorio))).length
    };
    
    statsContainer.innerHTML = `
      <div class="search-stats">
        <div class="stat-item">
          <span class="stat-number">${stats.total}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${stats.reportes}</span>
          <span class="stat-label">Reportes</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${stats.salidas}</span>
          <span class="stat-label">Salidas</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${stats.barrios}</span>
          <span class="stat-label">Barrios</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${stats.territorios}</span>
          <span class="stat-label">Territorios</span>
        </div>
      </div>
    `;
  },

  // ==========================================
  // UTILIDADES
  // ==========================================

  /**
   * Poblar selector de barrios
   * @private
   */
  _populateBarriosSelector(): void {
    const selector = document.getElementById('filtro-barrio-consulta') as HTMLSelectElement;
    if (!selector) return;
    
    const barrios = [
      'Alcalá', 'Acacios', 'Ciudad Jardín', 'Guaimaral',
      'La Mar y Gratamira', 'Niza', 'Prados Norte', 'Próceres',
      'San Eduardo', 'Santa Elena', 'Tasajero', 'Zulima'
    ];
    
    selector.innerHTML = '<option value="">Todos los barrios</option>';
    barrios.forEach(barrio => {
      const option = document.createElement('option');
      option.value = barrio;
      option.textContent = barrio;
      selector.appendChild(option);
    });
  },

  /**
   * Poblar selector de capitanes
   * @private
   */
  _populateCapitanesSelector(): void {
    const selector = document.getElementById('filtro-capitan-consulta') as HTMLSelectElement;
    if (!selector) return;
    
    selector.innerHTML = '<option value="">Todos los capitanes</option>';
    this._state.capitanes.forEach(capitan => {
      const option = document.createElement('option');
      option.value = capitan.id.toString();
      option.textContent = `${capitan.nombre} ${capitan.apellido}`;
      selector.appendChild(option);
    });
  },

  /**
   * Obtener clase CSS para badge de estado
   * @private
   */
  _getEstadoBadgeClass(estado: string): string {
    const classes: Record<string, string> = {
      completado: 'success',
      programado: 'info',
      pendiente: 'warning',
      cancelado: 'error'
    };
    return classes[estado] || 'info';
  },

  /**
   * Mostrar estado de carga
   * @private
   */
  _showLoadingState(): void {
    const searchBtn = document.getElementById('btn-buscar') as HTMLButtonElement;
    if (searchBtn) {
      searchBtn.disabled = true;
      searchBtn.textContent = 'Buscando...';
    }
  },

  /**
   * Ocultar estado de carga
   * @private
   */
  _hideLoadingState(): void {
    const searchBtn = document.getElementById('btn-buscar') as HTMLButtonElement;
    if (searchBtn) {
      searchBtn.disabled = false;
      searchBtn.textContent = 'Buscar';
    }
  },

  /**
   * Limpiar resultados
   * @private
   */
  _clearResults(): void {
    const container = document.getElementById('resultados-consulta');
    if (container) {
      container.innerHTML = '';
    }
    
    const statsContainer = document.getElementById('search-stats');
    if (statsContainer) {
      statsContainer.innerHTML = '';
    }
    
    this._state.resultados = [];
  },

  // ==========================================
  // MÉTODOS PÚBLICOS
  // ==========================================

  /**
   * Ver detalles de un resultado
   */
  viewDetails(tipo: 'reporte' | 'salida', id: number): void {
    const resultado = this._state.resultados.find(r => r.tipo === tipo && r.id === id);
    if (!resultado) {
      UI.showNotification('Resultado no encontrado', 'error');
      return;
    }
    
    const data = resultado.data;
    let content = '';
    
    if (tipo === 'reporte') {
      const reporteData = data as ReporteAPI;
      content = `
        <div class="details-content">
          <h4>Detalles del Reporte</h4>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Fecha:</span>
              <span class="detail-value">${UI.formatDate(reporteData.fecha, 'long')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Reportado por:</span>
              <span class="detail-value">${reporteData.capitan}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Barrio:</span>
              <span class="detail-value">${reporteData.barrio}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Territorio:</span>
              <span class="detail-value">${reporteData.barrio || 'No especificado'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Estado:</span>
              <span class="detail-value">
                <span class="badge badge--${this._getEstadoBadgeClass(reporteData.estado || 'completado')}">
                  ${reporteData.estado || 'Completado'}
                </span>
              </span>
            </div>
            ${reporteData.observaciones ? `
              <div class="detail-item full-width">
                <span class="detail-label">Observaciones:</span>
                <span class="detail-value">${reporteData.observaciones}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    } else {
      const salidaData = data as SalidaCapitan;
      content = `
        <div class="details-content">
          <h4>Detalles de la Salida</h4>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Capitán:</span>
              <span class="detail-value">${salidaData.capitanes ? `${salidaData.capitanes.nombre} ${salidaData.capitanes.apellido}` : 'Sin asignar'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Barrio:</span>
              <span class="detail-value">${salidaData.barrio_asignado}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Día:</span>
              <span class="detail-value">${UI.capitalize(salidaData.dia_semana)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Hora:</span>
              <span class="detail-value">${UI.formatTime(salidaData.hora)}</span>
            </div>
            ${salidaData.capitanes && salidaData.capitanes.telefono ? `
              <div class="detail-item">
                <span class="detail-label">Teléfono:</span>
                <span class="detail-value">${salidaData.capitanes.telefono}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }
    
    UI.createModal(`Detalles - ${UI.capitalize(tipo)}`, content, {
      size: 'medium'
    });
  },

  /**
   * Mostrar en mapa
   */
  async showInMap(barrio: string, territorio: string): Promise<void> {
    try {
      // Redirigir a página de mapas con parámetros
      const params = new URLSearchParams({
        barrio: barrio,
        territorio: territorio
      });
      
      window.location.href = `mapa.html?${params.toString()}`;
      
    } catch (error) {
      console.error('❌ Error al mostrar en mapa:', error);
      UI.showNotification('Error al abrir mapa', 'error');
    }
  },

  /**
   * Exportar resultados
   */
  async exportResults(): Promise<void> {
    try {
      if (this._state.resultados.length === 0) {
        UI.showNotification('No hay resultados para exportar', 'warning');
        return;
      }
      
      UI.showNotification('Preparando exportación...', 'info', 1000);
      
      // Preparar datos para exportación
      const exportData: ExportData[] = this._state.resultados.map(resultado => {
        const base: ExportData = {
          Tipo: UI.capitalize(resultado.tipo),
          Barrio: resultado.barrio,
          Territorio: resultado.territorio || 'N/A',
          Persona: resultado.persona,
          Estado: UI.capitalize(resultado.estado)
        };
        
        if (resultado.fecha) {
          base.Fecha = UI.formatDate(resultado.fecha);
        }
        
        if (resultado.tipo === 'salida') {
          const salidaData = resultado.data as SalidaCapitan;
          base.Día = UI.capitalize(salidaData.dia_semana);
          base.Hora = UI.formatTime(salidaData.hora);
        }
        
        return base;
      });
      
      // Crear y descargar archivo CSV
      this._downloadCSV(exportData, 'consulta_territorios');
      
      UI.showNotification('Resultados exportados correctamente', 'success');
      
    } catch (error) {
      console.error('❌ Error al exportar:', error);
      UI.showNotification('Error al exportar resultados', 'error');
    }
  },

  /**
   * Descargar CSV
   * @private
   */
  _downloadCSV(data: ExportData[], filename: string): void {
    if (data.length === 0) return;
    
    // Crear encabezados
    const headers = Object.keys(data[0]);
    
    // Crear contenido CSV
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          `"${(row[header as keyof ExportData] || '').toString().replace(/"/g, '""')}"`
        ).join(',')
      )
    ].join('\n');
    
    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Alternar modo de vista
   */
  toggleViewMode(): void {
    const container = document.querySelector('.resultados-grid');
    if (container) {
      container.classList.toggle('view-list');
      container.classList.toggle('view-grid');
    }
  }
};

// Hacer MapasConsultaManager disponible globalmente
declare global {
  interface Window {
    MapasConsultaManager: typeof MapasConsultaManager;
  }
}

if (typeof window !== 'undefined') {
  window.MapasConsultaManager = MapasConsultaManager;
}

// Exportar por defecto
export default MapasConsultaManager;