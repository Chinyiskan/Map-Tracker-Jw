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

export interface PerformanceMetrics {
  responseTime: {
    avg: number;
    min: number;
    max: number;
    p95: number;
  };
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

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: ChartPlugins;
  scales?: ChartScales;
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

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'status';
  config: WidgetConfig;
  data?: any;
}

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