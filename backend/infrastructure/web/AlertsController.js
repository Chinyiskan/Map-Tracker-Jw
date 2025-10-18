// backend/infrastructure/web/AlertsController.js
// Controlador para gestión de alertas

import alertingService from '../alerts/AlertingService.js';
import loggingService from '../logging/LoggingService.js';

/**
 * Controlador de Alertas
 * Gestiona endpoints para configuración y consulta de alertas
 */
export class AlertsController {
  constructor() {
    this.alertingService = alertingService;
  }
  
  /**
   * Obtener alertas activas
   */
  async getActiveAlerts(req, res) {
    try {
      const activeAlerts = this.alertingService.getActiveAlerts();
      
      res.json({
        success: true,
        data: {
          alerts: activeAlerts,
          count: activeAlerts.length,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error retrieving active alerts',
        message: error.message
      });
    }
  }
  
  /**
   * Obtener historial de alertas
   */
  async getAlertHistory(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const alertHistory = this.alertingService.getAlertHistory(limit);
      
      res.json({
        success: true,
        data: {
          alerts: alertHistory,
          count: alertHistory.length,
          limit,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error retrieving alert history',
        message: error.message
      });
    }
  }
  
  /**
   * Obtener configuración de alertas
   */
  async getConfiguration(req, res) {
    try {
      const configuration = this.alertingService.getConfiguration();
      
      res.json({
        success: true,
        data: configuration
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error retrieving alert configuration',
        message: error.message
      });
    }
  }
  
  /**
   * Actualizar umbral de alerta
   */
  async updateThreshold(req, res) {
    try {
      const { metric, level, value } = req.body;
      
      // Validar parámetros
      if (!metric || !level || value === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters',
          message: 'metric, level, and value are required'
        });
      }
      
      // Validar que el valor sea numérico
      const numericValue = parseFloat(value);
      if (isNaN(numericValue)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid value',
          message: 'Value must be a number'
        });
      }
      
      // Actualizar umbral
      const updated = this.alertingService.updateThreshold(metric, level, numericValue);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Metric or level not found',
          message: `Metric '${metric}' or level '${level}' does not exist`
        });
      }
      
      // Log de la actualización
      if (req.logger) {
        req.logger.info('Alert threshold updated', {
          metric,
          level,
          oldValue: req.body.oldValue,
          newValue: numericValue,
          updatedBy: req.ip
        });
      }
      
      res.json({
        success: true,
        message: 'Threshold updated successfully',
        data: {
          metric,
          level,
          value: numericValue
        }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error updating threshold',
        message: error.message
      });
    }
  }
  
  /**
   * Habilitar/deshabilitar métrica
   */
  async toggleMetric(req, res) {
    try {
      const { metric } = req.params;
      const { enabled } = req.body;
      
      if (enabled === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing enabled parameter',
          message: 'enabled parameter is required'
        });
      }
      
      const updated = this.alertingService.enableMetric(metric, enabled);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Metric not found',
          message: `Metric '${metric}' does not exist`
        });
      }
      
      // Log de la actualización
      if (req.logger) {
        req.logger.info('Alert metric toggled', {
          metric,
          enabled,
          updatedBy: req.ip
        });
      }
      
      res.json({
        success: true,
        message: `Metric ${enabled ? 'enabled' : 'disabled'} successfully`,
        data: {
          metric,
          enabled
        }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error toggling metric',
        message: error.message
      });
    }
  }
  
  /**
   * Generar alerta de prueba
   */
  async triggerTestAlert(req, res) {
    try {
      const { metric = 'responseTime', level = 'warning' } = req.body;
      
      // Validar parámetros
      const validMetrics = ['responseTime', 'errorRate', 'memoryUsage', 'cacheHitRate', 'dbQueryTime'];
      const validLevels = ['warning', 'critical'];
      
      if (!validMetrics.includes(metric)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid metric',
          message: `Metric must be one of: ${validMetrics.join(', ')}`
        });
      }
      
      if (!validLevels.includes(level)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid level',
          message: `Level must be one of: ${validLevels.join(', ')}`
        });
      }
      
      // Generar alerta de prueba
      const testAlert = this.alertingService.triggerTestAlert(metric, level);
      
      // Log de la alerta de prueba
      if (req.logger) {
        req.logger.info('Test alert triggered', {
          metric,
          level,
          alertId: testAlert.id,
          triggeredBy: req.ip
        });
      }
      
      res.json({
        success: true,
        message: 'Test alert triggered successfully',
        data: testAlert
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error triggering test alert',
        message: error.message
      });
    }
  }
  
  /**
   * Obtener estadísticas de alertas
   */
  async getAlertStats(req, res) {
    try {
      const activeAlerts = this.alertingService.getActiveAlerts();
      const alertHistory = this.alertingService.getAlertHistory(100);
      
      // Calcular estadísticas
      const stats = {
        active: {
          total: activeAlerts.length,
          critical: activeAlerts.filter(a => a.level === 'critical').length,
          warning: activeAlerts.filter(a => a.level === 'warning').length,
          byMetric: this._groupByMetric(activeAlerts)
        },
        history: {
          total: alertHistory.length,
          last24h: alertHistory.filter(a => 
            Date.now() - a.timestamp < 86400000
          ).length,
          last7d: alertHistory.filter(a => 
            Date.now() - a.timestamp < 604800000
          ).length,
          byLevel: this._groupByLevel(alertHistory),
          byMetric: this._groupByMetric(alertHistory)
        },
        trends: this._calculateTrends(alertHistory)
      };
      
      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error retrieving alert statistics',
        message: error.message
      });
    }
  }
  
  /**
   * Obtener resumen de alertas para dashboard
   */
  async getAlertSummary(req, res) {
    try {
      const activeAlerts = this.alertingService.getActiveAlerts();
      const configuration = this.alertingService.getConfiguration();
      
      const summary = {
        status: activeAlerts.length === 0 ? 'healthy' : 
                activeAlerts.some(a => a.level === 'critical') ? 'critical' : 'warning',
        activeAlerts: {
          total: activeAlerts.length,
          critical: activeAlerts.filter(a => a.level === 'critical').length,
          warning: activeAlerts.filter(a => a.level === 'warning').length,
          alerts: activeAlerts.slice(0, 5) // Últimas 5 alertas
        },
        configuration: {
          enabledMetrics: Object.entries(configuration.thresholds)
            .filter(([_, config]) => config.enabled)
            .length,
          totalMetrics: Object.keys(configuration.thresholds).length,
          checkInterval: configuration.checkInterval,
          alertCooldown: configuration.alertCooldown
        },
        lastCheck: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: summary
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error retrieving alert summary',
        message: error.message
      });
    }
  }
  
  // Métodos auxiliares privados
  
  _groupByMetric(alerts) {
    return alerts.reduce((acc, alert) => {
      acc[alert.metric] = (acc[alert.metric] || 0) + 1;
      return acc;
    }, {});
  }
  
  _groupByLevel(alerts) {
    return alerts.reduce((acc, alert) => {
      acc[alert.level] = (acc[alert.level] || 0) + 1;
      return acc;
    }, {});
  }
  
  _calculateTrends(alertHistory) {
    const now = Date.now();
    const oneDayAgo = now - 86400000;
    const twoDaysAgo = now - 172800000;
    
    const last24h = alertHistory.filter(a => a.timestamp > oneDayAgo).length;
    const previous24h = alertHistory.filter(a => 
      a.timestamp > twoDaysAgo && a.timestamp <= oneDayAgo
    ).length;
    
    const trend = previous24h === 0 ? 
      (last24h > 0 ? 'increasing' : 'stable') :
      last24h > previous24h ? 'increasing' :
      last24h < previous24h ? 'decreasing' : 'stable';
    
    const changePercent = previous24h === 0 ? 0 :
      ((last24h - previous24h) / previous24h * 100).toFixed(1);
    
    return {
      direction: trend,
      changePercent: parseFloat(changePercent),
      last24h,
      previous24h
    };
  }
}

// Instancia del controlador
const alertsController = new AlertsController();

export default alertsController;