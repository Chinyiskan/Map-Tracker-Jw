// frontend/js/admin.js
// Módulo Admin centralizado - Gestión completa del panel administrativo

import { UI } from './ui.js';
import { CompactCard, CompactCardPresets } from './components/compact-card.js';
import { BarriosProgressChart } from './barrios-progress-chart.js';

// Variables para las funciones de dashboard
let mostrarDesequilibrio = null;
let actualizarGraficaBarrios = null;
let actualizarProgresoMes = null;
let poblarFiltros = null;
let actualizarTablaDescarga = null;
let obtenerReportes = null;
let setupDashboardEventListeners = null;

// Función para cargar dashboard.js dinámicamente
async function loadDashboardModule() {
  try {
    const dashboardModule = await import('./dashboard.js');
    mostrarDesequilibrio = dashboardModule.mostrarDesequilibrio;
    actualizarGraficaBarrios = dashboardModule.actualizarGraficaBarrios;
    actualizarProgresoMes = dashboardModule.actualizarProgresoMes;
    poblarFiltros = dashboardModule.poblarFiltros;
    actualizarTablaDescarga = dashboardModule.actualizarTablaDescarga;
    obtenerReportes = dashboardModule.obtenerReportes;
    setupDashboardEventListeners = dashboardModule.setupDashboardEventListeners;
    return true;
  } catch (error) {
    console.warn('⚠️ No se pudo cargar dashboard.js:', error);
    return false;
  }
}

// Configuración de API
const API_BASE = '/api';

/**
 * Módulo Admin - Gestión centralizada del panel administrativo
 * Maneja dashboard, reportes, salidas, capitanes y estadísticas
 */
export const AdminManager = {
  
  // Estado interno del módulo
  _state: {
    reportes: [],
    salidas: [],
    capitanes: [],
    filtros: {
      barrio: '',
      periodo: 'mes',
      estado: ''
    },
    charts: {
      barrios: null,
      mes: null
    },
    barriosProgressChart: null, // Componente de progreso de barrios
    pagination: {
      currentPage: 1,
      itemsPerPage: 15,
      totalItems: 0
    }
  },
  
  // ==========================================
  // INICIALIZACIÓN
  // ==========================================
  
  /**
   * Inicializar el módulo admin
   */
  async init() {
    try {
      console.log('🚀 Inicializando AdminManager...');
      
      // Verificar autenticación
      if (!this._checkAuth()) {
        window.location.href = 'login.html';
        return;
      }
      
      // Inicializar componentes
      await this._initializeComponents();
      
      // Cargar datos iniciales
      await this._loadInitialData();
      
      // Configurar event listeners
      this._setupEventListeners();
      
      console.log('✅ AdminManager inicializado correctamente');
      UI.showNotification('Panel administrativo cargado', 'success');
      
    } catch (error) {
      console.error('❌ Error al inicializar AdminManager:', error);
      UI.showNotification('Error al cargar el panel administrativo', 'error');
    }
  },
  
  /**
   * Verificar autenticación
   * @private
   */
  _checkAuth() {
    return sessionStorage.getItem('admin_logged') === '1';
  },
  
  /**
   * Inicializar componentes del admin
   * @private
   */
  async _initializeComponents() {
    // Inicializar pestañas
    this._initTabs();
    
    // Inicializar tooltips
    this._initTooltips();
    
    // Configurar logout
    this._setupLogout();
    
    // Cargar módulo de dashboard
    await loadDashboardModule();
    
    // Inicializar componente de progreso de barrios con lazy loading
    await this._initBarriosProgressChart();
    
    // Inicializar selector de tiempo moderno
    this.initTimeSelector();
  },
  
  /**
   * Cargar datos iniciales
   * @private
   */
  async _loadInitialData() {
    console.log('🚀 AdminManager: Iniciando carga de datos...');
    
    // Cargar en paralelo para mejor performance
    const [reportes, salidas, capitanes] = await Promise.all([
      this.loadReportes(),
      this.loadSalidas(),
      this.loadCapitanes()
    ]);
    
    console.log('📊 AdminManager: Datos cargados - Reportes:', reportes.length, 'Salidas:', salidas.length, 'Capitanes:', capitanes.length);
    
    // Renderizar salidas inmediatamente después de cargarlas
    console.log('🎨 AdminManager: Renderizando salidas después de cargar datos...');
    this._renderSalidas();
    
    // Poblar filtros usando función de dashboard.js si está disponible
    if (poblarFiltros) {
      await poblarFiltros();
    } else {
      console.warn('⚠️ Función poblarFiltros no disponible');
    }
    
    // Actualizar dashboard
    await this.updateDashboard();
    
    // Inicializar tabla de descarga con datos
    if (actualizarTablaDescarga) {
      await actualizarTablaDescarga();
    }
  },
  
  /**
   * Configurar event listeners
   * @private
   */
  _setupEventListeners() {
    // Formularios
    const formCapitan = document.getElementById('form-capitan');
    if (formCapitan) {
      formCapitan.addEventListener('submit', (e) => this.handleSalidaSubmit(e));
    }
    
    // Búsqueda de capitanes
    const searchCapitanes = document.getElementById('search-capitanes');
    if (searchCapitanes) {
      searchCapitanes.addEventListener('input', UI.debounce(() => {
        this.filterCapitanes(searchCapitanes.value);
      }, 300));
    }
    
    // Configurar event listeners de dashboard (filtros de tabla)
    if (setupDashboardEventListeners) {
      setupDashboardEventListeners();
    }
  },
  
  // ==========================================
  // GESTIÓN DE DATOS
  // ==========================================
  
  /**
   * Cargar reportes desde la API
   */
  async loadReportes(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Aplicar filtros
      if (filters.barrio) params.append('barrio', filters.barrio);
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
      if (filters.estado) params.append('estado', filters.estado);
      
      const response = await fetch(`${API_BASE}/reportes?${params}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al cargar reportes');
      }
      
      this._state.reportes = result.data || [];
      return this._state.reportes;
      
    } catch (error) {
      console.error('❌ Error al cargar reportes:', error);
      UI.showNotification('Error al cargar reportes', 'error');
      return [];
    }
  },
  
  /**
   * Cargar salidas desde la API
   */
  async loadSalidas(filters = {}) {
    try {
      console.log('🔍 AdminManager: Cargando salidas con filtros:', filters);
      
      const params = new URLSearchParams();
      
      if (filters.capitan_id) params.append('capitan_id', filters.capitan_id);
      if (filters.barrio_asignado) params.append('barrio_asignado', filters.barrio_asignado);
      if (filters.dia_semana) params.append('dia_semana', filters.dia_semana);
      
      const url = `${API_BASE}/salidas?${params}`;
      // OPTIMIZADO: Log simplificado de API call
      
      const response = await fetch(url);
      
      const result = await response.json();
      // OPTIMIZADO: Removido log de response data para evitar spam
      
      if (!result.success) {
        throw new Error(result.error || 'Error al cargar salidas');
      }
      
      this._state.salidas = result.data || [];
      console.log(`✅ AdminManager: ${this._state.salidas.length} salidas cargadas`);
      
      return this._state.salidas;
      
    } catch (error) {
      console.error('❌ Error al cargar salidas:', error);
      UI.showNotification('Error al cargar salidas', 'error');
      this._state.salidas = [];
      return [];
    }
  },
  
  /**
   * Cargar capitanes desde la API
   */
  async loadCapitanes() {
    try {
      const response = await fetch(`${API_BASE}/capitanes`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al cargar capitanes');
      }
      
      this._state.capitanes = result.data || [];
      return this._state.capitanes;
      
    } catch (error) {
      console.error('❌ Error al cargar capitanes:', error);
      UI.showNotification('Error al cargar capitanes', 'error');
      return [];
    }
  },
  
  // ==========================================
  // DASHBOARD Y ESTADÍSTICAS
  // ==========================================
  
  /**
   * Actualizar dashboard completo
   */
  async updateDashboard() {
    try {
      // CORREGIDO: Usar función de dashboard.js para obtener reportes con filtros de fecha
      let reportes;
      if (obtenerReportes) {
        // Usar función de dashboard.js que respeta el selector de período
        reportes = await obtenerReportes({ barrio: '', periodo: 'mes', estado: '' });
      } else {
        // Fallback a método local sin filtros
        const filters = this._getCurrentFilters();
        reportes = await this.loadReportes(filters);
      }
      
      // Actualizar componentes del dashboard
      await Promise.all([
        this._updateCharts(reportes),
        this._updateStats(reportes),
        this._updateTables(reportes)
      ]);
      
      // Actualizar desequilibrio territorial si la función está disponible
      if (mostrarDesequilibrio) {
        await mostrarDesequilibrio(reportes);
      } else {
        console.warn('⚠️ Función mostrarDesequilibrio no disponible');
      }
      
      // Renderizar salidas programadas
      this._renderSalidas();
      
      // No mostrar notificación aquí para evitar duplicados
      
    } catch (error) {
      console.error('❌ Error al actualizar dashboard:', error);
      throw error; // Re-lanzar el error para que lo maneje init()
    }
  },
  
  /**
   * Obtener filtros actuales
   * @private
   */
  _getCurrentFilters() {
    // CORREGIDO: Sin filtros restrictivos por defecto para mostrar todos los reportes
    const barrio = '';
    const estado = '';
    
    return {
      barrio: barrio || undefined,
      estado: estado || undefined
      // ELIMINADO: filtros de fecha que excluían reportes existentes
      // fecha_inicio: dateRange.start,
      // fecha_fin: dateRange.end
    };
  },
  
  /**
   * Obtener rango de fechas según período
   * @private
   */
  _getDateRange(periodo) {
    const now = new Date();
    let start, end = new Date(now);
    
    switch (periodo) {
      case 'semana':
        const day = now.getDay() || 7;
        start = new Date(now);
        start.setDate(now.getDate() - day + 1);
        break;
      case 'mes':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'año':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(2000, 0, 1);
    }
    
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10)
    };
  },
  
  /**
   * Actualizar gráficos
   * @private
   */
  async _updateCharts(reportes) {
    // CORREGIDO: Filtrar reportes por mes actual para gráficas
    const now = new Date();
    const mesActual = now.toISOString().slice(0, 7); // YYYY-MM
    const reportesDelMes = reportes.filter(r => r.fecha.startsWith(mesActual));
    
    // Usar funciones de dashboard.js con reportes del mes actual
    if (actualizarGraficaBarrios) {
      await actualizarGraficaBarrios(reportesDelMes);
    } else {
      // Fallback: El gráfico de barrios se actualiza automáticamente via BarriosProgressChart
      console.warn('⚠️ Función actualizarGraficaBarrios no disponible');
    }
    
    if (actualizarProgresoMes) {
      actualizarProgresoMes(reportesDelMes);
    } else {
      // Fallback a implementación local
      this._updateMensualChart(reportesDelMes);
    }
  },
  
  /**
   * Actualizar estadísticas
   * @private
   */
  async _updateStats(reportes) {
    const stats = this._calculateStats(reportes);
    
    // Actualizar elementos del DOM
    this._updateStatsElements(stats);
  },
  
  /**
   * Calcular estadísticas
   * @private
   */
  _calculateStats(reportes) {
    const total = reportes.length;
    const porBarrio = {};
    const porMes = {};
    
    reportes.forEach(reporte => {
      // Estadísticas por barrio
      const barrio = reporte.barrio;
      porBarrio[barrio] = (porBarrio[barrio] || 0) + 1;
      
      // Estadísticas por mes
      if (reporte.fecha) {
        const mes = reporte.fecha.substring(0, 7); // YYYY-MM
        porMes[mes] = (porMes[mes] || 0) + 1;
      }
    });
    
    return {
      total,
      porBarrio,
      porMes,
      barrioMasActivo: Object.keys(porBarrio).reduce((a, b) => 
        porBarrio[a] > porBarrio[b] ? a : b, ''),
      ultimoReporte: reportes[0] || null
    };
  },
  
  // ==========================================
  // GESTIÓN DE SALIDAS
  // ==========================================
  
  /**
   * Manejar envío de formulario de salida
   */
  async handleSalidaSubmit(event) {
    event.preventDefault();
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    try {
      const formData = new FormData(event.target);
      const salidaData = Object.fromEntries(formData.entries());
      
      // Combinar hora y minutos en formato HH:MM para el backend
      if (salidaData.hora && salidaData.minutos) {
        salidaData.hora = `${salidaData.hora.padStart(2, '0')}:${salidaData.minutos.padStart(2, '0')}`;
        // Eliminar el campo minutos ya que no lo necesita el backend
        delete salidaData.minutos;
      }
      
      // Eliminar el campo 'time' del input nativo ya que no lo usa el backend
      delete salidaData.time;
      
      // Validar datos
      const validation = this._validateSalidaData(salidaData);
      if (!validation.isValid) {
        UI.showFormErrors(event.target, validation.errors);
        return;
      }
      
      // Determinar si es creación o actualización
      const isEdit = salidaData.id && salidaData.id !== '';
      
      // Activar loader en el botón
      UI.setButtonLoading(submitBtn, true, isEdit ? 'Guardando...' : 'Programando...');

      let response;
      if (isEdit) {
        response = await fetch(`${API_BASE}/salidas/${salidaData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(salidaData)
        });
      } else {
        response = await fetch(`${API_BASE}/salidas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(salidaData)
        });
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al guardar salida');
      }
      
      UI.showNotification(
        isEdit ? 'Salida actualizada correctamente' : 'Salida creada correctamente',
        'success'
      );
      
      // Limpiar formulario y recargar datos
      event.target.reset();
      await this.loadSalidas();
      this._renderSalidas();
      
    } catch (error) {
      console.error('❌ Error al guardar salida:', error);
      UI.showNotification('Error al guardar salida', 'error');
    } finally {
      // Desactivar loader en el botón
      UI.setButtonLoading(submitBtn, false);
    }
  },
  
  /**
   * Validar datos de salida
   * @private
   */
  _validateSalidaData(data) {
    const rules = {
      capitan_id: ['required'],
      barrio_asignado: ['required'],
      dia_semana: ['required'],
      hora: ['required']
    };
    
    return UI.validateForm({ elements: data }, rules);
  },
  
  /**
   * Eliminar salida
   */
  async deleteSalida(id) {
    try {
      const confirmed = await this._showConfirmDialog(
        'Confirmar eliminación',
        '¿Estás seguro de que quieres eliminar esta salida?'
      );
      
      if (!confirmed) return;
      
      const response = await fetch(`${API_BASE}/salidas/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al eliminar salida');
      }
      
      UI.showNotification('Salida eliminada correctamente', 'success');
      
      // Recargar datos
      await this.loadSalidas();
      this._renderSalidas();
      
    } catch (error) {
      console.error('❌ Error al eliminar salida:', error);
      UI.showNotification('Error al eliminar salida', 'error');
    }
  },
  
  // ==========================================
  // GESTIÓN DE CAPITANES
  // ==========================================
  
  /**
   * Filtrar capitanes
   */
  filterCapitanes(searchTerm) {
    const filteredCapitanes = this._state.capitanes.filter(capitan => {
      const fullName = `${capitan.nombre} ${capitan.apellido}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
    
    this._renderCapitanes(filteredCapitanes);
  },
  
  /**
   * Crear nuevo capitán
   */
  async createCapitan(capitanData) {
    try {
      const response = await fetch(`${API_BASE}/capitanes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(capitanData)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al crear capitán');
      }
      
      UI.showNotification('Capitán creado correctamente', 'success');
      
      // Recargar datos
      await this.loadCapitanes();
      this._renderCapitanes();
      
      return result.data;
      
    } catch (error) {
      console.error('❌ Error al crear capitán:', error);
      UI.showNotification('Error al crear capitán', 'error');
      throw error;
    }
  },
  
  // ==========================================
  // UTILIDADES PRIVADAS
  // ==========================================
  
  /**
   * Mostrar diálogo de confirmación
   * @private
   */
  _showConfirmDialog(title, message) {
    return new Promise((resolve) => {
      UI.createModal(title, `<p>${message}</p>`, {
        onConfirm: () => resolve(true),
        onClose: () => resolve(false),
        confirmText: 'Confirmar',
        cancelText: 'Cancelar'
      });
    });
  },
  
  /**
   * Inicializar pestañas
   * @private
   */
  _initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        const targetTab = button.getAttribute('data-tab');
        
        // Actualizar botones activos
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Actualizar contenido activo
        tabContents.forEach(content => {
          content.classList.remove('active');
          if (content.id === targetTab) {
            content.classList.add('active');
          }
        });
      });
    });
  },
  
  /**
   * Inicializar tooltips
   * @private
   */
  _initTooltips() {
    const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
    
    tooltipTriggers.forEach(trigger => {
      trigger.addEventListener('mouseenter', (e) => {
        const message = e.target.getAttribute('data-tooltip');
        // Implementar tooltip si es necesario
      });
    });
  },
  
  /**
   * Configurar logout
   * @private
   */
  _setupLogout() {
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        // Limpiar datos de sesión de manera segura
        sessionStorage.removeItem('admin_logged');
        
        // Limpiar cualquier otro dato de sesión relacionado
        sessionStorage.clear();
        
        // Mostrar notificación de cierre de sesión
        UI.showNotification('Sesión cerrada correctamente', 'success');
        
        // Redireccionar a la página de inicio después de un breve delay
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      });
    }
  },
  
  /**
   * OPTIMIZACIÓN SPRINT 3: Lazy loading del gráfico de progreso
   * @private
   */
  async _initBarriosProgressChart() {
    try {
      console.log('🔄 Cargando gráfico de progreso con lazy loading...');
      
      const container = document.getElementById('grafica-barrios-container');
      if (!container) {
        console.warn('⚠️ Contenedor grafica-barrios-container no encontrado');
        return;
      }
      
      // Destruir instancia anterior si existe
      if (this._state.barriosProgressChart) {
        this._state.barriosProgressChart.destroy();
        this._state.barriosProgressChart = null;
      }
      
      // Usar importación directa en lugar de lazy loading para evitar errores
      const { BarriosProgressChart } = await import('./barrios-progress-chart.js');
      
      // Crear nueva instancia
      this._state.barriosProgressChart = new BarriosProgressChart('grafica-barrios-container', {
        refreshInterval: 30000, // 30 segundos
        showStats: true,
        animations: true
      });
      
      console.log('✅ Gráfico de progreso cargado exitosamente');
      
    } catch (error) {
      console.warn('⚠️ Error cargando gráfico de progreso (no crítico):', error);
      
      // Fallback: mostrar mensaje de error sin afectar la inicialización principal
      const container = document.getElementById('grafica-barrios-container');
      if (container) {
        container.innerHTML = `
          <div class="alert alert-warning">
            <h5>⚠️ Gráfico no disponible</h5>
            <p>El gráfico de progreso no se pudo cargar. El resto del panel funciona normalmente.</p>
          </div>
        `;
      }
      
      // No propagar el error para que no afecte la inicialización principal
    }
  },
  

  
  // ==========================================
  // FUNCIONES DE RENDERIZADO
  // ==========================================
  
  /**
   * Renderizar gráfico de barrios
   * @private
   */
  _updateBarriosChart(reportes) {
    const canvas = document.getElementById('chart-barrios');
    if (!canvas) return;
    
    // Calcular datos por barrio
    const datosPorBarrio = {};
    reportes.forEach(reporte => {
      const barrio = reporte.barrio;
      datosPorBarrio[barrio] = (datosPorBarrio[barrio] || 0) + 1;
    });
    
    const labels = Object.keys(datosPorBarrio);
    const data = Object.values(datosPorBarrio);
    
    // Destruir gráfico anterior si existe
    if (this._state.charts.barrios) {
      this._state.charts.barrios.destroy();
    }
    
    // Crear nuevo gráfico
    this._state.charts.barrios = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            'rgba(116, 185, 255, 0.8)',
            'rgba(138, 43, 226, 0.8)',
            'rgba(255, 107, 107, 0.8)',
            'rgba(72, 219, 251, 0.8)',
            'rgba(255, 159, 67, 0.8)',
            'rgba(129, 236, 236, 0.8)',
            'rgba(255, 118, 117, 0.8)',
            'rgba(162, 155, 254, 0.8)',
            'rgba(255, 177, 66, 0.8)',
            'rgba(85, 239, 196, 0.8)',
            'rgba(255, 121, 198, 0.8)',
            'rgba(129, 207, 224, 0.8)'
          ],
          borderWidth: 2,
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgba(255, 255, 255, 0.8)',
              padding: 20,
              usePointStyle: true
            }
          }
        }
      }
    });
  },
  
  /**
   * Renderizar gráfico mensual
   * @private
   */
  _updateMensualChart(reportes) {
    const canvas = document.getElementById('chart-mes');
    if (!canvas) return;
    
    // Calcular datos por mes
    const datosPorMes = {};
    reportes.forEach(reporte => {
      if (reporte.fecha) {
        const mes = reporte.fecha.substring(0, 7); // YYYY-MM
        datosPorMes[mes] = (datosPorMes[mes] || 0) + 1;
      }
    });
    
    const labels = Object.keys(datosPorMes).sort();
    const data = labels.map(mes => datosPorMes[mes]);
    
    // Destruir gráfico anterior si existe
    if (this._state.charts.mes) {
      this._state.charts.mes.destroy();
    }
    
    // Crear nuevo gráfico
    this._state.charts.mes = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels.map(mes => {
          const [year, month] = mes.split('-');
          return new Date(year, month - 1).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        }),
        datasets: [{
          label: 'Reportes por mes',
          data: data,
          borderColor: 'rgba(116, 185, 255, 1)',
          backgroundColor: 'rgba(116, 185, 255, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: 'rgba(255, 255, 255, 0.8)'
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          y: {
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    });
  },
  
  /**
   * Actualizar elementos de estadísticas
   * @private
   */
  _updateStatsElements(stats) {
    // Total de reportes
    const totalElement = document.getElementById('total-reportes');
    if (totalElement) {
      totalElement.textContent = UI.formatNumber(stats.total);
    }
    
    // Barrio más activo
    const barrioActivoElement = document.getElementById('barrio-mas-activo');
    if (barrioActivoElement && stats.barrioMasActivo) {
      barrioActivoElement.textContent = stats.barrioMasActivo;
    }
    
    // Último reporte
    const ultimoReporteElement = document.getElementById('ultimo-reporte');
    if (ultimoReporteElement && stats.ultimoReporte) {
      ultimoReporteElement.textContent = UI.formatDate(stats.ultimoReporte.fecha, 'relative');
    }
  },
  
  /**
   * Actualizar tablas
   * @private
   */
  async _updateTables(reportes) {
    this._renderReportesTable(reportes);
  },
  
  /**
   * Renderizar tabla de reportes con paginación
   * @private
   */
  _renderReportesTable(reportes) {
    // Configurar paginación
    this._state.pagination = {
      currentPage: this._state.pagination?.currentPage || 1,
      itemsPerPage: 15,
      totalItems: reportes.length
    };
    
    // Calcular datos de la página actual
    const startIndex = (this._state.pagination.currentPage - 1) * this._state.pagination.itemsPerPage;
    const endIndex = startIndex + this._state.pagination.itemsPerPage;
    const currentPageReportes = reportes.slice(startIndex, endIndex);
    
    // Renderizar tabla
    this._renderTableContent(currentPageReportes);
    
    // Renderizar controles de paginación
    this._renderPagination();
    
    // Actualizar información de reportes
    this._updateReportesInfo();
  },
  
  /**
   * Renderizar contenido de la tabla
   * @private
   */
  _renderTableContent(reportes) {
    const tableBody = document.getElementById('tabla-reportes-body');
    if (!tableBody) return;
    

    
    if (reportes.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="table-cell" style="text-align: center; padding: var(--space-xl); color: var(--text-secondary);">
            <div style="display: flex; flex-direction: column; align-items: center; gap: var(--space-md);">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L19.7071 9.70711C19.8946 9.89464 20 10.149 20 10.4142V19C20 20.1046 19.1046 21 18 21H17Z"/>
              </svg>
              <span>No hay reportes para mostrar</span>
            </div>
          </td>
        </tr>
      `;
      return;
    }
    
    tableBody.innerHTML = reportes.map(reporte => `
      <tr>
        <td class="table-cell">${this._formatDate(reporte.fecha)}</td>
        <td class="table-cell">${reporte.barrio || '-'}</td>
        <td class="table-cell manzanas-cell" data-manzanas="${reporte.manzanas || ''}">
          ${this._formatManzanas(reporte.manzanas)}
        </td>
        <td class="table-cell">${this._formatCapitanName(reporte)}</td>
        <td class="table-cell">${this._renderStatusBadge(this._calculateEstadoFromData(reporte))}</td>
        <td class="table-cell table-cell--mobile-hidden">${this._formatObservaciones(reporte.observaciones)}</td>
       </tr>
    `).join('');
    
    // Configurar tooltips para las celdas de manzanas
    this._setupManzanasTooltips();
  },
  
  /**
   * Configurar tooltips interactivos para las celdas de manzanas
   * @private
   */
  _setupManzanasTooltips() {
    const manzanasCells = document.querySelectorAll('.manzanas-cell');
    
    manzanasCells.forEach(cell => {
      cell.style.cursor = 'pointer';
      
      cell.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Cerrar otros tooltips abiertos
        this._closeAllTooltips();
        
        const manzanasCompletas = cell.getAttribute('data-manzanas');
        if (!manzanasCompletas) return;
        
        // Crear overlay centrado
        const overlay = this._createManzanasTooltip(manzanasCompletas);
        document.body.appendChild(overlay);
        
        // Mostrar overlay con animación
        setTimeout(() => {
          overlay.classList.add('active');
        }, 10);
        
        // Cerrar al hacer clic en el overlay
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            this._closeAllTooltips();
          }
        });
      });
    });
  },
  
  /**
   * Crear tooltip para mostrar manzanas completas
   * @private
   */
  _createManzanasTooltip(manzanasCompletas) {
    const overlay = document.createElement('div');
    overlay.className = 'manzanas-tooltip-overlay';
    
    const manzanasArray = manzanasCompletas.split(',').map(m => m.trim()).filter(m => m);
    const manzanasFormateadas = manzanasArray.join(', ');
    
    overlay.innerHTML = `
      <div class="manzanas-tooltip-content">
        <div class="manzanas-tooltip-header">
          <button class="manzanas-tooltip-close" onclick="this.closest('.manzanas-tooltip-overlay').remove()">
            ×
          </button>
        </div>
        <div class="manzanas-tooltip-body">
          ${manzanasFormateadas}
        </div>
      </div>
    `;
    
    return overlay;
  },
  
  /**
   * Cerrar todos los tooltips de manzanas
   * @private
   */
  _closeAllTooltips() {
    const overlays = document.querySelectorAll('.manzanas-tooltip-overlay');
    overlays.forEach(overlay => {
      overlay.classList.remove('active');
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    });
  },
  
  /**
   * Renderizar controles de paginación
   * @private
   */
  _renderPagination() {
    const paginationContainer = document.getElementById('paginacion-reportes');
    if (!paginationContainer) return;
    
    const { currentPage, itemsPerPage, totalItems } = this._state.pagination;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }
    
    let paginationHTML = '';
    
    // Botón anterior
    paginationHTML += `
      <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} 
              onclick="AdminManager.goToPage(${currentPage - 1})" title="Página anterior">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15,18 9,12 15,6"/>
        </svg>
      </button>
    `;
    
    // Números de página
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
      paginationHTML += `<button class="pagination-btn" onclick="AdminManager.goToPage(1)">1</button>`;
      if (startPage > 2) {
        paginationHTML += `<span class="pagination-info">...</span>`;
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <button class="pagination-btn ${i === currentPage ? 'pagination-btn--active' : ''}" 
                onclick="AdminManager.goToPage(${i})">${i}</button>
      `;
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHTML += `<span class="pagination-info">...</span>`;
      }
      paginationHTML += `<button class="pagination-btn" onclick="AdminManager.goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Botón siguiente
    paginationHTML += `
      <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} 
              onclick="AdminManager.goToPage(${currentPage + 1})" title="Página siguiente">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9,18 15,12 9,6"/>
        </svg>
      </button>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
  },
  
  /**
   * Actualizar información de reportes
   * @private
   */
  _updateReportesInfo() {
    const infoElement = document.getElementById('reportes-info');
    if (!infoElement) return;
    
    const { currentPage, itemsPerPage, totalItems } = this._state.pagination;
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
    
    if (totalItems === 0) {
      infoElement.textContent = 'No hay reportes para mostrar';
    } else {
      infoElement.textContent = `Mostrando ${startIndex}-${endIndex} de ${totalItems} reportes`;
    }
  },
  
  /**
   * Ir a una página específica
   * @param {number} page - Número de página
   */
  goToPage(page) {
    const totalPages = Math.ceil(this._state.pagination.totalItems / this._state.pagination.itemsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    this._state.pagination.currentPage = page;
    this._renderReportesTable(this._state.reportes);
  },
  
  /**
   * Renderizar badge de estado con colores distintivos
   * @private
   */
  _renderStatusBadge(estado) {
    if (!estado) {
      return '<span class="status-badge status-badge--default">Sin estado</span>';
    }
    
    const estadoLower = estado.toLowerCase();
    let badgeClass = 'status-badge--default';
    
    if (estadoLower.includes('iniciado') || estadoLower.includes('inicio')) {
      badgeClass = 'status-badge--iniciado';
    } else if (estadoLower.includes('progreso') || estadoLower.includes('proceso')) {
      badgeClass = 'status-badge--progreso';
    } else if (estadoLower.includes('finalizado') || estadoLower.includes('completo') || estadoLower.includes('terminado')) {
      badgeClass = 'status-badge--finalizado';
    }
    
    return `<span class="status-badge ${badgeClass}">${estado}</span>`;
  },
  
  /**
   * Formatear fecha
   * @private
   */
  _formatDate(fecha) {
    if (!fecha) return '-';
    
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return fecha;
    }
  },
  
  /**
   * Formatear nombre del capitán
   * @private
   */
  _formatCapitanName(reporte) {
    if (reporte.nombre_capitan) {
      return reporte.nombre_capitan;
    }
    
    if (reporte.nombre && reporte.apellido) {
      return `${reporte.nombre} ${reporte.apellido}`;
    }
    
    return reporte.nombre || reporte.capitan || '-';
  },
  
  /**
   * Formatear manzanas
   * @private
   */
  _formatManzanas(manzanas) {
    if (!manzanas) return '-';
    
    if (typeof manzanas === 'string') {
      const manzanasArray = manzanas.split(',').map(m => m.trim()).filter(m => m);
      if (manzanasArray.length > 3) {
        return `${manzanasArray.slice(0, 3).join(', ')} +${manzanasArray.length - 3}`;
      }
      return manzanasArray.join(', ');
    }
    
    return manzanas.toString();
  },
  
  /**
    * Formatear observaciones
    * @private
    */
    _formatObservaciones(observaciones) {
      if (!observaciones) return '-';
      
      if (observaciones.length > 30) {
        return `${observaciones.substring(0, 30)}...`;
      }
      
      return observaciones;
    },
    
    /**
     * Calcular estado desde los datos del reporte
     * @private
     */
    _calculateEstadoFromData(reporte) {
      // Usar el estado definido en la BD sin cálculos ni heurísticas
      if (reporte.estado && reporte.estado.trim() !== '' && reporte.estado !== reporte.barrio) {
        const estadoNormalizado = reporte.estado.toLowerCase();
        if (estadoNormalizado === 'iniciado') return 'Iniciado';
        if (estadoNormalizado === 'en_progreso') return 'Progreso';
        if (estadoNormalizado === 'finalizado') return 'Finalizado';
        return reporte.estado;
      }
      
      return 'Sin estado';
    },
   
   /**
    * Renderizar salidas
    * @private
   */
  _renderSalidas() {
    console.log('🎨 AdminManager: Renderizando salidas...');
    
    const container = document.getElementById('lista-capitanes');
    if (!container) {
      console.error('❌ AdminManager: No se encontró el contenedor lista-capitanes');
      return;
    }
    
    // OPTIMIZADO: Logs simplificados para evitar spam
    console.log(`📊 AdminManager: Renderizando ${this._state.salidas.length} salidas`);
    
    if (this._state.salidas.length === 0) {
      console.log('⚠️ AdminManager: No hay salidas, mostrando mensaje vacío');
      container.innerHTML = '<div class="text-center text-muted">No hay salidas programadas</div>';
      return;
    }
    
    // Removido log de JSON completo para evitar spam en consola
    
    container.innerHTML = this._state.salidas.map(salida => `
      <div class="capitan-card-compact">
        <div class="capitan-avatar">
          <span class="avatar-initials">${(salida.capitanes?.nombre?.charAt(0) || 'S') + (salida.capitanes?.apellido?.charAt(0) || 'P')}</span>
          <div class="capitan-status salida-status"></div>
        </div>
        
        <div class="capitan-content">
          <h4 class="barrio-name">${salida.barrio_asignado}</h4>
          <div class="capitan-details">
            <span class="capitan-nombre">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              ${salida.capitanes?.nombre} ${salida.capitanes?.apellido}
            </span>
            <span class="salida-horario">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
              ${UI.capitalize(salida.dia_semana)} ${UI.formatTime(salida.hora)}
            </span>
            ${salida.capitanes?.telefono ? `
            <span class="salida-telefono">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              ${salida.capitanes.telefono}
            </span>` : ''}
          </div>
        </div>
        
        <div class="capitan-actions-compact">
          <button class="action-btn edit-btn" data-id="${salida.id}" title="Editar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="action-btn delete-btn" data-id="${salida.id}" title="Eliminar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
    `).join('');
    
    // Agregar event listeners para los botones de salidas
    this._setupSalidaEventListeners();
  },
  
  /**
   * Configurar event listeners para botones de salidas
   * @private
   */
  _setupSalidaEventListeners() {
    const container = document.getElementById('lista-salidas');
    if (!container) return;
    
    // Event listeners para botones de editar
    container.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.editSalida(id);
      });
    });
    
    // Event listeners para botones de eliminar
    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.deleteSalida(id);
      });
    });
  },
  
  /**
   * Renderizar salidas usando el componente reutilizable
   * @private
   * @example Uso del nuevo componente CompactCard
   */
  _renderSalidasWithComponent() {
    const container = document.getElementById('lista-salidas');
    if (!container) return;
    
    // OPTIMIZADO: Log simplificado
    console.log(`📊 AdminManager: Renderizando ${this._state.salidas.length} salidas con componente`);
    
    if (this._state.salidas.length === 0) {
      container.innerHTML = '<div class="text-center text-muted">No hay salidas programadas</div>';
      return;
    }
    
    // Configuración para salidas usando el preset
    const config = {
      ...CompactCardPresets.salida,
      onActionClick: (event) => {
        // Manejar acciones específicas
        switch (event.action) {
          case 'edit':
            this.editSalida(event.id);
            break;
          case 'delete':
            this.deleteSalida(event.id);
            break;
        }
      }
    };
    
    // Renderizar todas las tarjetas usando el componente
    const html = CompactCard.renderMultiple(this._state.salidas, config);
    container.innerHTML = html;
    
    // Configurar event listeners automáticamente
    const cards = this._state.salidas.map(salida => new CompactCard({ ...config, data: salida }));
    CompactCard.setupMultipleEventListeners(container, cards);
    
    console.log('✅ AdminManager: Tarjetas de salidas renderizadas con componente reutilizable');
  },
  
  /**
   * Renderizar capitanes
   * @private
   */
  _renderCapitanes(capitanes = null) {
    const container = document.getElementById('lista-capitanes-maestro');
    if (!container) return;
    
    const capitanesToRender = capitanes || this._state.capitanes;
    
    if (capitanesToRender.length === 0) {
      container.innerHTML = '<div class="text-center text-muted">No hay capitanes registrados</div>';
      return;
    }
    
    container.innerHTML = capitanesToRender.map(capitan => `
      <div class="capitan-maestro-card">
        <div class="capitan-maestro-card__header">
          <h4>${capitan.nombre} ${capitan.apellido}</h4>
        </div>
        <div class="capitan-maestro-card__body">
          ${capitan.telefono ? `<p><strong>Teléfono:</strong> ${capitan.telefono}</p>` : ''}
          ${capitan.email ? `<p><strong>Email:</strong> ${capitan.email}</p>` : ''}
        </div>
      </div>
    `).join('');
  },
  
  /**
   * Obtener clase CSS para badge de estado
   * @private
   */
  _getEstadoBadgeClass(estado) {
    switch (estado?.toLowerCase()) {
      case 'completado':
        return 'success';
      case 'pendiente':
        return 'warning';
      case 'cancelado':
        return 'error';
      default:
        return 'info';
    }
  },
  
  // ==========================================
  // MÉTODOS PÚBLICOS ADICIONALES
  // ==========================================
  
  /**
   * Ver detalles de un reporte
   */
  async viewReporte(id) {
    const reporte = this._state.reportes.find(r => r.id === id);
    if (!reporte) {
      UI.showNotification('Reporte no encontrado', 'error');
      return;
    }
    
    const content = `
      <div class="reporte-details">
        <p><strong>Fecha:</strong> ${UI.formatDate(reporte.fecha, 'long')}</p>
        <p><strong>Nombre:</strong> ${reporte.nombre} ${reporte.apellido}</p>
        <p><strong>Barrio:</strong> ${reporte.barrio}</p>
        <p><strong>Territorio:</strong> ${reporte.territorio || 'No especificado'}</p>
        <p><strong>Estado:</strong> ${reporte.estado || 'Sin estado'}</p>
        ${reporte.observaciones ? `<p><strong>Observaciones:</strong> ${reporte.observaciones}</p>` : ''}
      </div>
    `;
    
    UI.createModal('Detalles del Reporte', content, {
      size: 'medium'
    });
  },
  
  /**
   * Editar salida
   */
  async editSalida(id) {
    const salida = this._state.salidas.find(s => s.id === id);
    if (!salida) {
      UI.showNotification('Salida no encontrada', 'error');
      return;
    }
    
    // Llenar formulario con datos de la salida
    const form = document.getElementById('form-salida');
    if (form) {
      form.querySelector('[name="id"]').value = salida.id;
      form.querySelector('[name="capitan_id"]').value = salida.capitan_id;
      form.querySelector('[name="barrio_asignado"]').value = salida.barrio_asignado;
      form.querySelector('[name="dia_semana"]').value = salida.dia_semana;
      form.querySelector('[name="hora"]').value = salida.hora;
      
      // Cambiar a la pestaña de gestión
      const tabButton = document.querySelector('[data-tab="gestion-capitanes"]');
      if (tabButton) {
        tabButton.click();
      }
    }
  },

  /**
   * Inicializar selector de tiempo nativo minimalista
   */
  initTimeSelector() {
    const timeInput = document.getElementById('salida-time');
    const horaHiddenInput = document.getElementById('salida-hora');
    const minutosHiddenInput = document.getElementById('salida-minutos');
    
    if (!timeInput || !horaHiddenInput || !minutosHiddenInput) return;
    
    // Función para actualizar inputs ocultos desde el input nativo
    function updateHiddenInputs() {
      const timeValue = timeInput.value;
      
      if (timeValue) {
        const [hora, minutos] = timeValue.split(':');
        horaHiddenInput.value = hora;
        minutosHiddenInput.value = minutos;
      } else {
        horaHiddenInput.value = '';
        minutosHiddenInput.value = '';
      }
    }
    
    // Event listeners para cambios en el input nativo
    timeInput.addEventListener('change', updateHiddenInputs);
    timeInput.addEventListener('input', updateHiddenInputs);
    
    // Inicializar valores si ya hay algo seleccionado
    updateHiddenInputs();
  }
};

// Hacer AdminManager disponible globalmente
if (typeof window !== 'undefined') {
  window.AdminManager = AdminManager;
}

// Exportar por defecto
export default AdminManager;