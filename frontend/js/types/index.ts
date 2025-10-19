// types/json.types.ts
export interface JSONParseOptions {
  defaultValue?: any;
  validateStructure?: boolean;
}

export interface JSONStringifyOptions {
  fallback?: string;
  detectCircular?: boolean;
}

export interface StorageOptions {
  storageType: 'local' | 'session';
  key: string;
  defaultValue?: any;
}

// types/error.types.ts
export interface JSONError extends Error {
  type: 'parse' | 'stringify' | 'storage';
  originalData?: any;
  context?: string;
}

export interface ErrorHandlerConfig {
  enableInterceptors: boolean;
  cleanupOnError: boolean;
  logLevel: 'error' | 'warn' | 'info';
}

// types/api.types.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceStatus[];
  uptime: number;
}

export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  lastCheck: string;
}

export interface MetricsData {
  requests: RequestMetrics;
  performance: PerformanceMetrics;
  cache: CacheMetrics;
  system: SystemMetrics;
  business: BusinessMetrics;
}

export interface RequestMetrics {
  total: number;
  successRate: number;
  errorRate: number;
  averagePerSecond: number;
}



export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  totalRequests: number;
}

export interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
  cpu?: number;
}

export interface BusinessMetrics {
  reportes: {
    total: number;
    completados: number;
    pendientes: number;
  };
  capitanes: {
    activos: number;
    total: number;
  };
  ciclos: {
    activo: boolean;
    progreso: number;
  };
}

export interface FetchOptions {
  timeout?: number;
  retries?: number;
  validateResponse?: boolean;
}

// types/charts.types.ts
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartPlugins {
  legend?: {
    display: boolean;
    position?: 'top' | 'bottom' | 'left' | 'right';
  };
  tooltip?: {
    enabled: boolean;
    mode?: string;
  };
}

export interface ChartScales {
  x?: ChartScale;
  y?: ChartScale;
}

export interface ChartScale {
  display: boolean;
  title?: {
    display: boolean;
    text: string;
  };
}

// types/business.types.ts
export interface Reporte {
  id: string;
  fecha: string;
  barrio: string;
  capitan: string;
  estado: 'pendiente' | 'completado' | 'cancelado';
  detalles: ReporteDetalles;
  createdAt: string;
  updatedAt: string;
}

export interface ReporteDetalles {
  manzanas?: string[];
  observaciones?: string;
  tiempoInvertido?: number;
  participantes?: number;
}

export interface Capitan {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  barrios: string[];
  activo: boolean;
  fechaRegistro: string;
  ultimaActividad?: string;
}

export interface Ciclo {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
  progreso: number;
  descripcion?: string;
  meta?: number;
}

export interface BarrioProgreso {
  barrio: string;
  totalManzanas: number;
  manzanasCompletadas: number;
  porcentaje: number;
  ultimaActualizacion: string;
  capitanAsignado?: string;
}

export interface Salida {
  id: string;
  fecha: string;
  capitan: string;
  barrio: string;
  manzanas: string[];
  estado: 'programada' | 'en_curso' | 'completada' | 'cancelada';
  observaciones?: string;
}

// types/forms.types.ts
export interface FormValidation {
  isValid: boolean;
  errors: FormError[];
  warnings: FormWarning[];
}

export interface FormError {
  field: string;
  message: string;
  code: string;
}

export interface FormWarning {
  field: string;
  message: string;
  code: string;
}

export interface SearchFilters {
  fechaInicio?: string;
  fechaFin?: string;
  barrio?: string;
  capitan?: string;
  estado?: string;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SearchResult<T> {
  items: T[];
  pagination: PaginationInfo;
  filters: SearchFilters;
  totalFound: number;
}

// types/ui.types.ts
export interface ModalOptions {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success';
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
}

export interface ToastOptions {
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
  position?: 'top' | 'bottom';
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  formatter?: (value: any) => string;
}

export interface TableOptions {
  columns: TableColumn[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  pagination?: boolean;
  pageSize?: number;
}

// types/monitoring.types.ts
export interface MonitoringConfig {
  refreshInterval: number;
  autoRefreshEnabled: boolean;
  alertThresholds: AlertThresholds;
}

export interface AlertThresholds {
  responseTime: number;
  memoryUsage: number;
  errorRate: number;
  cacheHitRate: number;
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
  metric: string;
  value: number;
  threshold: number;
}

// types/dashboard.types.ts
export interface DashboardFilters {
  barrio?: string;
  periodo: 'mes' | 'semana' | 'año' | 'todo';
  estado?: string;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface BarrioDesequilibrio {
  barrio: string;
  frecuenciaMensual: number;
  frecuenciaEsperada: number;
  progresoPorcentaje: number;
  territoriosCompletados: number;
  totalTerritorios: number;
  diasTranscurridos: number;
  estado: '🟢' | '🟡' | '🔴';
  descripcion: string;
  desviacion: number;
  territoriosDelMesActual: number;
}

export interface BarriosProgressChartConfig {
  api: {
    endpoint: string;
    timeout: number;
  };
  theme: 'light' | 'dark';
  animations: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  showStats: boolean;
}

export interface ChartInstance {
  destroy(): void;
}

export interface ReporteAPI {
  id: string;
  fecha: string;
  barrio: string;
  capitan: string;
  estado: string;
  manzanas?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface CicloProgresoAPI {
  barrio: string;
  progreso_porcentaje: number;
  territorios_completados: number;
  total_territorios: number;
  dias_transcurridos: number;
}

// ==========================================
// INTERFACES PARA ADMIN.JS
// ==========================================

export interface AdminState {
  reportes: ReporteAPI[];
  salidas: SalidaAPI[];
  capitanes: Capitan[];
  filtros: AdminFilters;
  charts: AdminCharts;
  barriosProgressChart: ChartInstance | null;
  pagination: PaginationState;
}

export interface AdminFilters {
  barrio: string;
  periodo: 'semana' | 'mes' | 'año' | 'todo';
  estado: string;
}

export interface AdminCharts {
  barrios: ChartInstance | null;
  mes: ChartInstance | null;
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

export interface SalidaAPI {
  id: string | number;
  capitan_id: string | number;
  barrio_asignado: string;
  dia_semana: string;
  hora: string;
  created_at?: string;
  updated_at?: string;
}

export interface SalidaFormData {
  id?: string;
  capitan_id: string;
  barrio_asignado: string;
  dia_semana: string;
  hora: string;
  minutos?: string;
  time?: string;
}

export interface AdminStats {
  total: number;
  porBarrio: Record<string, number>;
  porMes: Record<string, number>;
  barrioMasActivo: string;
  ultimoReporte: ReporteAPI | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

// Interfaces para componentes de UI
export interface CompactCardConfig {
  onActionClick?: (event: ActionClickEvent) => void;
  showActions?: boolean;
  actionButtons?: ActionButton[];
}

export interface ActionClickEvent {
  action: string;
  id: string | number;
  data?: any;
}

export interface ActionButton {
  action: string;
  label: string;
  icon?: string;
  className?: string;
}

// Declaraciones globales para admin
declare global {
  interface Window {
    Chart: any;
  }
}

export {};
export interface WidgetConfig {
  refreshInterval?: number;
  autoRefresh?: boolean;
  height?: number;
  width?: number;
  position?: {
    x: number;
    y: number;
  };
}
declare global {
  interface Window {
    AdminManager: any;
  }
}

// Interfaces para capitanes.ts
export interface CapitanData {
  id?: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  email?: string;
  activo?: boolean;
}

export interface SalidaCapitan {
  id?: string;
  capitan_id: string;
  barrio_asignado: string;
  dia_semana: string;
  hora: string;
  capitanes: CapitanData;
}

export interface CapitanFilters {
  dia?: string;
  horario?: string;
}

export interface CapitanFormData {
  id?: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  email?: string;
  barrio_asignado: string;
  dia_semana: string;
  hora: string;
  minutos?: string;
}

export interface BarrioOption {
  value: string;
  label: string;
}

export interface TooltipContainer extends HTMLElement {
  classList: DOMTokenList;
}

// types/mapas.types.ts
// ... existing code ...

// ==========================================
// INTERFACES PARA GRÁFICAS DE PROGRESO DE BARRIOS
// ==========================================

export interface BarriosChartConfig {
  api: {
    base: string;
    endpoints: {
      reportes: string;
      ciclos: string;
      estadisticas: string;
    };
    timeout: number;
  };
  estadisticas: {
    intervalosConfianza: number[];
    metodosRegresion: string[];
    ventanaMovil: number;
    umbralCompletado: number;
    factorSuavizado: number;
  };
  visualizacion: {
    colores: {
      primarios: string[];
      completado: string;
      enProgreso: string;
      critico: string;
      advertencia: string;
    };
    animaciones: {
      duracion: number;
      easing: string;
    };
  };
  territorios: {
    totales: Record<string, number>;
    factoresCorreccion: Record<string, number>;
  };
  validacion: {
    maxReportesPorBarrio: number;
    maxManzanasPorReporte: number;
    rangoFechasValidas: {
      inicio: string;
      fin: string;
    };
  };
}

export interface BarriosChartState {
  datosOriginales: BarriosRawData | null;
  datosValidados: BarriosProcessedData | null;
  estadisticas: BarriosStatistics | null;
  errores: any[];
  ultimaActualizacion: string | null;
  cacheValido: boolean;
}

export interface BarriosRawData {
  reportes: ReporteAPI[];
  progresoCiclos: ProgresoCicloAPI[];
  estadisticas: Record<string, any>;
}

export interface ProgresoCicloAPI {
  id: string | number;
  barrio: string;
  progreso_porcentaje: number;
  estado: string;
  territorios_completados?: number;
  total_territorios?: number;
  dias_transcurridos?: number;
}

export interface BarriosProcessedData {
  barrios: Record<string, BarrioStatistics>;
  intervalos: Record<string, IntervalConfianza>;
  metadatos: {
    totalReportes: number;
    barriosAnalizados: number;
    fechaAnalisis: string;
    confiabilidad: number;
  };
}

export interface BarrioStatistics {
  // Métricas básicas
  totalTerritorios: number;
  manzanasUnicas: number;
  reportesTotales: number;
  
  // Progreso
  progresoBasico: number;
  progresoCorregido: number;
  factorCorreccion: number;
  
  // Análisis temporal
  velocidadProgreso: number;
  tendencia: number;
  aceleracion: number;
  
  // Predicciones
  prediccionFinalizacion: PrediccionFinalizacion;
  diasEstimadosRestantes: number;
  
  // Calidad de datos
  confiabilidad: number;
  margenError: number;
  
  // Estado
  estado: string;
  
  // Datos de ciclo
  progresoCicloAPI: number | null;
  estadoCiclo: string | null;
}

export interface PrediccionFinalizacion {
  dias: number;
  fecha: string;
  confianza: number;
  metodo: string;
}

export interface IntervalConfianza {
  nivel: number;
  limiteInferior: number;
  limiteSuperior: number;
  margenError: number;
}

export interface AnalisisTemporal {
  tendencia: number;
  aceleracion: number;
  velocidadPromedio: number;
  puntosInflexion: Date[];
}

export interface RegresionLineal {
  pendiente: number;
  intercepto: number;
  coeficienteCorrelacion: number;
  errorEstandar: number;
}

export interface BarriosStatistics {
  totalBarrios: number;
  barriosCompletados: number;
  progresoPromedio: number;
  velocidadPromedio: number;
  tiempoEstimadoTotal: number;
  distribucionEstados: Record<string, number>;
}

export interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ChartDataset {
  label: string;
  data: ChartDataPoint[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      display?: boolean;
      position?: string;
    };
    tooltip?: {
      enabled?: boolean;
      mode?: string;
      intersect?: boolean;
    };
  };
  scales?: {
    x?: {
      display?: boolean;
      title?: {
        display?: boolean;
        text?: string;
      };
    };
    y?: {
      display?: boolean;
      beginAtZero?: boolean;
      max?: number;
      title?: {
        display?: boolean;
        text?: string;
      };
    };
  };
  animation?: {
    duration?: number;
    easing?: string;
  };
}

export interface BarriosProgressChartInterface {
  // Propiedades
  canvasId: string;
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  chart: any; // Chart.js instance
  config: BarriosChartConfig;
  state: BarriosChartState;
  
  // Métodos de inicialización
  init(): Promise<void>;
  fusionarConfiguracion(target: any, source: any): any;
  
  // Métodos de carga de datos
  cargarDatos(): Promise<void>;
  obtenerReportes(): Promise<ReporteAPI[]>;
  obtenerProgresoCiclos(): Promise<ProgresoCicloAPI[]>;
  obtenerEstadisticas(): Promise<Record<string, any>>;
  
  // Métodos de validación
  validarDatos(datos: BarriosRawData): string[];
  validarReporte(reporte: ReporteAPI, index: number): string[];
  validarProgresoCiclo(progreso: ProgresoCicloAPI, index: number): string[];
  
  // Métodos de procesamiento
  procesarDatos(): Promise<void>;
  limpiarDatos(datos: BarriosRawData): BarriosRawData;
  normalizarNombreBarrio(nombre: string): string;
  normalizarManzanas(manzanas: string | null): string[];
  agruparPorBarrios(datos: BarriosRawData): Record<string, any>;
  calcularEstadisticasPorBarrio(datosPorBarrio: Record<string, any>): Record<string, BarrioStatistics>;
  
  // Métodos de análisis estadístico
  analizarTendenciaTemporal(reportes: ReporteAPI[]): AnalisisTemporal;
  calcularRegresionLineal(datos: ChartDataPoint[]): RegresionLineal;
  calcularAceleracion(datos: ChartDataPoint[]): number;
  calcularVelocidadProgreso(reportes: ReporteAPI[]): number;
  predecirFinalizacion(progreso: number, velocidad: number, territoriosRestantes: number): PrediccionFinalizacion;
  calcularConfiabilidadBarrio(datos: any): number;
  calcularMargenError(confiabilidad: number, muestras: number): number;
  determinarEstado(progreso: number, velocidad: number): string;
  aplicarCorreccionEstadistica(estadisticas: Record<string, BarrioStatistics>): Record<string, BarrioStatistics>;
  calcularIntervalosConfianza(datos: Record<string, BarrioStatistics>): Record<string, IntervalConfianza>;
  calcularConfiabilidad(datos: Record<string, BarrioStatistics>): number;
  
  // Métodos de renderizado
  renderizar(): Promise<void>;
  prepararDatosVisualizacion(): ChartDataset[];
  configurarGrafica(): ChartOptions;
  aplicarTema(): void;
  
  // Métodos de interacción
  onBarrioClick(barrio: string): void;
  onBarrioHover(barrio: string): void;
  mostrarDetalles(barrio: string): void;
  exportarDatos(): void;
  
  // Métodos de actualización
  actualizar(): Promise<void>;
  actualizarEnTiempoReal(): void;
  invalidarCache(): void;
  
  // Métodos de utilidad
  manejarError(error: Error): void;
  registrarError(mensaje: string, error?: any): void;
  limpiarErrores(): void;
  obtenerEstadoActual(): BarriosChartState;
  
  // Métodos de limpieza
  destruir(): void;
}

// ==========================================
// INTERFACES DE MAPAS
// ==========================================

/**
 * Estado del módulo de mapas
 */
export interface MapState {
  currentMap: any | null;
  currentBarrio: string;
  territories: Territory[];
  reportes: ReporteAPI[];
  selectedTerritories: string[];
  mapContainer: HTMLElement | null;
  svgElement: SVGElement | null;
  territoryRealTimeStatus: Map<string, 'pendiente' | 'trabajada'>;
  cicloActivo: CicloActivo | null;
  progresoBarrio: ProgresoBarrio | null;
  currentCycle: number;
  cycleStartDate: string | null;
  cycleHistory: Map<string, CycleHistoryEntry>;
  isConsultaMode: boolean;
}

/**
 * Territorio del mapa
 */
export interface Territory {
  id: string;
  nombre: string;
  barrio: string;
  estado: 'pendiente' | 'trabajada' | 'completada';
  coordenadas?: string;
  manzanas?: string[];
  ultimaActualizacion?: string;
  reporteId?: string;
}

/**
 * Colores de territorios
 */
export interface TerritoryColors {
  pendiente: TerritoryColor;
  trabajada: TerritoryColor;
}

/**
 * Color específico de territorio
 */
export interface TerritoryColor {
  fill: string;
  stroke: string;
  label: string;
}

/**
 * Colores de selección
 */
export interface SelectionColors {
  selected_new: SelectionColor;
  selected_worked: SelectionColor;
}

/**
 * Color de selección específico
 */
export interface SelectionColor {
  fill: string;
  stroke: string;
  strokeWidth: string;
}

/**
 * Ciclo activo
 */
export interface CicloActivo {
  id: string | number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
  barrio: string;
  progreso?: number;
  descripcion?: string;
}

/**
 * Progreso del barrio
 */
export interface ProgresoBarrio {
  barrio: string;
  totalManzanas: number;
  manzanasCompletadas: number;
  porcentaje: number;
  ultimaActualizacion: string;
  cicloActual?: string;
  reportesTotal?: number;
}

/**
 * Entrada del historial de ciclos
 */
export interface CycleHistoryEntry {
  cycleNumber: number;
  completedDate: string;
  territories: string[];
}

/**
 * Configuración de API de mapas
 */
export interface MapApiConfig {
  base: string;
  endpoints: {
    territorios: string;
    reportes: string;
    ciclos: string;
    progreso: string;
    svg: string;
  };
  timeout: number;
}

/**
 * Datos de territorio desde API
 */
export interface TerritoryApiData {
  id: string;
  nombre: string;
  barrio: string;
  estado: string;
  coordenadas?: string;
  manzanas?: string[];
  ultimaActualizacion?: string;
}

/**
 * Respuesta de envío de reporte
 */
export interface ReporteResponse {
  success: boolean;
  message: string;
  reporteId?: string;
  data?: any;
}

/**
 * Parámetros de URL para mapas
 */
export interface MapUrlParams {
  barrio?: string;
  territorio?: string;
  capitan?: string;
  fecha?: string;
  modo?: 'consulta' | 'reporte';
}

/**
 * Filtros de territorio
 */
export interface TerritoryFilters {
  estado?: 'pendiente' | 'trabajada' | 'completada' | 'todos';
  busqueda?: string;
}

/**
 * Estadísticas del mapa
 */
export interface MapStatistics {
  totalTerritorios: number;
  territoriosPendientes: number;
  territoriosTrabajados: number;
  territoriosCompletados: number;
  porcentajeProgreso: number;
}

/**
 * Configuración de interacciones del mapa
 */
export interface MapInteractionConfig {
  enableSelection: boolean;
  enableMultiSelection: boolean;
  enableTooltips: boolean;
  enableZoom: boolean;
}

/**
 * Evento de territorio
 */
export interface TerritoryEvent {
  type: 'click' | 'hover' | 'select' | 'deselect';
  territory: Territory;
  element: SVGElement;
  coordinates?: { x: number; y: number };
}

/**
 * Interface principal del MapasManager
 */
export interface MapasManagerInterface {
  // Propiedades
  _state: MapState;
  _barrios: string[];
  
  // Métodos de inicialización
  init(): Promise<void>;
  _setupEventListeners(): void;
  _setupModeButtons(): void;
  _getInitialBarrio(): string | null;
  _detectConsultaMode(): void;
  _enableConsultaMode(): void;
  
  // Métodos de gestión de mapas
  loadMap(barrio: string): Promise<void>;
  clearMap(): void;
  refreshMap(): Promise<void>;
  _findValidBarrio(barrio: string): string | null;
  _normalizeBarrioName(barrio: string): string;
  _loadSVGFile(barrio: string): Promise<string>;
  _renderMap(svgContent: string): void;
  
  // Métodos de datos
  _loadTerritoryData(barrio: string): Promise<void>;
  _loadBarrioReportes(barrio: string): Promise<ReporteAPI[]>;
  _loadCicloActivo(barrio: string): Promise<CicloActivo | null>;
  _loadProgresoBarrio(barrio: string): Promise<ProgresoBarrio | null>;
  
  // Métodos de interacción
  _setupMapInteractions(): void;
  _handleTerritoryClick(event: Event): void;
  _handleTerritoryHover(event: Event): void;
  selectTerritory(territoryId: string): void;
  deselectTerritory(territoryId: string): void;
  clearSelection(): void;
  
  // Métodos de estilos
  _applyTerritoryStyles(): void;
  _updateTerritorySelection(): void;
  _applyTerritoryFilters(): void;
  _analyzeBasicTerritoryStatus(barrio: string): void;
  
  // Métodos de reportes
  sendReporteToBackend(): Promise<void>;
  _prepareReporteData(): any;
  _validateReporteData(data: any): boolean;
  
  // Métodos de utilidad
  _showSelectedTerritories(): void;
  _showBarrioProgressCleanArchitecture(): void;
  _updateMapStatistics(): void;
  getSelectedTerritories(): string[];
  getCurrentBarrio(): string;
  getTerritoryById(id: string): Territory | null;
  
  // Métodos públicos
  setBarrio(barrio: string): Promise<void>;
  getMapStatistics(): MapStatistics;
  exportMapData(): any;
}

// ==========================================
// INTERFACES DE MAPAS-CONSULTA
// ==========================================

/**
 * Filtros de consulta
 */
export interface ConsultaFilters {
  barrio: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  capitan: string;
  territorio: string;
}

/**
 * Estado del módulo de consultas
 */
export interface ConsultaState {
  currentFilters: ConsultaFilters;
  reportes: ReporteAPI[];
  salidas: SalidaAPI[];
  capitanes: Capitan[];
  resultados: ConsultaResultado[];
  isLoading: boolean;
}

/**
 * Resultado de consulta unificado
 */
export interface ConsultaResultado {
  tipo: 'reporte' | 'salida';
  id: string | number;
  fecha: string | null;
  barrio: string;
  territorio: string | null;
  persona: string;
  estado: string;
  data: ReporteAPI | SalidaAPI;
}

/**
 * Validación de filtros
 */
export interface FilterValidation {
  isValid: boolean;
  message?: string;
}

/**
 * Estadísticas de búsqueda
 */
export interface SearchStats {
  total: number;
  reportes: number;
  salidas: number;
  barrios: number;
  territorios: number;
}

/**
 * Datos para exportación
 */
export interface ExportData {
  Tipo: string;
  Barrio: string;
  Territorio: string;
  Persona: string;
  Estado: string;
  Fecha?: string;
  Día?: string;
  Hora?: string;
}

/**
 * Interfaz del MapasConsultaManager
 */
export interface MapasConsultaManagerInterface {
  // Estado interno
  _state: ConsultaState;
  
  // Métodos de inicialización
  init(): Promise<void>;
  _setupEventListeners(): void;
  _loadInitialData(): Promise<void>;
  _loadCapitanes(): Promise<Capitan[]>;
  _setupFilters(): void;
  _setupDefaultDates(): void;
  
  // Gestión de filtros
  _getCurrentFilters(): ConsultaFilters;
  _applyFilters(filters: ConsultaFilters): void;
  clearFilters(): void;
  
  // Búsqueda y consultas
  executeSearch(): Promise<void>;
  _validateFilters(filters: ConsultaFilters): FilterValidation;
  _searchReportes(filters: ConsultaFilters): Promise<ReporteAPI[]>;
  _searchSalidas(filters: ConsultaFilters): Promise<SalidaAPI[]>;
  _processSearchResults(reportes: ReporteAPI[], salidas: SalidaAPI[], filters: ConsultaFilters): ConsultaResultado[];
  
  // Visualización de resultados
  _displayResults(resultados: ConsultaResultado[]): void;
  _createResultCard(resultado: ConsultaResultado): string;
  _updateSearchStats(resultados: ConsultaResultado[]): void;
  
  // Utilidades
  _populateBarriosSelector(): void;
  _populateCapitanesSelector(): void;
  _getEstadoBadgeClass(estado: string): string;
  _showLoadingState(): void;
  _hideLoadingState(): void;
  _clearResults(): void;
  
  // Métodos públicos
  viewDetails(tipo: 'reporte' | 'salida', id: string | number): void;
  showInMap(barrio: string, territorio: string): Promise<void>;
  exportResults(): Promise<void>;
  _downloadCSV(data: ExportData[], filename: string): void;
  toggleViewMode(): void;
}



/**
 * Estado interno del módulo de mapas
 */
export interface MapState {
  currentMap: any;
  currentBarrio: string;
  territories: Territory[];
  reportes: ReporteAPI[];
  selectedTerritories: string[];
  mapContainer: HTMLElement | null;
  svgElement: SVGElement | null;
  territoryRealTimeStatus: Map<string, 'pendiente' | 'trabajada'>;
  cicloActivo: CicloActivo | null;
  progresoBarrio: ProgresoBarrio | null;
  currentCycle: number;
  cycleStartDate: string | null;
  cycleHistory: Map<string, CycleHistoryEntry>;
  isConsultaMode: boolean;
}

/**
 * Territorio individual
 */
export interface Territory {
  id: string;
  nombre: string;
  barrio: string;
  estado: 'pendiente' | 'trabajada' | 'completada';
  coordenadas?: string;
  manzanas?: string[];
  ultimaActualizacion?: string;
  element?: SVGElement;
  isSelected?: boolean;
}



/**
 * Entrada del historial de ciclos
 */
export interface CycleHistoryEntry {
  cycleNumber: number;
  completedDate: string;
  territories: string[];
}

/**
 * Estadísticas de territorios
 */
export interface TerritoryStats {
  total: number;
  trabajadas: number;
  pendientes: number;
  porcentajeCompletado: number;
}

/**
 * Configuración del Dashboard de Monitoreo
 */
export interface MonitoringConfig {
  apiBaseUrl: string;
  refreshInterval: number;
  autoRefreshEnabled: boolean;
  alertThresholds: AlertThresholds;
}

/**
 * Umbrales de alerta
 */
export interface AlertThresholds {
  responseTime: number; // ms
  memoryUsage: number; // %
  errorRate: number; // %
  cacheHitRate: number; // %
}

/**
 * Datos de salud del sistema
 */
export interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: HealthCheck[];
  uptime: number;
  version: string;
}

/**
 * Verificación de salud individual
 */
export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration?: number;
}

/**
 * Datos de métricas del sistema
 */
export interface MetricsData {
  timestamp: string;
  metrics: SystemMetrics;
}

/**
 * Métricas del sistema
 */
export interface SystemMetrics {
  requests: RequestMetrics;
  performance: PerformanceMetrics;
  system: SystemInfo;
  cache: CacheMetrics;
  business: BusinessMetrics;
}

/**
 * Métricas de requests
 */
export interface RequestMetrics {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  perSecond: number;
  perMinute: number;
}

/**
 * Métricas de rendimiento
 */
export interface PerformanceMetrics {
  responseTime: {
    avg: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  };
  throughput: number;
  errorRate: number;
}

/**
 * Información del sistema
 */
export interface SystemInfo {
  uptime: number;
  memory: MemoryInfo;
  cpu: CpuInfo;
  nodeVersion: string;
  platform: string;
  pid: number;
}

/**
 * Información de memoria
 */
export interface MemoryInfo {
  used: number;
  total: number;
  free: number;
  percentage: number;
}

/**
 * Información de CPU
 */
export interface CpuInfo {
  usage: number;
  loadAverage: number[];
}

/**
 * Métricas de cache
 */
export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
}

/**
 * Métricas de negocio
 */
export interface BusinessMetrics {
  reportesCreados: number;
  ciclosCompletados: number;
  barriosActivos: number;
  capitanesActivos: number;
}

/**
 * Datos de estado del sistema
 */
export interface StatusData {
  version: string;
  environment: string;
  system: SystemInfo;
  timestamp: string;
}

/**
 * Alerta del sistema
 */
export interface SystemAlert {
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  metric?: string;
  value?: number;
  threshold?: number;
}

/**
 * Configuración de gráficos
 */
export interface ChartConfig {
  type: 'line' | 'bar' | 'doughnut';
  data: ChartData;
  options: ChartOptions;
}

/**
 * Estado del dashboard de monitoreo
 */
export interface MonitoringState {
  isLoading: boolean;
  lastUpdate: Date | null;
  autoRefreshEnabled: boolean;
  refreshTimer: NodeJS.Timeout | null;
  charts: Record<string, any>;
  previousData: Record<string, number>;
  alerts: SystemAlert[];
}

/**
 * Interfaz del MonitoringDashboard
 */
export interface MonitoringDashboardInterface {
  // Propiedades
  apiBaseUrl: string;
  refreshInterval: number;
  autoRefreshEnabled: boolean;
  charts: Record<string, any>;
  previousData: Record<string, number>;
  alertThresholds: AlertThresholds;
  refreshTimer?: NodeJS.Timeout;

  // Métodos de inicialización
  init(): Promise<void>;
  setupEventListeners(): void;
  setupAutoRefresh(): void;
  initializeCharts(): void;

  // Métodos de datos
  refreshData(): Promise<void>;
  fetchHealthData(): Promise<HealthData>;
  fetchMetricsData(): Promise<MetricsData>;
  fetchStatusData(): Promise<StatusData>;

  // Métodos de actualización de UI
  updateSystemStatus(healthData: HealthData): void;
  updateMetrics(data: MetricsData): void;
  updateMetricCard(valueId: string, value: number, unit: string, progressId: string, progressPercent: number): void;
  updateBusinessMetrics(business: BusinessMetrics): void;
  updateSystemInfo(statusData: StatusData): void;
  updateCharts(data: MetricsData): void;
  updateChart(chart: any, label: string, value: number, maxPoints: number): void;

  // Métodos de alertas
  checkAlerts(data: MetricsData): void;
  updateAlerts(alerts: SystemAlert[]): void;

  // Métodos de utilidad
  calculateRequestsPerSecond(requests: RequestMetrics): number;
  calculateMemoryUsagePercentage(memory: MemoryInfo): number;
  setLoadingState(loading: boolean): void;
  showError(message: string): void;
}

/**
 * Interfaz completa del MapasManager
 */
export interface MapasManagerInterface {
  // Estado interno
  _state: MapState;
  _barrios: string[];
  
  // Métodos de inicialización
  init(): Promise<void>;
  _setupEventListeners(): void;
  _setupModeButtons(): void;
  _getInitialBarrio(): string | null;
  _detectConsultaMode(): void;
  _enableConsultaMode(): void;
  
  // Métodos de carga de datos
  _loadSVGFile(barrio: string): Promise<string>;
  _loadBarrioReportes(barrio: string): Promise<ReporteAPI[]>;
  _loadCicloActivo(barrio: string): Promise<CicloActivo | null>;
  _loadProgresoBarrio(barrio: string): Promise<ProgresoBarrio | null>;
  
  // Métodos de gestión de mapas
  loadMap(barrio: string): Promise<void>;
  refreshMap(): Promise<void>;
  clearMap(): void;
  _findValidBarrio(barrio: string): string | null;
  _normalizeBarrioName(barrio: string): string;
  _renderMap(svgContent: string): void;
  _loadTerritoryData(barrio: string): Promise<void>;
  _setupMapInteractions(): void;
  _handleTerritoryClick(event: Event): void;
  _handleTerritoryHover(event: Event): void;
  
  // Métodos de interacciones y colores
  _applyTerritoryStyles(): void;
  _updateTerritorySelection(): void;
  _applyTerritoryFilters(): void;
  _analyzeBasicTerritoryStatus(barrio: string): void;
  _showSelectedTerritories(): void;
  _showBarrioProgressCleanArchitecture(): void;
  _updateMapStatistics(): void;
  _prepareReporteData(): any;
  _validateReporteData(data: any): boolean;
  
  // Métodos de gestión de reportes
  sendReporteToBackend(): Promise<void>;
  
  // Métodos públicos
  getSelectedTerritories(): string[];
  getCurrentBarrio(): string;
  getTerritoryById(id: string): Territory | null;
  setBarrio(barrio: string): Promise<void>;
  getMapStatistics(): MapStatistics;
  exportMapData(): any;
  selectTerritory(territoryId: string): void;
  deselectTerritory(territoryId: string): void;
  clearSelection(): void;
}
