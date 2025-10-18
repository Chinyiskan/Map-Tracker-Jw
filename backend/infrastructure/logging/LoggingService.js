// backend/infrastructure/logging/LoggingService.js
// Sistema de logging estructurado para observabilidad

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { performance } from 'perf_hooks';

/**
 * Servicio de Logging Estructurado
 * Proporciona logging centralizado con diferentes niveles, formateo estructurado y rotación
 */
export class LoggingService {
  constructor(options = {}) {
    this.serviceName = options.serviceName || 'map-tracker';
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.logLevel = options.logLevel || (this.environment === 'production' ? 'info' : 'debug');
    
    this.logger = this._createLogger();
    this.requestTracker = new Map();
    
    console.log(`📝 LoggingService inicializado: ${this.serviceName} (${this.environment})`);
  }
  
  /**
   * Crear configuración del logger
   * @private
   */
  _createLogger() {
    const formats = [
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ];
    
    // Formato para desarrollo (más legible)
    if (this.environment === 'development') {
      formats.push(
        winston.format.colorize({ all: true }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      );
    }
    
    const transports = [
      // Console transport
      new winston.transports.Console({
        level: this.logLevel,
        format: winston.format.combine(...formats)
      })
    ];
    
    // File transports para producción
    if (this.environment === 'production') {
      // Logs generales con rotación diaria
      transports.push(
        new DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          level: 'info',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );
      
      // Logs de errores separados
      transports.push(
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );
      
      // Logs de performance
      transports.push(
        new DailyRotateFile({
          filename: 'logs/performance-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '10m',
          maxFiles: '7d',
          level: 'info',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );
    }
    
    return winston.createLogger({
      level: this.logLevel,
      defaultMeta: {
        service: this.serviceName,
        environment: this.environment,
        version: process.env.npm_package_version || '1.0.0'
      },
      transports
    });
  }
  
  /**
   * Log de información general
   */
  info(message, meta = {}) {
    this.logger.info(message, this._enrichMeta(meta));
  }
  
  /**
   * Log de advertencias
   */
  warn(message, meta = {}) {
    this.logger.warn(message, this._enrichMeta(meta));
  }
  
  /**
   * Log de errores
   */
  error(message, error = null, meta = {}) {
    const enrichedMeta = this._enrichMeta(meta);
    
    if (error instanceof Error) {
      enrichedMeta.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      };
    } else if (error) {
      enrichedMeta.error = error;
    }
    
    this.logger.error(message, enrichedMeta);
  }
  
  /**
   * Log de debug (solo en desarrollo)
   */
  debug(message, meta = {}) {
    this.logger.debug(message, this._enrichMeta(meta));
  }
  
  /**
   * Log de métricas de performance
   */
  performance(operation, duration, meta = {}) {
    const perfMeta = {
      ...this._enrichMeta(meta),
      performance: {
        operation,
        duration_ms: Math.round(duration * 100) / 100,
        timestamp: Date.now()
      }
    };
    
    this.logger.info(`Performance: ${operation} completed in ${duration}ms`, perfMeta);
  }
  
  /**
   * Iniciar tracking de request
   */
  startRequest(requestId, method, url, meta = {}) {
    const startTime = performance.now();
    
    this.requestTracker.set(requestId, {
      startTime,
      method,
      url,
      meta
    });
    
    this.info(`Request started: ${method} ${url}`, {
      requestId,
      method,
      url,
      ...meta
    });
    
    return requestId;
  }
  
  /**
   * Finalizar tracking de request
   */
  endRequest(requestId, statusCode, meta = {}) {
    const requestData = this.requestTracker.get(requestId);
    
    if (!requestData) {
      this.warn(`Request tracking not found for ID: ${requestId}`);
      return;
    }
    
    const duration = performance.now() - requestData.startTime;
    const logLevel = statusCode >= 400 ? 'error' : 'info';
    
    const logMeta = {
      requestId,
      method: requestData.method,
      url: requestData.url,
      statusCode,
      duration_ms: Math.round(duration * 100) / 100,
      ...requestData.meta,
      ...meta
    };
    
    this.logger[logLevel](
      `Request completed: ${requestData.method} ${requestData.url} - ${statusCode} (${duration.toFixed(2)}ms)`,
      logMeta
    );
    
    this.requestTracker.delete(requestId);
  }
  
  /**
   * Log de eventos de negocio
   */
  business(event, data = {}, meta = {}) {
    this.info(`Business Event: ${event}`, {
      ...this._enrichMeta(meta),
      businessEvent: {
        event,
        data,
        timestamp: Date.now()
      }
    });
  }
  
  /**
   * Log de métricas del sistema
   */
  metrics(metricName, value, unit = 'count', meta = {}) {
    this.info(`Metric: ${metricName}`, {
      ...this._enrichMeta(meta),
      metric: {
        name: metricName,
        value,
        unit,
        timestamp: Date.now()
      }
    });
  }
  
  /**
   * Log de eventos de seguridad
   */
  security(event, details = {}, meta = {}) {
    this.warn(`Security Event: ${event}`, {
      ...this._enrichMeta(meta),
      security: {
        event,
        details,
        timestamp: Date.now(),
        severity: details.severity || 'medium'
      }
    });
  }
  
  /**
   * Log de eventos de base de datos
   */
  database(operation, table, duration = null, meta = {}) {
    const dbMeta = {
      ...this._enrichMeta(meta),
      database: {
        operation,
        table,
        duration_ms: duration ? Math.round(duration * 100) / 100 : null,
        timestamp: Date.now()
      }
    };
    
    const message = duration 
      ? `DB: ${operation} on ${table} (${duration.toFixed(2)}ms)`
      : `DB: ${operation} on ${table}`;
    
    this.debug(message, dbMeta);
  }
  
  /**
   * Log de eventos de cache
   */
  cache(operation, key, hit = null, meta = {}) {
    const cacheMeta = {
      ...this._enrichMeta(meta),
      cache: {
        operation,
        key,
        hit,
        timestamp: Date.now()
      }
    };
    
    const hitStatus = hit !== null ? (hit ? 'HIT' : 'MISS') : '';
    const message = `Cache: ${operation} ${key} ${hitStatus}`.trim();
    
    this.debug(message, cacheMeta);
  }
  
  /**
   * Enriquecer metadata con información del contexto
   * @private
   */
  _enrichMeta(meta = {}) {
    return {
      ...meta,
      timestamp: Date.now(),
      pid: process.pid,
      memory: this._getMemoryUsage(),
      uptime: process.uptime()
    };
  }
  
  /**
   * Obtener uso de memoria
   * @private
   */
  _getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024) // MB
    };
  }
  
  /**
   * Crear un logger hijo con contexto específico
   */
  child(context = {}) {
    return {
      info: (message, meta = {}) => this.info(message, { ...context, ...meta }),
      warn: (message, meta = {}) => this.warn(message, { ...context, ...meta }),
      error: (message, error = null, meta = {}) => this.error(message, error, { ...context, ...meta }),
      debug: (message, meta = {}) => this.debug(message, { ...context, ...meta }),
      performance: (operation, duration, meta = {}) => this.performance(operation, duration, { ...context, ...meta }),
      business: (event, data = {}, meta = {}) => this.business(event, data, { ...context, ...meta }),
      metrics: (metricName, value, unit = 'count', meta = {}) => this.metrics(metricName, value, unit, { ...context, ...meta }),
      security: (event, details = {}, meta = {}) => this.security(event, details, { ...context, ...meta }),
      database: (operation, table, duration = null, meta = {}) => this.database(operation, table, duration, { ...context, ...meta }),
      cache: (operation, key, hit = null, meta = {}) => this.cache(operation, key, hit, { ...context, ...meta })
    };
  }
  
  /**
   * Obtener estadísticas del logger
   */
  getStats() {
    return {
      activeRequests: this.requestTracker.size,
      logLevel: this.logLevel,
      environment: this.environment,
      serviceName: this.serviceName,
      uptime: process.uptime(),
      memory: this._getMemoryUsage()
    };
  }
  
  /**
   * Limpiar requests tracking antiguos (cleanup)
   */
  cleanup() {
    const now = performance.now();
    const maxAge = 300000; // 5 minutos
    
    for (const [requestId, data] of this.requestTracker.entries()) {
      if (now - data.startTime > maxAge) {
        this.warn(`Cleaning up stale request tracking: ${requestId}`);
        this.requestTracker.delete(requestId);
      }
    }
  }
}

// Instancia singleton del servicio de logging
const loggingService = new LoggingService({
  serviceName: 'map-tracker-jw',
  environment: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info'
});

// Cleanup automático cada 5 minutos
setInterval(() => {
  loggingService.cleanup();
}, 300000);

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  loggingService.error('Uncaught Exception', error, {
    fatal: true,
    process: 'uncaughtException'
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  loggingService.error('Unhandled Rejection', reason, {
    fatal: false,
    process: 'unhandledRejection',
    promise: promise.toString()
  });
});

export default loggingService;