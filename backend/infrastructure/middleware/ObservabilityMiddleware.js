// @ts-check
// backend/infrastructure/middleware/ObservabilityMiddleware.js
// Middleware para integrar logging y métricas automáticamente

import { v4 as uuidv4 } from 'uuid';
import { performance } from 'perf_hooks';
import loggingService from '../logging/LoggingService.js';
import metricsService from '../metrics/MetricsService.js';

/**
 * Middleware de Observabilidad
 * Integra automáticamente logging y métricas en todas las requests
 */
export class ObservabilityMiddleware {
  constructor(options = {}) {
    this.excludePaths = options.excludePaths || ['/health', '/metrics', '/favicon.ico'];
    this.slowRequestThreshold = options.slowRequestThreshold || 1000; // 1 segundo
    this.enableDetailedLogging = options.enableDetailedLogging !== false;
    
    console.log('🔍 ObservabilityMiddleware inicializado');
  }
  
  /**
   * Middleware principal para Express
   */
  middleware() {
    return (req, res, next) => {
      // Generar ID único para la request
      const requestId = uuidv4();
      req.requestId = requestId;
      
      // Añadir headers de tracing
      res.setHeader('X-Request-ID', requestId);
      
      // Verificar si debe ser excluida
      if (this._shouldExclude(req.path)) {
        return next();
      }
      
      // Inicializar tracking
      const startTime = performance.now();
      const startTimestamp = Date.now();
      
      // Crear logger contextual
      const logger = loggingService.child({
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: this._getClientIP(req)
      });
      
      // Añadir logger a la request
      req.logger = logger;
      
      // Log de inicio de request
      loggingService.startRequest(requestId, req.method, req.url, {
        userAgent: req.get('User-Agent'),
        ip: this._getClientIP(req),
        contentLength: req.get('Content-Length'),
        referer: req.get('Referer')
      });
      
      // Interceptar el final de la response
      const originalSend = res.send;
      const originalJson = res.json;
      
      res.send = function(data) {
        res.send = originalSend;
        return originalSend.call(this, data);
      };
      
      res.json = function(data) {
        res.json = originalJson;
        return originalJson.call(this, data);
      };
      
      // Manejar el final de la response
      res.on('finish', () => {
        const duration = performance.now() - startTime;
        const statusCode = res.statusCode;
        
        // Log de finalización
        loggingService.endRequest(requestId, statusCode, {
          contentLength: res.get('Content-Length'),
          responseTime: duration
        });
        
        // Registrar métricas
        metricsService.recordRequest(req.method, req.path, statusCode, duration);
        
        // Log adicional para requests lentas
        if (duration > this.slowRequestThreshold) {
          logger.warn('Slow request detected', {
            duration,
            threshold: this.slowRequestThreshold,
            slow: true
          });
        }
        
        // Log de error para status codes 4xx y 5xx
        if (statusCode >= 400) {
          const logLevel = statusCode >= 500 ? 'error' : 'warn';
          logger[logLevel]('Request completed with error status', {
            statusCode,
            duration,
            error: true
          });
        }
      });
      
      // Manejar errores
      res.on('error', (error) => {
        const duration = performance.now() - startTime;
        
        logger.error('Response error', error, {
          duration,
          statusCode: res.statusCode
        });
        
        metricsService.recordRequest(req.method, req.path, 500, duration);
      });
      
      next();
    };
  }
  
  /**
   * Middleware para capturar errores no manejados
   */
  errorHandler() {
    return (error, req, res, next) => {
      const requestId = req.requestId || 'unknown';
      const logger = req.logger || loggingService;
      
      // Log del error
      logger.error('Unhandled error in request', error, {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode || 500,
        stack: error.stack
      });
      
      // Registrar métrica de error
      metricsService.recordRequest(req.method, req.path, 500, 0);
      
      // Respuesta de error
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal Server Error',
          requestId,
          timestamp: new Date().toISOString()
        });
      }
      
      next(error);
    };
  }
  
  /**
   * Middleware para logging de base de datos
   */
  static databaseMiddleware() {
    return {
      beforeQuery: (operation, table, query = null) => {
        const timerId = metricsService.startTimer('db_query_duration', {
          operation,
          table
        });
        
        loggingService.debug('Database query started', {
          operation,
          table,
          query: query ? query.substring(0, 200) : null,
          timerId
        });
        
        return timerId;
      },
      
      afterQuery: (timerId, operation, table, success = true, error = null) => {
        const duration = metricsService.endTimer(timerId);
        
        metricsService.recordDatabaseQuery(operation, table, duration, success);
        
        if (!success && error) {
          loggingService.error('Database query failed', error, {
            operation,
            table,
            duration
          });
        } else {
          loggingService.debug('Database query completed', {
            operation,
            table,
            duration,
            success
          });
        }
      }
    };
  }
  
  /**
   * Middleware para logging de cache
   */
  static cacheMiddleware() {
    return {
      beforeOperation: (operation, key) => {
        const timerId = metricsService.startTimer('cache_operation_duration', {
          operation,
          key: key.substring(0, 50) // Truncar claves largas
        });
        
        return timerId;
      },
      
      afterOperation: (timerId, operation, key, hit = null, error = null) => {
        const duration = metricsService.endTimer(timerId);
        
        metricsService.recordCacheOperation(operation, key, hit, duration);
        
        if (error) {
          loggingService.error('Cache operation failed', error, {
            operation,
            key,
            duration
          });
        }
      }
    };
  }
  
  /**
   * Middleware para eventos de negocio
   */
  static businessEventMiddleware() {
    return {
      recordEvent: (event, data = {}, context = {}) => {
        metricsService.recordBusinessEvent(event, data);
        
        loggingService.business(event, data, context);
      }
    };
  }
  
  /**
   * Verificar si la ruta debe ser excluida
   * @private
   */
  _shouldExclude(path) {
    return this.excludePaths.some(excludePath => {
      if (excludePath.endsWith('*')) {
        return path.startsWith(excludePath.slice(0, -1));
      }
      return path === excludePath;
    });
  }
  
  /**
   * Obtener IP del cliente
   * @private
   */
  _getClientIP(req) {
    return req.ip ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.headers['x-forwarded-for']?.split(',')[0] ||
           req.headers['x-real-ip'] ||
           'unknown';
  }
}

/**
 * Decorador para funciones que requieren observabilidad
 */
export function withObservability(operationName, options = {}) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const timerId = metricsService.startTimer(operationName, options.labels || {});
      const logger = loggingService.child({
        operation: operationName,
        method: propertyKey,
        class: target.constructor.name
      });
      
      logger.debug(`Starting operation: ${operationName}`);
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = metricsService.endTimer(timerId);
        
        logger.info(`Operation completed: ${operationName}`, {
          duration,
          success: true
        });
        
        return result;
      } catch (error) {
        const duration = metricsService.endTimer(timerId);
        
        logger.error(`Operation failed: ${operationName}`, error, {
          duration,
          success: false
        });
        
        metricsService.incrementCounter('operation_errors_total', 1, {
          operation: operationName,
          error: error.name
        });
        
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * Helper para crear contexto de observabilidad
 */
export function createObservabilityContext(operation, metadata = {}) {
  const requestId = uuidv4();
  const startTime = performance.now();
  
  const logger = loggingService.child({
    requestId,
    operation,
    ...metadata
  });
  
  const timerId = metricsService.startTimer(operation, metadata);
  
  return {
    requestId,
    logger,
    timerId,
    startTime,
    
    finish: (success = true, additionalData = {}) => {
      const duration = metricsService.endTimer(timerId);
      
      logger.info(`Operation ${operation} ${success ? 'completed' : 'failed'}`, {
        duration,
        success,
        ...additionalData
      });
      
      if (!success) {
        metricsService.incrementCounter('operation_errors_total', 1, {
          operation,
          ...metadata
        });
      }
      
      return duration;
    },
    
    recordMetric: (name, value, unit = 'count') => {
      metricsService.recordHistogram(name, value, { operation, ...metadata });
      logger.metrics(name, value, unit, { operation, ...metadata });
    },
    
    recordBusinessEvent: (event, data = {}) => {
      metricsService.recordBusinessEvent(event, data);
      logger.business(event, data, { operation, ...metadata });
    }
  };
}

// Instancia por defecto
const observabilityMiddleware = new ObservabilityMiddleware({
  excludePaths: ['/health', '/metrics', '/favicon.ico', '/static/*'],
  slowRequestThreshold: 1000,
  enableDetailedLogging: process.env.NODE_ENV !== 'production'
});

export default observabilityMiddleware;