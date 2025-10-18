// @ts-check
// backend/infrastructure/web/controllers/MetricsController.js
// OPTIMIZACIÓN SPRINT 3: Controlador de Métricas

import metricsService from '../../metrics/MetricsServiceServerless.js';
import os from 'os';
import process from 'process';

/**
 * Controlador de Métricas
 * Expone métricas del sistema, performance y negocio
 */
class MetricsController {
  constructor() {
    // Bind methods para mantener contexto
    this.getMetrics = this.getMetrics.bind(this);
    this.getHealthCheck = this.getHealthCheck.bind(this);
    this.getPrometheusMetrics = this.getPrometheusMetrics.bind(this);
    this.getSystemInfo = this.getSystemInfo.bind(this);
    this.resetMetrics = this.resetMetrics.bind(this);
  }
  
  /**
   * Obtener métricas completas del sistema
   * GET /api/metrics
   */
  async getMetrics(req, res) {
    try {
      console.log('📊 MetricsController: Obteniendo métricas completas');
      
      const summary = metricsService.getSummary();
      const systemInfo = this._getSystemInfo();
      
      const response = {
        success: true,
        data: {
          ...summary,
          systemInfo,
          metadata: {
            service: 'map-tracker-jw',
            version: '2.1.0',
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
            uptime: {
              seconds: Math.floor(process.uptime()),
              formatted: this._formatUptime(process.uptime())
            }
          }
        }
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('❌ Error en MetricsController.getMetrics:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo métricas del sistema',
        message: error.message
      });
    }
  }
  
  /**
   * Health check simplificado
   * GET /api/metrics/health
   */
  async getHealthCheck(req, res) {
    try {
      console.log('🏥 MetricsController: Health check');
      
      const summary = metricsService.getSummary();
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      // Calcular estado de salud
      const health = {
        status: 'healthy',
        checks: {
          memory: {
            status: memUsage.heapUsed / memUsage.heapTotal < 0.9 ? 'healthy' : 'warning',
            heapUsage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
            heapUsed: this._formatBytes(memUsage.heapUsed),
            heapTotal: this._formatBytes(memUsage.heapTotal)
          },
          requests: {
            status: summary.requests.total > 0 && parseFloat(summary.requests.successRate) > 95 ? 'healthy' : 'warning',
            total: summary.requests.total,
            successRate: summary.requests.successRate + '%',
            errorRate: (100 - parseFloat(summary.requests.successRate)).toFixed(2) + '%'
          },
          cache: {
            status: parseFloat(summary.cache.hitRate) > 70 ? 'healthy' : 'warning',
            hitRate: summary.cache.hitRate + '%',
            hits: summary.cache.hits,
            misses: summary.cache.misses
          },
          database: {
            status: summary.performance.database.errors === 0 ? 'healthy' : 'warning',
            queries: summary.performance.database.queries,
            errors: summary.performance.database.errors,
            slowQueries: summary.performance.database.slowQueries,
            avgDuration: summary.performance.database.avgDuration + 'ms'
          }
        },
        uptime: {
          seconds: Math.floor(uptime),
          formatted: this._formatUptime(uptime)
        },
        timestamp: new Date().toISOString()
      };
      
      // Determinar estado general
      const checks = Object.values(health.checks);
      const hasWarnings = checks.some(check => check.status === 'warning');
      const hasErrors = checks.some(check => check.status === 'error');
      
      if (hasErrors) {
        health.status = 'error';
      } else if (hasWarnings) {
        health.status = 'warning';
      }
      
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'warning' ? 200 : 503;
      
      res.status(statusCode).json({
        success: true,
        data: health
      });
      
    } catch (error) {
      console.error('❌ Error en MetricsController.getHealthCheck:', error);
      res.status(503).json({
        success: false,
        status: 'error',
        error: 'Error en health check',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * Métricas en formato Prometheus
   * GET /api/metrics/prometheus
   */
  async getPrometheusMetrics(req, res) {
    try {
      console.log('📈 MetricsController: Métricas formato Prometheus');
      
      const prometheusMetrics = metricsService.getPrometheusMetrics();
      
      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.send(prometheusMetrics);
      
    } catch (error) {
      console.error('❌ Error en MetricsController.getPrometheusMetrics:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo métricas Prometheus',
        message: error.message
      });
    }
  }
  
  /**
   * Información del sistema
   * GET /api/metrics/system
   */
  async getSystemInfo(req, res) {
    try {
      console.log('💻 MetricsController: Información del sistema');
      
      const systemInfo = this._getSystemInfo();
      
      res.json({
        success: true,
        data: systemInfo
      });
      
    } catch (error) {
      console.error('❌ Error en MetricsController.getSystemInfo:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo información del sistema',
        message: error.message
      });
    }
  }
  
  /**
   * Reset de métricas (solo para desarrollo)
   * POST /api/metrics/reset
   */
  async resetMetrics(req, res) {
    try {
      // Solo permitir en desarrollo
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          error: 'Reset de métricas no permitido en producción'
        });
      }
      
      console.log('🔄 MetricsController: Reseteando métricas');
      
      metricsService.reset();
      
      res.json({
        success: true,
        message: 'Métricas reseteadas exitosamente',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error en MetricsController.resetMetrics:', error);
      res.status(500).json({
        success: false,
        error: 'Error reseteando métricas',
        message: error.message
      });
    }
  }
  
  /**
   * Obtener información del sistema
   * @private
   */
  _getSystemInfo() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const loadAvg = os.loadavg();
    
    return {
      platform: {
        os: os.platform(),
        arch: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
        nodeVersion: process.version
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Unknown',
        speed: os.cpus()[0]?.speed || 0,
        loadAverage: {
          '1min': loadAvg[0]?.toFixed(2) || 0,
          '5min': loadAvg[1]?.toFixed(2) || 0,
          '15min': loadAvg[2]?.toFixed(2) || 0
        },
        usage: {
          user: cpuUsage.user,
          system: cpuUsage.system
        }
      },
      memory: {
        system: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          usagePercentage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
          totalFormatted: this._formatBytes(os.totalmem()),
          freeFormatted: this._formatBytes(os.freemem()),
          usedFormatted: this._formatBytes(os.totalmem() - os.freemem())
        },
        process: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
          arrayBuffers: memUsage.arrayBuffers,
          rssFormatted: this._formatBytes(memUsage.rss),
          heapTotalFormatted: this._formatBytes(memUsage.heapTotal),
          heapUsedFormatted: this._formatBytes(memUsage.heapUsed),
          heapUsagePercentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
        }
      },
      network: {
        interfaces: Object.keys(os.networkInterfaces()).length
      },
      uptime: {
        system: os.uptime(),
        process: process.uptime(),
        systemFormatted: this._formatUptime(os.uptime()),
        processFormatted: this._formatUptime(process.uptime())
      }
    };
  }
  
  /**
   * Formatear bytes a unidades legibles
   * @private
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${secs}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
}

export default MetricsController;