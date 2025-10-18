// backend/infrastructure/middleware/metricsMiddleware.js
// OPTIMIZACIÓN SPRINT 3: Middleware de Métricas Automáticas

import metricsService from '../metrics/MetricsServiceServerless.js';
import { performance } from 'perf_hooks';

/**
 * Middleware para registrar métricas automáticamente
 * Registra todas las requests HTTP con tiempos de respuesta
 */
export function metricsMiddleware(req, res, next) {
  // Marcar inicio del request
  const startTime = performance.now();
  req.startTime = startTime;
  
  // Interceptar el final de la respuesta
  const originalEnd = res.end;
  const originalJson = res.json;
  
  // Función para registrar métricas
  const recordMetrics = () => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    const method = req.method;
    const path = req.route?.path || req.path;
    const statusCode = res.statusCode;
    
    // Registrar métricas en el servicio
    metricsService.recordRequest(method, path, statusCode, duration);
    
    // Log detallado para debugging
    if (duration > 1000) { // Requests lentos > 1s
      console.log(`🐌 Request lento detectado: ${method} ${path} - ${duration.toFixed(2)}ms - Status: ${statusCode}`);
    }
    
    // Registrar métricas de negocio específicas
    if (path.includes('/reportes') && method === 'POST' && statusCode < 400) {
      metricsService.recordBusinessEvent('reporte_creado', {
        barrio: req.body?.barrio,
        capitan: req.body?.nombre_capitan
      });
    }
    
    if (path.includes('/ciclos') && path.includes('/completar') && method === 'PUT' && statusCode < 400) {
      metricsService.recordBusinessEvent('ciclo_completado', {
        barrio: req.params?.barrio
      });
    }
  };
  
  // Sobrescribir res.end
  res.end = function(chunk, encoding) {
    recordMetrics();
    originalEnd.call(this, chunk, encoding);
  };
  
  // Sobrescribir res.json
  res.json = function(data) {
    recordMetrics();
    return originalJson.call(this, data);
  };
  
  // Continuar con el siguiente middleware
  next();
}

/**
 * Middleware específico para métricas de base de datos
 * Se puede usar en repositorios o servicios
 */
export function databaseMetricsWrapper(operation, table) {
  return async function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const startTime = performance.now();
      let success = true;
      
      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } catch (error) {
        success = false;
        throw error;
      } finally {
        const duration = performance.now() - startTime;
        metricsService.recordDatabaseQuery(operation, table, duration, success);
      }
    };
    
    return descriptor;
  };
}

/**
 * Middleware para métricas de caché
 */
export function cacheMetricsWrapper(cacheService) {
  const originalGet = cacheService.get;
  const originalSet = cacheService.set;
  const originalDelete = cacheService.delete;
  
  // Wrapper para get
  cacheService.get = function(key) {
    const startTime = performance.now();
    const result = originalGet.call(this, key);
    const duration = performance.now() - startTime;
    const hit = result !== null;
    
    metricsService.recordCacheOperation('get', key, hit, duration);
    
    return result;
  };
  
  // Wrapper para set
  cacheService.set = function(key, value, ttl) {
    const startTime = performance.now();
    const result = originalSet.call(this, key, value, ttl);
    const duration = performance.now() - startTime;
    
    metricsService.recordCacheOperation('set', key, null, duration);
    
    return result;
  };
  
  // Wrapper para delete
  cacheService.delete = function(key) {
    const startTime = performance.now();
    const result = originalDelete.call(this, key);
    const duration = performance.now() - startTime;
    
    metricsService.recordCacheOperation('delete', key, null, duration);
    
    return result;
  };
  
  return cacheService;
}

/**
 * Función helper para registrar métricas personalizadas
 */
export function recordCustomMetric(name, value, labels = {}) {
  metricsService.incrementCounter(name, value, labels);
}

/**
 * Función helper para medir tiempo de ejecución
 */
export function measureExecutionTime(name, labels = {}) {
  const timerId = metricsService.startTimer(name, labels);
  
  return {
    end: () => metricsService.endTimer(timerId)
  };
}

/**
 * Middleware para logging de métricas en desarrollo
 */
export function metricsLoggingMiddleware(req, res, next) {
  if (process.env.NODE_ENV === 'development') {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const method = req.method;
      const path = req.path;
      const statusCode = res.statusCode;
      
      console.log(`📊 Métrica: ${method} ${path} - ${duration}ms - ${statusCode}`);
    });
  }
  
  next();
}

export default {
  metricsMiddleware,
  databaseMetricsWrapper,
  cacheMetricsWrapper,
  recordCustomMetric,
  measureExecutionTime,
  metricsLoggingMiddleware
};