// frontend/js/mapas_consulta.js
// Módulo de Mapas-Consulta - Consultas y filtros avanzados para mapas

import { UI } from './ui.js';
import { MapasManager } from './mapas.js';

// Configuración de API
const API_BASE = '/api';

/**
 * Módulo de Mapas-Consulta - Gestión de consultas y filtros avanzados
 * Maneja búsquedas, filtros y análisis de datos territoriales
 */
export const MapasConsultaManager = {
  
  // Estado interno del módulo
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
  },
  
  // ==========================================
  // INICIALIZACIÓN
  // ==========================================
  
  /**
   * Inicializar el módulo de consultas
   */
  async init() {
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
      UI.showNotification('Error al cargar el módulo de consultas', 'error');
    }
  },
  
  /**
   * Configurar event listeners
   * @private
   */
  _setupEventListeners() {
    // Formulario de filtros
    const filterForm = document.getElementById('filtros-consulta');
    if (filterForm) {
      filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.executeSearch();
      });
    }
    
    // Botón de búsqueda
    const searchBtn = document.getElementById('btn-buscar');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.executeSearch();
      });
    }
    
    // Botón de limpiar filtros
    const clearBtn = document.getElementById('btn-limpiar-filtros');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearFilters();
      });
    }
    
    // Botón de exportar
    const exportBtn = document.getElementById('btn-exportar-resultados');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportResults();
      });
    }
    
    // Filtros con actualización automática
    const autoUpdateFilters = ['filtro-barrio-consulta', 'filtro-estado-consulta'];
    autoUpdateFilters.forEach(filterId => {
      const filter = document.getElementById(filterId);
      if (filter) {
        filter.addEventListener('change', UI.debounce(() => {
          this.executeSearch();
        }, 500));
      }
    });
    
    // Búsqueda de territorio con debounce
    const territorioSearch = document.getElementById('territorio-search');
    if (territorioSearch) {
      territorioSearch.addEventListener('input', UI.debounce(() => {
        this.executeSearch();
      }, 800));
    }
  },
  
  /**
   * Cargar datos iniciales
   * @private
   */
  async _loadInitialData() {
    try {
      // Cargar en paralelo para mejor performance
      const [capitanes] = await Promise.all([
        this._loadCapitanes()
      ]);
      
      // Poblar selectores
      this._populateCapitanesSelector();
      
    } catch (error) {
      console.error('❌ Error al cargar datos iniciales:', error);
    }
  },
  
  /**
   * Cargar capitanes
   * @private
   */
  async _loadCapitanes() {
    try {
      const response = await fetch(`${API_BASE}/capitanes`);
      const result = await response.json();
      
      if (result.success) {
        this._state.capitanes = result.data || [];
      }
      
      return this._state.capitanes;
      
    } catch (error) {
      console.error('❌ Error al cargar capitanes:', error);
      return [];
    }
  },
  
  /**
   * Configurar filtros
   * @private
   */
  _setupFilters() {
    // Poblar selector de barrios
    this._populateBarriosSelector();
  },
  
  /**
   * Configurar fechas por defecto
   * @private
   */
  _setupDefaultDates() {
    const fechaInicio = document.getElementById('fecha-inicio-consulta');
    const fechaFin = document.getElementById('fecha-fin-consulta');
    
    if (fechaInicio && fechaFin) {
      // Establecer rango del último mes
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      
      fechaInicio.value = lastMonth.toISOString().slice(0, 10);
      fechaFin.value = endOfLastMonth.toISOString().slice(0, 10);
    }
  },
  
  // ==========================================
  // GESTIÓN DE FILTROS
  // ==========================================
  
  /**
   * Obtener filtros actuales
   * @private
   */
  _getCurrentFilters() {
    return {
      barrio: document.getElementById('filtro-barrio-consulta')?.value || '',
      fechaInicio: document.getElementById('fecha-inicio-consulta')?.value || '',
      fechaFin: document.getElementById('fecha-fin-consulta')?.value || '',
      estado: document.getElementById('filtro-estado-consulta')?.value || '',
      capitan: document.getElementById('filtro-capitan-consulta')?.value || '',
      territorio: document.getElementById('territorio-search')?.value || ''
    };
  },
  
  /**
   * Aplicar filtros
   * @private
   */
  _applyFilters(filters) {
    this._state.currentFilters = { ...filters };
    
    // Actualizar elementos del DOM
    Object.keys(filters).forEach(key => {
      const element = document.getElementById(`filtro-${key}-consulta`) || 
                     document.getElementById(`${key}-search`) ||
                     document.getElementById(`fecha-${key.replace('fecha', '').toLowerCase()}-consulta`);
      
      if (element && filters[key]) {
        element.value = filters[key];
      }
    });
  },
  
  /**
   * Limpiar filtros
   */
  clearFilters() {
    // Limpiar formulario
    const filterForm = document.getElementById('filtros-consulta');
    if (filterForm) {
      filterForm.reset();
    }
    
    // Resetear estado
    this._state.currentFilters = {
      barrio: '',
      fechaInicio: '',
      fechaFin: '',
      estado: '',
      capitan: '',
      territorio: ''
    };
    
    // Limpiar resultados
    this._clearResults();
    
    // Configurar fechas por defecto nuevamente
    this._setupDefaultDates();
    
    UI.showNotification('Filtros limpiados', 'info');
  },
  
  // ==========================================
  // BÚSQUEDA Y CONSULTAS
  // ==========================================
  
  /**
   * Ejecutar búsqueda
   */
  async executeSearch() {
    try {
      this._state.isLoading = true;
      this._showLoadingState();
      
      // Obtener filtros actuales
      const filters = this._getCurrentFilters();
      
      // Validar filtros
      const validation = this._validateFilters(filters);
      if (!validation.isValid) {
        UI.showNotification(validation.message, 'warning');
        return;
      }
      
      UI.showNotification('Ejecutando búsqueda...', 'info', 1000);
      
      // Ejecutar consultas en paralelo
      const [reportes, salidas] = await Promise.all([
        this._searchReportes(filters),
        this._searchSalidas(filters)
      ]);
      
      // Procesar resultados
      const resultados = this._processSearchResults(reportes, salidas, filters);
      
      // Mostrar resultados
      this._displayResults(resultados);
      
      // Actualizar estadísticas
      this._updateSearchStats(resultados);
      
      UI.showNotification(`Búsqueda completada: ${resultados.length} resultados`, 'success');
      
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      UI.showNotification('Error al ejecutar búsqueda', 'error');
    } finally {
      this._state.isLoading = false;
      this._hideLoadingState();
    }
  },
  
  /**
   * Validar filtros
   * @private
   */
  _validateFilters(filters) {
    // Validar rango de fechas
    if (filters.fechaInicio && filters.fechaFin) {
      const inicio = new Date(filters.fechaInicio);
      const fin = new Date(filters.fechaFin);
      
      if (inicio > fin) {
        return {
          isValid: false,
          message: 'La fecha de inicio debe ser anterior a la fecha de fin'
        };
      }
      
      // Validar que el rango no sea demasiado amplio (más de 2 años)
      const diffYears = (fin - inicio) / (1000 * 60 * 60 * 24 * 365);
      if (diffYears > 2) {
        return {
          isValid: false,
          message: 'El rango de fechas no puede ser mayor a 2 años'
        };
      }
    }
    
    return { isValid: true };
  },
  
  /**
   * Buscar reportes
   * @private
   */
  async _searchReportes(filters) {
    try {
      const params = new URLSearchParams();
      
      if (filters.barrio) params.append('barrio', filters.barrio);
      if (filters.fechaInicio) params.append('fecha_inicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fecha_fin', filters.fechaFin);
      if (filters.estado) params.append('estado', filters.estado);
      
      const response = await fetch(`${API_BASE}/reportes?${params}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al buscar reportes');
      }
      
      let reportes = result.data || [];
      
      // Filtrar por territorio si se especifica
      if (filters.territorio) {
        reportes = reportes.filter(reporte => {
          return reporte.territorio && 
                 reporte.territorio.toString().toLowerCase().includes(filters.territorio.toLowerCase());
        });
      }
      
      return reportes;
      
    } catch (error) {
      console.error('❌ Error al buscar reportes:', error);
      return [];
    }
  },
  
  /**
   * Buscar salidas
   * @private
   */
  async _searchSalidas(filters) {
    try {
      const params = new URLSearchParams();
      
      if (filters.barrio) params.append('barrio_asignado', filters.barrio);
      if (filters.capitan) params.append('capitan_id', filters.capitan);
      
      const response = await fetch(`${API_BASE}/salidas?${params}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al buscar salidas');
      }
      
      return result.data || [];
      
    } catch (error) {
      console.error('❌ Error al buscar salidas:', error);
      return [];
    }
  },
  
  /**
   * Procesar resultados de búsqueda
   * @private
   */
  _processSearchResults(reportes, salidas, filters) {
    const resultados = [];
    
    // Procesar reportes
    reportes.forEach(reporte => {
      resultados.push({
        tipo: 'reporte',
        id: reporte.id,
        fecha: reporte.fecha,
        barrio: reporte.barrio,
        territorio: reporte.territorio,
        persona: `${reporte.nombre} ${reporte.apellido}`,
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
      return new Date(b.fecha) - new Date(a.fecha);
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
  _displayResults(resultados) {
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
  _createResultCard(resultado) {
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
            
            ${resultado.tipo === 'salida' && resultado.data.dia_semana ? `
              <div class="info-item">
                <span class="info-label">Día:</span>
                <span class="info-value">${UI.capitalize(resultado.data.dia_semana)}</span>
              </div>
            ` : ''}
            
            ${resultado.tipo === 'salida' && resultado.data.hora ? `
              <div class="info-item">
                <span class="info-label">Hora:</span>
                <span class="info-value">${UI.formatTime(resultado.data.hora)}</span>
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
  _updateSearchStats(resultados) {
    const statsContainer = document.getElementById('search-stats');
    if (!statsContainer) return;
    
    const reportes = resultados.filter(r => r.tipo === 'reporte');
    const salidas = resultados.filter(r => r.tipo === 'salida');
    
    const stats = {
      total: resultados.length,
      reportes: reportes.length,
      salidas: salidas.length,
      barrios: [...new Set(resultados.map(r => r.barrio))].length,
      territorios: [...new Set(resultados.filter(r => r.territorio).map(r => r.territorio))].length
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
  _populateBarriosSelector() {
    const selector = document.getElementById('filtro-barrio-consulta');
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
  _populateCapitanesSelector() {
    const selector = document.getElementById('filtro-capitan-consulta');
    if (!selector) return;
    
    selector.innerHTML = '<option value="">Todos los capitanes</option>';
    this._state.capitanes.forEach(capitan => {
      const option = document.createElement('option');
      option.value = capitan.id;
      option.textContent = `${capitan.nombre} ${capitan.apellido}`;
      selector.appendChild(option);
    });
  },
  
  /**
   * Obtener clase CSS para badge de estado
   * @private
   */
  _getEstadoBadgeClass(estado) {
    const classes = {
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
  _showLoadingState() {
    const searchBtn = document.getElementById('btn-buscar');
    if (searchBtn) {
      searchBtn.disabled = true;
      searchBtn.textContent = 'Buscando...';
    }
  },
  
  /**
   * Ocultar estado de carga
   * @private
   */
  _hideLoadingState() {
    const searchBtn = document.getElementById('btn-buscar');
    if (searchBtn) {
      searchBtn.disabled = false;
      searchBtn.textContent = 'Buscar';
    }
  },
  
  /**
   * Limpiar resultados
   * @private
   */
  _clearResults() {
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
  viewDetails(tipo, id) {
    const resultado = this._state.resultados.find(r => r.tipo === tipo && r.id === id);
    if (!resultado) {
      UI.showNotification('Resultado no encontrado', 'error');
      return;
    }
    
    const data = resultado.data;
    let content = '';
    
    if (tipo === 'reporte') {
      content = `
        <div class="details-content">
          <h4>Detalles del Reporte</h4>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Fecha:</span>
              <span class="detail-value">${UI.formatDate(data.fecha, 'long')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Reportado por:</span>
              <span class="detail-value">${data.nombre} ${data.apellido}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Barrio:</span>
              <span class="detail-value">${data.barrio}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Territorio:</span>
              <span class="detail-value">${data.territorio || 'No especificado'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Estado:</span>
              <span class="detail-value">
                <span class="badge badge--${this._getEstadoBadgeClass(data.estado)}">
                  ${data.estado || 'Completado'}
                </span>
              </span>
            </div>
            ${data.observaciones ? `
              <div class="detail-item full-width">
                <span class="detail-label">Observaciones:</span>
                <span class="detail-value">${data.observaciones}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    } else {
      content = `
        <div class="details-content">
          <h4>Detalles de la Salida</h4>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Capitán:</span>
              <span class="detail-value">${data.capitanes ? `${data.capitanes.nombre} ${data.capitanes.apellido}` : 'Sin asignar'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Barrio:</span>
              <span class="detail-value">${data.barrio_asignado}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Día:</span>
              <span class="detail-value">${UI.capitalize(data.dia_semana)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Hora:</span>
              <span class="detail-value">${UI.formatTime(data.hora)}</span>
            </div>
            ${data.capitanes && data.capitanes.telefono ? `
              <div class="detail-item">
                <span class="detail-label">Teléfono:</span>
                <span class="detail-value">${data.capitanes.telefono}</span>
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
  async showInMap(barrio, territorio) {
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
  async exportResults() {
    try {
      if (this._state.resultados.length === 0) {
        UI.showNotification('No hay resultados para exportar', 'warning');
        return;
      }
      
      UI.showNotification('Preparando exportación...', 'info', 1000);
      
      // Preparar datos para exportación
      const exportData = this._state.resultados.map(resultado => {
        const base = {
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
          base.Día = UI.capitalize(resultado.data.dia_semana);
          base.Hora = UI.formatTime(resultado.data.hora);
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
  _downloadCSV(data, filename) {
    if (data.length === 0) return;
    
    // Crear encabezados
    const headers = Object.keys(data[0]);
    
    // Crear contenido CSV
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          `"${(row[header] || '').toString().replace(/"/g, '""')}"`
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
  toggleViewMode() {
    const container = document.querySelector('.resultados-grid');
    if (container) {
      container.classList.toggle('view-list');
      container.classList.toggle('view-grid');
    }
  }
};

// Hacer MapasConsultaManager disponible globalmente
if (typeof window !== 'undefined') {
  window.MapasConsultaManager = MapasConsultaManager;
}

// Exportar por defecto
export default MapasConsultaManager;