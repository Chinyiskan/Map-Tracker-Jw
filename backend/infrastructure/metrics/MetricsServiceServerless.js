// backend/infrastructure/metrics/MetricsServiceServerless.js
// Versión simplificada del MetricsService compatible con Vercel

import { performance } from 'perf_hooks';

/**
 * Servicio de Métricas Serverless
 * Versión simplificada sin dependencias de winston para compatibilidad con Vercel
 */
export class MetricsServiceServerless {
  constructor(options = {}) {
    this.serviceName = options.serviceName || 'map-tracker';
    this.retentionPeriod = options.retentionPeriod || 86400000; // 24 horas
    
    // Almacenamiento de métricas en memoria (se reinicia en cada función)
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.timers = new Map();
    
    // Métricas de sistema simplificadas
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
    
    // Solo log en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 MetricsServiceServerless inicializado');
    }
  }
  
  /**
   * Incrementar contador
   */
  incrementCounter(name, value = 1, labels = {}) {
    const key = this._createKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
    
    // Solo log en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Counter ${name}: ${current + value}`);
    }
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
    
    // Mantener solo los últimos 100 valores para evitar problemas de memoria
    if (histogram.values.length > 100) {
      histogram.values = histogram.values.slice(-100);
    }
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
      return null;
    }
    
    const duration = performance.now() - timer.startTime;
    this.recordHistogram(timer.name, duration, timer.labels);
    this.timers.delete(timerId);
    
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
    
    // Tiempo de respuesta (mantener solo los últimos 50)
    this.systemMetrics.performance.responseTime.push({
      value: duration,
      timestamp: Date.now(),
      method,
      path,
      statusCode
    });
    
    if (this.systemMetrics.performance.responseTime.length > 50) {
      this.systemMetrics.performance.responseTime = 
        this.systemMetrics.performance.responseTime.slice(-50);
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
    
    this.incrementCounter('db_queries_total', 1, { operation, table, success: success.toString() });
    this.recordHistogram('db_query_duration_ms', duration, { operation, table });
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
    
    this.incrementCounter('cache_operations_total', 1, { operation, hit: hit?.toString() || 'null' });
    
    if (duration !== null) {
      this.recordHistogram('cache_operation_duration_ms', duration, { operation });
    }
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
  }
  
  /**
   * Actualizar métricas de sistema
   */
  updateSystemMetrics() {
    const memUsage = process.memoryUsage();
    
    // Memoria
    this.setGauge('system_memory_rss_bytes', memUsage.rss);
    this.setGauge('system_memory_heap_used_bytes', memUsage.heapUsed);
    this.setGauge('system_memory_heap_total_bytes', memUsage.heapTotal);
    this.setGauge('system_memory_external_bytes', memUsage.external);
    
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
          max: recentResponseTimes.length > 0 ? Math.max(...recentResponseTimes).toFixed(2) : 0
        },
        database: {
          queries: this.systemMetrics.database.queries,
          errors: this.systemMetrics.database.errors,
          slowQueries: this.systemMetrics.database.slowQueries
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
        memory: process.memoryUsage()
      }
    };
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

// Crear instancia según el entorno
let metricsService;

if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  // Usar versión serverless en Vercel
  metricsService = new MetricsServiceServerless({
    serviceName: 'map-tracker-jw',
    retentionPeriod: 3600000 // 1 hora en serverless
  });
} else {
  // Usar versión completa en desarrollo
  try {
    const { MetricsService } = await import('./MetricsService.js');
    metricsService = new MetricsService({
      serviceName: 'map-tracker-jw',
      retentionPeriod: 86400000 // 24 horas
    });
  } catch (error) {
    // Fallback a versión serverless si hay problemas
    console.warn('⚠️ Fallback a MetricsServiceServerless:', error.message);
    metricsService = new MetricsServiceServerless({
      serviceName: 'map-tracker-jw',
      retentionPeriod: 3600000
    });
  }
}

export default metricsService;