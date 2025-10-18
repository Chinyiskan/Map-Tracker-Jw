// backend/infrastructure/metrics/MetricsService.js
// Sistema de métricas para observabilidad y monitoreo

import { performance } from 'perf_hooks';
import loggingService from '../logging/LoggingService.js';

/**
 * Servicio de Métricas
 * Recopila, almacena y expone métricas del sistema, performance y negocio
 */
export class MetricsService {
  constructor(options = {}) {
    this.serviceName = options.serviceName || 'map-tracker';
    this.retentionPeriod = options.retentionPeriod || 86400000; // 24 horas
    
    // Almacenamiento de métricas
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.timers = new Map();
    
    // Métricas de sistema
    this.systemMetrics = {
      requests: {
        total: 0,
        success: 0,
        error: 0,
        byMethod: new Map(),
        byStatus: new Map()
      },
      performance: {
        responseTime: [],
        dbQueries: [],
        cacheOperations: []
      },
      business: {
        reportesCreados: 0,
        ciclosCompletados: 0,
        barriosActivos: new Set(),
        capitanesActivos: new Set()
      },
      cache: {
        hits: 0,
        misses: 0,
        evictions: 0,
        size: 0
      },
      database: {
        connections: 0,
        queries: 0,
        errors: 0,
        slowQueries: 0
      }
    };
    
    // Inicializar métricas de sistema
    this._initializeSystemMetrics();
    
    // Cleanup automático
    setInterval(() => this._cleanup(), 300000); // 5 minutos
    
    loggingService.info('MetricsService inicializado', {
      serviceName: this.serviceName,
      retentionPeriod: this.retentionPeriod
    });
  }
  
  /**
   * Incrementar contador
   */
  incrementCounter(name, value = 1, labels = {}) {
    const key = this._createKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
    
    loggingService.metrics(name, current + value, 'count', { labels });
  }
  
  /**
   * Establecer gauge (valor actual)
   */
  setGauge(name, value, labels = {}) {
    const key = this._createKey(name, labels);
    this.gauges.set(key, {
      value,
      timestamp: Date.now(),
      labels
    });
    
    loggingService.metrics(name, value, 'gauge', { labels });
  }
  
  /**
   * Registrar valor en histograma
   */
  recordHistogram(name, value, labels = {}) {
    const key = this._createKey(name, labels);
    
    if (!this.histograms.has(key)) {
      this.histograms.set(key, {
        values: [],
        labels,
        created: Date.now()
      });
    }
    
    const histogram = this.histograms.get(key);
    histogram.values.push({
      value,
      timestamp: Date.now()
    });
    
    // Mantener solo los últimos 1000 valores
    if (histogram.values.length > 1000) {
      histogram.values = histogram.values.slice(-1000);
    }
    
    loggingService.metrics(name, value, 'histogram', { labels });
  }
  
  /**
   * Iniciar timer
   */
  startTimer(name, labels = {}) {
    const timerId = `${name}_${Date.now()}_${Math.random()}`;
    const key = this._createKey(name, labels);
    
    this.timers.set(timerId, {
      name,
      key,
      labels,
      startTime: performance.now()
    });
    
    return timerId;
  }
  
  /**
   * Finalizar timer y registrar duración
   */
  endTimer(timerId) {
    const timer = this.timers.get(timerId);
    
    if (!timer) {
      loggingService.warn('Timer no encontrado', { timerId });
      return null;
    }
    
    const duration = performance.now() - timer.startTime;
    this.recordHistogram(timer.name, duration, timer.labels);
    this.timers.delete(timerId);
    
    loggingService.performance(timer.name, duration, timer.labels);
    
    return duration;
  }
  
  /**
   * Métricas de requests HTTP
   */
  recordRequest(method, path, statusCode, duration) {
    // Incrementar contadores
    this.systemMetrics.requests.total++;
    
    if (statusCode >= 200 && statusCode < 400) {
      this.systemMetrics.requests.success++;
    } else {
      this.systemMetrics.requests.error++;
    }
    
    // Por método
    const methodCount = this.systemMetrics.requests.byMethod.get(method) || 0;
    this.systemMetrics.requests.byMethod.set(method, methodCount + 1);
    
    // Por status
    const statusCount = this.systemMetrics.requests.byStatus.get(statusCode) || 0;
    this.systemMetrics.requests.byStatus.set(statusCode, statusCount + 1);
    
    // Tiempo de respuesta
    this.systemMetrics.performance.responseTime.push({
      value: duration,
      timestamp: Date.now(),
      method,
      path,
      statusCode
    });
    
    // Mantener solo los últimos 1000 registros
    if (this.systemMetrics.performance.responseTime.length > 1000) {
      this.systemMetrics.performance.responseTime = 
        this.systemMetrics.performance.responseTime.slice(-1000);
    }
    
    // Registrar métricas
    this.incrementCounter('http_requests_total', 1, { method, status: statusCode.toString() });
    this.recordHistogram('http_request_duration_ms', duration, { method, path });
  }
  
  /**
   * Métricas de base de datos
   */
  recordDatabaseQuery(operation, table, duration, success = true) {
    this.systemMetrics.database.queries++;
    
    if (!success) {
      this.systemMetrics.database.errors++;
    }
    
    if (duration > 1000) { // Consultas lentas > 1s
      this.systemMetrics.database.slowQueries++;
    }
    
    this.systemMetrics.performance.dbQueries.push({
      operation,
      table,
      duration,
      success,
      timestamp: Date.now()
    });
    
    // Mantener solo los últimos 500 registros
    if (this.systemMetrics.performance.dbQueries.length > 500) {
      this.systemMetrics.performance.dbQueries = 
        this.systemMetrics.performance.dbQueries.slice(-500);
    }
    
    this.incrementCounter('db_queries_total', 1, { operation, table, success: success.toString() });
    this.recordHistogram('db_query_duration_ms', duration, { operation, table });
    
    loggingService.database(operation, table, duration, { success });
  }
  
  /**
   * Métricas de cache
   */
  recordCacheOperation(operation, key, hit = null, duration = null) {
    if (hit === true) {
      this.systemMetrics.cache.hits++;
    } else if (hit === false) {
      this.systemMetrics.cache.misses++;
    }
    
    if (operation === 'evict') {
      this.systemMetrics.cache.evictions++;
    }
    
    this.systemMetrics.performance.cacheOperations.push({
      operation,
      key,
      hit,
      duration,
      timestamp: Date.now()
    });
    
    // Mantener solo los últimos 500 registros
    if (this.systemMetrics.performance.cacheOperations.length > 500) {
      this.systemMetrics.performance.cacheOperations = 
        this.systemMetrics.performance.cacheOperations.slice(-500);
    }
    
    this.incrementCounter('cache_operations_total', 1, { operation, hit: hit?.toString() || 'null' });
    
    if (duration !== null) {
      this.recordHistogram('cache_operation_duration_ms', duration, { operation });
    }
    
    loggingService.cache(operation, key, hit, { duration });
  }
  
  /**
   * Métricas de negocio
   */
  recordBusinessEvent(event, data = {}) {
    switch (event) {
      case 'reporte_creado':
        this.systemMetrics.business.reportesCreados++;
        if (data.barrio) {
          this.systemMetrics.business.barriosActivos.add(data.barrio);
        }
        if (data.capitan) {
          this.systemMetrics.business.capitanesActivos.add(data.capitan);
        }
        break;
        
      case 'ciclo_completado':
        this.systemMetrics.business.ciclosCompletados++;
        break;
    }
    
    this.incrementCounter('business_events_total', 1, { event });
    loggingService.business(event, data);
  }
  
  /**
   * Actualizar métricas de sistema
   */
  updateSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Memoria
    this.setGauge('system_memory_rss_bytes', memUsage.rss);
    this.setGauge('system_memory_heap_used_bytes', memUsage.heapUsed);
    this.setGauge('system_memory_heap_total_bytes', memUsage.heapTotal);
    this.setGauge('system_memory_external_bytes', memUsage.external);
    
    // CPU
    this.setGauge('system_cpu_user_microseconds', cpuUsage.user);
    this.setGauge('system_cpu_system_microseconds', cpuUsage.system);
    
    // Uptime
    this.setGauge('system_uptime_seconds', process.uptime());
    
    // Cache size
    this.setGauge('cache_size_entries', this.systemMetrics.cache.size);
    
    // Conexiones de DB
    this.setGauge('db_connections_active', this.systemMetrics.database.connections);
  }
  
  /**
   * Obtener resumen de métricas
   */
  getSummary() {
    this.updateSystemMetrics();
    
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    // Calcular métricas de la última hora
    const recentResponseTimes = this.systemMetrics.performance.responseTime
      .filter(r => r.timestamp > oneHourAgo)
      .map(r => r.value);
    
    const recentDbQueries = this.systemMetrics.performance.dbQueries
      .filter(q => q.timestamp > oneHourAgo);
    
    return {
      timestamp: now,
      requests: {
        total: this.systemMetrics.requests.total,
        success: this.systemMetrics.requests.success,
        error: this.systemMetrics.requests.error,
        successRate: this.systemMetrics.requests.total > 0 
          ? (this.systemMetrics.requests.success / this.systemMetrics.requests.total * 100).toFixed(2)
          : 0,
        byMethod: Object.fromEntries(this.systemMetrics.requests.byMethod),
        byStatus: Object.fromEntries(this.systemMetrics.requests.byStatus)
      },
      performance: {
        responseTime: {
          count: recentResponseTimes.length,
          avg: recentResponseTimes.length > 0 
            ? (recentResponseTimes.reduce((a, b) => a + b, 0) / recentResponseTimes.length).toFixed(2)
            : 0,
          min: recentResponseTimes.length > 0 ? Math.min(...recentResponseTimes).toFixed(2) : 0,
          max: recentResponseTimes.length > 0 ? Math.max(...recentResponseTimes).toFixed(2) : 0,
          p95: this._calculatePercentile(recentResponseTimes, 95)
        },
        database: {
          queries: recentDbQueries.length,
          errors: recentDbQueries.filter(q => !q.success).length,
          slowQueries: recentDbQueries.filter(q => q.duration > 1000).length,
          avgDuration: recentDbQueries.length > 0
            ? (recentDbQueries.reduce((sum, q) => sum + q.duration, 0) / recentDbQueries.length).toFixed(2)
            : 0
        }
      },
      cache: {
        hits: this.systemMetrics.cache.hits,
        misses: this.systemMetrics.cache.misses,
        hitRate: (this.systemMetrics.cache.hits + this.systemMetrics.cache.misses) > 0
          ? (this.systemMetrics.cache.hits / (this.systemMetrics.cache.hits + this.systemMetrics.cache.misses) * 100).toFixed(2)
          : 0,
        evictions: this.systemMetrics.cache.evictions,
        size: this.systemMetrics.cache.size
      },
      business: {
        reportesCreados: this.systemMetrics.business.reportesCreados,
        ciclosCompletados: this.systemMetrics.business.ciclosCompletados,
        barriosActivos: this.systemMetrics.business.barriosActivos.size,
        capitanesActivos: this.systemMetrics.business.capitanesActivos.size
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    };
  }
  
  /**
   * Obtener métricas en formato Prometheus
   */
  getPrometheusMetrics() {
    const summary = this.getSummary();
    let output = [];
    
    // Requests
    output.push(`# HELP http_requests_total Total number of HTTP requests`);
    output.push(`# TYPE http_requests_total counter`);
    output.push(`http_requests_total ${summary.requests.total}`);
    
    output.push(`# HELP http_requests_success_total Total number of successful HTTP requests`);
    output.push(`# TYPE http_requests_success_total counter`);
    output.push(`http_requests_success_total ${summary.requests.success}`);
    
    // Response time
    output.push(`# HELP http_request_duration_ms HTTP request duration in milliseconds`);
    output.push(`# TYPE http_request_duration_ms histogram`);
    output.push(`http_request_duration_ms_avg ${summary.performance.responseTime.avg}`);
    output.push(`http_request_duration_ms_max ${summary.performance.responseTime.max}`);
    
    // Cache
    output.push(`# HELP cache_hits_total Total number of cache hits`);
    output.push(`# TYPE cache_hits_total counter`);
    output.push(`cache_hits_total ${summary.cache.hits}`);
    
    output.push(`# HELP cache_hit_rate Cache hit rate percentage`);
    output.push(`# TYPE cache_hit_rate gauge`);
    output.push(`cache_hit_rate ${summary.cache.hitRate}`);
    
    // Memory
    output.push(`# HELP process_memory_rss_bytes Resident Set Size memory`);
    output.push(`# TYPE process_memory_rss_bytes gauge`);
    output.push(`process_memory_rss_bytes ${summary.system.memory.rss}`);
    
    // Business metrics
    output.push(`# HELP business_reportes_created_total Total number of reports created`);
    output.push(`# TYPE business_reportes_created_total counter`);
    output.push(`business_reportes_created_total ${summary.business.reportesCreados}`);
    
    return output.join('\n');
  }
  
  /**
   * Crear clave única para métrica con labels
   * @private
   */
  _createKey(name, labels = {}) {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    
    return labelStr ? `${name}{${labelStr}}` : name;
  }
  
  /**
   * Calcular percentil
   * @private
   */
  _calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    
    return sorted[index]?.toFixed(2) || 0;
  }
  
  /**
   * Inicializar métricas de sistema
   * @private
   */
  _initializeSystemMetrics() {
    // Actualizar métricas de sistema cada 30 segundos
    setInterval(() => {
      this.updateSystemMetrics();
    }, 30000);
    
    // Métricas iniciales
    this.updateSystemMetrics();
  }
  
  /**
   * Limpiar métricas antiguas
   * @private
   */
  _cleanup() {
    const now = Date.now();
    const cutoff = now - this.retentionPeriod;
    
    // Limpiar histogramas
    for (const [key, histogram] of this.histograms.entries()) {
      histogram.values = histogram.values.filter(v => v.timestamp > cutoff);
      
      if (histogram.values.length === 0 && histogram.created < cutoff) {
        this.histograms.delete(key);
      }
    }
    
    // Limpiar timers antiguos
    for (const [timerId, timer] of this.timers.entries()) {
      if (timer.startTime < cutoff) {
        this.timers.delete(timerId);
      }
    }
    
    loggingService.debug('Métricas limpiadas', {
      histograms: this.histograms.size,
      timers: this.timers.size
    });
  }
  
  /**
   * Reset de métricas (para testing)
   */
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.timers.clear();
    
    // Reset métricas de sistema
    this.systemMetrics = {
      requests: {
        total: 0,
        success: 0,
        error: 0,
        byMethod: new Map(),
        byStatus: new Map()
      },
      performance: {
        responseTime: [],
        dbQueries: [],
        cacheOperations: []
      },
      business: {
        reportesCreados: 0,
        ciclosCompletados: 0,
        barriosActivos: new Set(),
        capitanesActivos: new Set()
      },
      cache: {
        hits: 0,
        misses: 0,
        evictions: 0,
        size: 0
      },
      database: {
        connections: 0,
        queries: 0,
        errors: 0,
        slowQueries: 0
      }
    };
  }
}

// Instancia singleton del servicio de métricas
const metricsService = new MetricsService({
  serviceName: 'map-tracker-jw',
  retentionPeriod: 86400000 // 24 horas
});

export default metricsService;