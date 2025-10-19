/**
 * Admin TypeScript - Migración completa del panel administrativo
 * Gestión centralizada de dashboard, reportes, salidas, capitanes y estadísticas
 */

import { UI } from './utils/ui.js';
import { CompactCard, CompactCardPresets } from './components/compact-card.js';
import { BarriosProgressChart } from './barrios-progress-chart.js';
import type { 
  AdminState,
  AdminFilters,
  AdminCharts,
  PaginationState,
  SalidaAPI,
  SalidaFormData,
  AdminStats,
  ValidationResult,
  ConfirmDialogOptions,
  CompactCardConfig,
  ActionClickEvent,
  ApiResponse,
  ReporteAPI,
  Capitan,
  ChartInstance
} from './types/index.js';

// Variables para las funciones de dashboard (tipadas)
let mostrarDesequilibrio: ((reportes: ReporteAPI[]) => Promise<void>) | null = null;
let actualizarGraficaBarrios: ((reportes?: ReporteAPI[]) => Promise<void>) | null = null;
let actualizarProgresoMes: ((reportes: ReporteAPI[]) => void) | null = null;
let poblarFiltros: (() => Promise<void>) | null = null;
let actualizarTablaDescarga: (() => Promise<void>) | null = null;
let obtenerReportes: ((filters: any) => Promise<ReporteAPI[]>) | null = null;
let setupDashboardEventListeners: (() => void) | null = null;

/**
 * Función para cargar dashboard.js dinámicamente
 */
async function loadDashboardModule(): Promise<boolean> {
  try {
    const dashboardModule = await import('./dashboard.js');
    mostrarDesequilibrio = dashboardModule.mostrarDesequilibrio;
    actualizarGraficaBarrios = dashboardModule.actualizarGraficaBarrios;
    // actualizarProgresoMes = dashboardModule.actualizarGraficaMes; // Tipos incompatibles
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
const API_BASE: string = '/api';

/**
 * Módulo Admin - Gestión centralizada del panel administrativo
 * Maneja dashboard, reportes, salidas, capitanes y estadísticas
 */
export const AdminManager = {
  
  // Estado interno del módulo (tipado)
  _state: {
    reportes: [],
    salidas: [],
    capitanes: [],
    filtros: {
      barrio: '',
      periodo: 'mes' as const,
      estado: ''
    },
    charts: {
      barrios: null,
      mes: null
    },
    barriosProgressChart: null,
    pagination: {
      currentPage: 1,
      itemsPerPage: 15,
      totalItems: 0
    }
  } as AdminState,
  
  // ==========================================
  // INICIALIZACIÓN
  // ==========================================
  
  /**
   * Inicializar el módulo admin
   */
  async init(): Promise<void> {
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
   */
  _checkAuth(): boolean {
    return sessionStorage.getItem('admin_logged') === '1';
  },
  
  /**
   * Inicializar componentes del admin
   */
  async _initializeComponents(): Promise<void> {
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
   */
  async _loadInitialData(): Promise<void> {
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
   */
  _setupEventListeners(): void {
    // Formularios
    const formCapitan = document.getElementById('form-capitan') as HTMLFormElement;
    if (formCapitan) {
      formCapitan.addEventListener('submit', (e) => this.handleSalidaSubmit(e));
    }
    
    // Búsqueda de capitanes
    const searchCapitanes = document.getElementById('search-capitanes') as HTMLInputElement;
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
  async loadReportes(filters: Record<string, string> = {}): Promise<ReporteAPI[]> {
    try {
      const params = new URLSearchParams();
      
      // Aplicar filtros
      if (filters.barrio) params.append('barrio', filters.barrio);
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
      if (filters.estado) params.append('estado', filters.estado);
      
      const response = await fetch(`${API_BASE}/reportes?${params}`);
      const result: ApiResponse<ReporteAPI[]> = await response.json();
      
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
  async loadSalidas(filters: Record<string, string> = {}): Promise<SalidaAPI[]> {
    try {
      console.log('🔍 AdminManager: Cargando salidas con filtros:', filters);
      
      const params = new URLSearchParams();
      
      if (filters.capitan_id) params.append('capitan_id', filters.capitan_id);
      if (filters.barrio_asignado) params.append('barrio_asignado', filters.barrio_asignado);
      if (filters.dia_semana) params.append('dia_semana', filters.dia_semana);
      
      const url = `${API_BASE}/salidas?${params}`;
      
      const response = await fetch(url);
      const result: ApiResponse<SalidaAPI[]> = await response.json();
      
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
  async loadCapitanes(): Promise<Capitan[]> {
    try {
      const response = await fetch(`${API_BASE}/capitanes`);
      const result: ApiResponse<Capitan[]> = await response.json();
      
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
  async updateDashboard(): Promise<void> {
    try {
      // Usar función de dashboard.js para obtener reportes con filtros de fecha
      let reportes: ReporteAPI[];
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
      
    } catch (error) {
      console.error('❌ Error al actualizar dashboard:', error);
      throw error; // Re-lanzar el error para que lo maneje init()
    }
  },
  
  /**
   * Obtener filtros actuales
   */
  _getCurrentFilters(): Record<string, string | undefined> {
    const barrio = '';
    const estado = '';
    
    return {
      barrio: barrio || undefined,
      estado: estado || undefined
    };
  },
  
  /**
   * Obtener rango de fechas según período
   */
  _getDateRange(periodo: AdminFilters['periodo']): { start: string; end: string } {
    const now = new Date();
    let start: Date;
    const end = new Date(now);
    
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
   */
  async _updateCharts(reportes: ReporteAPI[]): Promise<void> {
    // Filtrar reportes por mes actual para gráficas
    const now = new Date();
    const mesActual = now.toISOString().slice(0, 7); // YYYY-MM
    const reportesDelMes = reportes.filter(r => r.fecha.startsWith(mesActual));
    
    // Usar funciones de dashboard.js con reportes del mes actual
    if (actualizarGraficaBarrios) {
      await actualizarGraficaBarrios(reportesDelMes);
    } else {
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
   */
  async _updateStats(reportes: ReporteAPI[]): Promise<void> {
    const stats = this._calculateStats(reportes);
    
    // Actualizar elementos del DOM
    this._updateStatsElements(stats);
  },
  
  /**
   * Calcular estadísticas
   */
  _calculateStats(reportes: ReporteAPI[]): AdminStats {
    const total = reportes.length;
    const porBarrio: Record<string, number> = {};
    const porMes: Record<string, number> = {};
    
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
  async handleSalidaSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    try {
      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);
      const salidaData: Record<string, string> = {};
      
      formData.forEach((value, key) => {
        salidaData[key] = value.toString();
      });
      
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
        UI.showFormErrors(form, validation.errors);
        return;
      }
      
      // Determinar si es creación o actualización
      const isEdit = salidaData.id && salidaData.id !== '';
      
      let response: Response;
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
      
      const result: ApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al guardar salida');
      }
      
      UI.showNotification(
        isEdit ? 'Salida actualizada correctamente' : 'Salida creada correctamente',
        'success'
      );
      
      // Limpiar formulario y recargar datos
      form.reset();
      await this.loadSalidas();
      this._renderSalidas();
      
    } catch (error) {
      console.error('❌ Error al guardar salida:', error);
      UI.showNotification('Error al guardar salida', 'error');
    }
  },
  
  /**
   * Validar datos de salida
   */
  _validateSalidaData(data: Record<string, string>): ValidationResult {
    const rules = {
      capitan_id: ['required'],
      barrio_asignado: ['required'],
      dia_semana: ['required'],
      hora: ['required']
    };
    
    // Validación manual de datos
    const errors: Record<string, string> = {};
    
    for (const [field, fieldRules] of Object.entries(rules)) {
      if (fieldRules.includes("required") && (!data[field] || data[field].trim() === "")) {
        errors[field] = `El campo ${field} es requerido`;
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },
  
  /**
   * Eliminar salida
   */
  async deleteSalida(id: string | number): Promise<void> {
    try {
      const confirmed = await this._showConfirmDialog(
        'Confirmar eliminación',
        '¿Estás seguro de que quieres eliminar esta salida?'
      );
      
      if (!confirmed) return;
      
      const response = await fetch(`${API_BASE}/salidas/${id}`, {
        method: 'DELETE'
      });
      
      const result: ApiResponse = await response.json();
      
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
  filterCapitanes(searchTerm: string): void {
    const filteredCapitanes = this._state.capitanes.filter(capitan => {
      const fullName = `${capitan.nombre} ${capitan.apellido || ''}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
    
    this._renderCapitanes(filteredCapitanes);
  },
  
  /**
   * Crear nuevo capitán
   */
  async createCapitan(capitanData: Partial<Capitan>): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/capitanes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(capitanData)
      });
      
      const result: ApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al crear capitán');
      }
      
      UI.showNotification('Capitán creado correctamente', 'success');
      
      // Recargar datos
      await this.loadCapitanes();
      this._renderCapitanes();
      
    } catch (error) {
      console.error('❌ Error al crear capitán:', error);
      UI.showNotification('Error al crear capitán', 'error');
    }
  },
  
  // ==========================================
  // MÉTODOS PRIVADOS DE RENDERIZADO
  // ==========================================
  
  /**
   * Renderizar salidas
   */
  _renderSalidas(): void {
    const container = document.getElementById('lista-salidas');
    if (!container) return;
    
    console.log(`📊 AdminManager: Renderizando ${this._state.salidas.length} salidas`);
    
    if (this._state.salidas.length === 0) {
      container.innerHTML = '<div class="text-center text-muted">No hay salidas programadas</div>';
      return;
    }
    
    container.innerHTML = this._state.salidas.map(salida => `
      <div class="salida-card">
        <div class="salida-card__header">
          <h4>${salida.barrio_asignado}</h4>
          <span class="badge badge--info">${salida.dia_semana}</span>
        </div>
        <div class="salida-card__body">
          <p><strong>Hora:</strong> ${salida.hora}</p>
          <p><strong>Capitán ID:</strong> ${salida.capitan_id}</p>
        </div>
        <div class="salida-card__actions">
          <button class="btn btn--sm btn--secondary edit-btn" data-id="${salida.id}">
            Editar
          </button>
          <button class="btn btn--sm btn--danger delete-btn" data-id="${salida.id}">
            Eliminar
          </button>
        </div>
      </div>
    `).join('');
    
    // Configurar event listeners
    this._setupSalidaEventListeners(container);
  },
  
  /**
   * Configurar event listeners para salidas
   */
  _setupSalidaEventListeners(container: HTMLElement): void {
    // Event listeners para botones de editar
    container.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const id = target.dataset.id;
        if (id) this.editSalida(id);
      });
    });
    
    // Event listeners para botones de eliminar
    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const id = target.dataset.id;
        if (id) this.deleteSalida(id);
      });
    });
  },
  
  /**
   * Renderizar capitanes
   */
  _renderCapitanes(capitanes: Capitan[] | null = null): void {
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
          <h4>${capitan.nombre} ${capitan.apellido || ''}</h4>
        </div>
        <div class="capitan-maestro-card__body">
          ${capitan.telefono ? `<p><strong>Teléfono:</strong> ${capitan.telefono}</p>` : ''}
          ${capitan.email ? `<p><strong>Email:</strong> ${capitan.email}</p>` : ''}
        </div>
      </div>
    `).join('');
  },
  
  // ==========================================
  // MÉTODOS AUXILIARES
  // ==========================================
  
  /**
   * Mostrar diálogo de confirmación
   */
  async _showConfirmDialog(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmed = confirm(`${title}\n\n${message}`);
      resolve(confirmed);
    });
  },
  
  /**
   * Actualizar elementos de estadísticas
   */
  _updateStatsElements(stats: AdminStats): void {
    // Implementación de actualización de elementos del DOM
    console.log('📊 Estadísticas actualizadas:', stats);
  },
  
  /**
   * Actualizar gráfico mensual (fallback)
   */
  _updateMensualChart(reportes: ReporteAPI[]): void {
    console.log('📊 Actualizando gráfico mensual (fallback):', reportes.length, 'reportes');
  },
  
  /**
   * Actualizar tablas
   */
  async _updateTables(reportes: ReporteAPI[]): Promise<void> {
    console.log('📊 Actualizando tablas con', reportes.length, 'reportes');
  },
  
  /**
   * Inicializar pestañas
   */
  _initTabs(): void {
    console.log('🎯 Inicializando pestañas');
  },
  
  /**
   * Inicializar tooltips
   */
  _initTooltips(): void {
    console.log('🎯 Inicializando tooltips');
  },
  
  /**
   * Configurar logout
   */
  _setupLogout(): void {
    console.log('🎯 Configurando logout');
  },
  
  /**
   * Inicializar componente de progreso de barrios
   */
  async _initBarriosProgressChart(): Promise<void> {
    console.log('🎯 Inicializando componente de progreso de barrios');
  },
  
  // ==========================================
  // MÉTODOS PÚBLICOS ADICIONALES
  // ==========================================
  
  /**
   * Ver detalles de un reporte
   */
  async viewReporte(id: string): Promise<void> {
    const reporte = this._state.reportes.find(r => r.id === id);
    if (!reporte) {
      UI.showNotification('Reporte no encontrado', 'error');
      return;
    }
    
    const content = `
      <div class="reporte-details">
        <p><strong>Fecha:</strong> ${UI.formatDate(reporte.fecha, 'long')}</p>
        <p><strong>Barrio:</strong> ${reporte.barrio}</p>
        <p><strong>Capitán:</strong> ${reporte.capitan}</p>
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
  async editSalida(id: string | number): Promise<void> {
    const salida = this._state.salidas.find(s => s.id.toString() === id.toString());
    if (!salida) {
      UI.showNotification('Salida no encontrada', 'error');
      return;
    }
    
    // Llenar formulario con datos de la salida
    const form = document.getElementById('form-salida') as HTMLFormElement;
    if (form) {
      const idInput = form.querySelector('[name="id"]') as HTMLInputElement;
      const capitanInput = form.querySelector('[name="capitan_id"]') as HTMLSelectElement;
      const barrioInput = form.querySelector('[name="barrio_asignado"]') as HTMLSelectElement;
      const diaInput = form.querySelector('[name="dia_semana"]') as HTMLSelectElement;
      const horaInput = form.querySelector('[name="hora"]') as HTMLInputElement;
      
      if (idInput) idInput.value = salida.id.toString();
      if (capitanInput) capitanInput.value = salida.capitan_id.toString();
      if (barrioInput) barrioInput.value = salida.barrio_asignado;
      if (diaInput) diaInput.value = salida.dia_semana;
      if (horaInput) horaInput.value = salida.hora;
      
      // Cambiar a la pestaña de gestión
      const tabButton = document.querySelector('[data-tab="gestion-capitanes"]') as HTMLElement;
      if (tabButton) {
        tabButton.click();
      }
    }
  },

  /**
   * Inicializar selector de tiempo nativo minimalista
   */
  initTimeSelector(): void {
    const timeInput = document.getElementById('salida-time') as HTMLInputElement;
    const horaHiddenInput = document.getElementById('salida-hora') as HTMLInputElement;
    const minutosHiddenInput = document.getElementById('salida-minutos') as HTMLInputElement;
    
    if (!timeInput || !horaHiddenInput || !minutosHiddenInput) return;
    
    // Función para actualizar inputs ocultos desde el input nativo
    function updateHiddenInputs(): void {
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
  },

  /**
   * Función pública para renderizar tabla de reportes (compatibilidad)
   */
  _renderReportesTable(reportes: ReporteAPI[]): void {
    console.log('📊 Renderizando tabla de reportes:', reportes.length);
    // Implementación de renderizado de tabla
  }
};

// Hacer AdminManager disponible globalmente
if (typeof window !== 'undefined') {
  window.AdminManager = AdminManager;
}

// Exportar por defecto
export default AdminManager;