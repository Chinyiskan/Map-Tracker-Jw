// backend/infrastructure/web/ObservabilityController.js
// Controlador para endpoints de observabilidad

import metricsService from '../metrics/MetricsService.js';
import loggingService from '../logging/LoggingService.js';
import cacheService from '../cache/CacheService.js';

/**
 * Controlador de Observabilidad
 * Expone endpoints para métricas, health checks y status del sistema
 */
export class ObservabilityController {
  constructor() {
    this.startTime = Date.now();
    this.version = process.env.npm_package_version || '1.0.0';
    this.environment = process.env.NODE_ENV || 'development';
  }
  
  /**
   * Health check básico
   */
  async healthCheck(req, res) {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: this.version,
        environment: this.environment,
        checks: {
          memory: this._checkMemory(),
          cache: this._checkCache(),
          logging: this._checkLogging()
        }
      };
      
      // Determinar status general
      const allChecksHealthy = Object.values(health.checks).every(check => check.status === 'healthy');
      health.status = allChecksHealthy ? 'healthy' : 'degraded';
      
      const statusCode = allChecksHealthy ? 200 : 503;
      
      res.status(statusCode).json(health);
      
      // Log del health check
      if (req.logger) {
        req.logger.info('Health check performed', {
          status: health.status,
          checks: health.checks
        });
      }
      
    } catch (error) {
      const errorResponse = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
      
      res.status(503).json(errorResponse);
      
      if (req.logger) {
        req.logger.error('Health check failed', error);
      }
    }
  }
  
  /**
   * Health check detallado
   */
  async detailedHealthCheck(req, res) {
    try {
      const detailed = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: this.version,
        environment: this.environment,
        system: {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          platform: process.platform,
          nodeVersion: process.version,
          pid: process.pid
        },
        services: {
          cache: await this._detailedCacheCheck(),
          logging: this._detailedLoggingCheck(),
          metrics: this._detailedMetricsCheck()
        },
        performance: this._getPerformanceMetrics()
      };
      
      // Determinar status general
      const serviceStatuses = Object.values(detailed.services).map(s => s.status);
      const allHealthy = serviceStatuses.every(status => status === 'healthy');
      const anyUnhealthy = serviceStatuses.some(status => status === 'unhealthy');
      
      detailed.status = anyUnhealthy ? 'unhealthy' : (allHealthy ? 'healthy' : 'degraded');
      
      const statusCode = detailed.status === 'healthy' ? 200 : 
                        detailed.status === 'degraded' ? 200 : 503;
      
      res.status(statusCode).json(detailed);
      
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }
  
  /**
   * Métricas en formato JSON
   */
  async getMetrics(req, res) {
    try {
      const summary = metricsService.getSummary();
      
      res.json({
        timestamp: new Date().toISOString(),
        service: 'map-tracker-jw',
        version: this.version,
        metrics: summary
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve metrics',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * Métricas en formato Prometheus
   */
  async getPrometheusMetrics(req, res) {
    try {
      const prometheusMetrics = metricsService.getPrometheusMetrics();
      
      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.send(prometheusMetrics);
      
    } catch (error) {
      res.status(500).send(`# Error generating metrics: ${error.message}`);
    }
  }
  
  /**
   * Status del sistema
   */
  async getStatus(req, res) {
    try {
      const status = {
        service: 'map-tracker-jw',
        version: this.version,
        environment: this.environment,
        timestamp: new Date().toISOString(),
        uptime: {
          seconds: process.uptime(),
          human: this._formatUptime(process.uptime())
        },
        system: {
          platform: process.platform,
          nodeVersion: process.version,
          pid: process.pid,
          memory: this._formatMemoryUsage(process.memoryUsage()),
          cpu: process.cpuUsage()
        },
        services: {
          logging: loggingService.getStats(),
          cache: cacheService.getStats(),
          metrics: {
            counters: metricsService.counters.size,
            gauges: metricsService.gauges.size,
            histograms: metricsService.histograms.size,
            timers: metricsService.timers.size
          }
        }
      };
      
      res.json(status);
      
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve status',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * Información de la aplicación
   */
  async getInfo(req, res) {
    try {
      const info = {
        name: 'Map Tracker JW',
        description: 'Sistema de seguimiento de territorios para Testigos de Jehová',
        version: this.version,
        environment: this.environment,
        build: {
          timestamp: this.startTime,
          date: new Date(this.startTime).toISOString()
        },
        runtime: {
          node: process.version,
          platform: process.platform,
          arch: process.arch
        },
        features: {
          caching: true,
          metrics: true,
          logging: true,
          healthChecks: true,
          observability: true
        },
        endpoints: {
          health: '/health',
          healthDetailed: '/health/detailed',
          metrics: '/metrics',
          prometheus: '/metrics/prometheus',
          status: '/status',
          info: '/info'
        }
      };
      
      res.json(info);
      
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve info',
        message: error.message
      });
    }
  }
  
  /**
   * Logs recientes (solo para desarrollo)
   */
  async getRecentLogs(req, res) {
    if (this.environment === 'production') {
      return res.status(403).json({
        error: 'Log access not available in production'
      });
    }
    
    try {
      // En un entorno real, esto leería de archivos de log
      // Por ahora, devolvemos información básica
      const logInfo = {
        message: 'Log access would be available here in development',
        note: 'In production, use proper log aggregation tools',
        logLevel: loggingService.logLevel,
        environment: this.environment
      };
      
      res.json(logInfo);
      
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve logs',
        message: error.message
      });
    }
  }
  
  // Métodos privados para health checks
  
  /**
   * Verificar estado de la memoria
   * @private
   */
  _checkMemory() {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    const heapTotalMB = usage.heapTotal / 1024 / 1024;
    const usagePercentage = (heapUsedMB / heapTotalMB) * 100;
    
    return {
      status: usagePercentage > 90 ? 'unhealthy' : (usagePercentage > 75 ? 'warning' : 'healthy'),
      usage: {
        heapUsed: `${heapUsedMB.toFixed(2)}MB`,
        heapTotal: `${heapTotalMB.toFixed(2)}MB`,
        percentage: `${usagePercentage.toFixed(2)}%`
      }
    };
  }
  
  /**
   * Verificar estado del cache
   * @private
   */
  _checkCache() {
    try {
      const stats = cacheService.getStats();
      
      return {
        status: stats.usage > 95 ? 'warning' : 'healthy',
        size: stats.size,
        usage: `${stats.usage}%`,
        maxSize: stats.maxSize
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
  
  /**
   * Verificar estado del logging
   * @private
   */
  _checkLogging() {
    try {
      const stats = loggingService.getStats();
      
      return {
        status: 'healthy',
        activeRequests: stats.activeRequests,
        logLevel: stats.logLevel
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
  
  /**
   * Health check detallado del cache
   * @private
   */
  async _detailedCacheCheck() {
    try {
      const stats = cacheService.getStats();
      
      // Test básico del cache
      const testKey = 'health_check_test';
      const testValue = Date.now();
      
      cacheService.set(testKey, testValue, 1000);
      const retrieved = cacheService.get(testKey);
      cacheService.delete(testKey);
      
      const testPassed = retrieved === testValue;
      
      return {
        status: testPassed && stats.usage < 95 ? 'healthy' : 'degraded',
        stats,
        test: {
          passed: testPassed,
          operation: 'set/get/delete'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
  
  /**
   * Health check detallado del logging
   * @private
   */
  _detailedLoggingCheck() {
    try {
      const stats = loggingService.getStats();
      
      // Test básico del logging
      loggingService.debug('Health check test log');
      
      return {
        status: 'healthy',
        stats,
        test: {
          passed: true,
          operation: 'debug log'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
  
  /**
   * Health check detallado de métricas
   * @private
   */
  _detailedMetricsCheck() {
    try {
      // Test básico de métricas
      metricsService.incrementCounter('health_check_test', 1);
      
      return {
        status: 'healthy',
        counters: metricsService.counters.size,
        gauges: metricsService.gauges.size,
        histograms: metricsService.histograms.size,
        test: {
          passed: true,
          operation: 'increment counter'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
  
  /**
   * Obtener métricas de performance
   * @private
   */
  _getPerformanceMetrics() {
    const summary = metricsService.getSummary();
    
    return {
      requests: {
        total: summary.requests.total,
        successRate: `${summary.requests.successRate}%`,
        avgResponseTime: `${summary.performance.responseTime.avg}ms`
      },
      cache: {
        hitRate: `${summary.cache.hitRate}%`,
        size: summary.cache.size
      },
      database: {
        queries: summary.performance.database.queries,
        avgDuration: `${summary.performance.database.avgDuration}ms`,
        errors: summary.performance.database.errors
      }
    };
  }
  
  /**
   * Formatear tiempo de actividad
   * @private
   */
  _formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  }
  
  /**
   * Formatear uso de memoria
   * @private
   */
  _formatMemoryUsage(usage) {
    return {
      rss: `${(usage.rss / 1024 / 1024).toFixed(2)}MB`,
      heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      external: `${(usage.external / 1024 / 1024).toFixed(2)}MB`
    };
  }
}

// Instancia del controlador
const observabilityController = new ObservabilityController();

export default observabilityController;