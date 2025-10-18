// backend/infrastructure/alerts/AlertingService.js
// Sistema de alertas automáticas para umbrales críticos

import { EventEmitter } from 'events';
import loggingService from '../logging/LoggingService.js';
import metricsService from '../metrics/MetricsService.js';

/**
 * Servicio de Alertas
 * Monitorea métricas y genera alertas cuando se superan umbrales críticos
 */
export class AlertingService extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.serviceName = options.serviceName || 'map-tracker';
    this.checkInterval = options.checkInterval || 60000; // 1 minuto
    this.alertCooldown = options.alertCooldown || 300000; // 5 minutos
    
    // Configuración de umbrales
    this.thresholds = {
      // Performance
      responseTime: {
        warning: 1000, // 1 segundo
        critical: 3000, // 3 segundos
        enabled: true
      },
      
      // Tasa de errores
      errorRate: {
        warning: 5, // 5%
        critical: 10, // 10%
        enabled: true
      },
      
      // Memoria
      memoryUsage: {
        warning: 80, // 80%
        critical: 90, // 90%
        enabled: true
      },
      
      // Cache
      cacheHitRate: {
        warning: 85, // 85%
        critical: 70, // 70%
        enabled: true,
        inverted: true // Alerta cuando está DEBAJO del umbral
      },
      
      // Base de datos
      dbQueryTime: {
        warning: 500, // 500ms
        critical: 2000, // 2 segundos
        enabled: true
      },
      
      // Requests por segundo
      requestsPerSecond: {
        warning: 100, // 100 req/s
        critical: 200, // 200 req/s
        enabled: true
      },
      
      // Uptime
      uptime: {
        warning: 86400, // 1 día
        critical: 604800, // 1 semana
        enabled: false // Solo informativo
      }
    };
    
    // Estado de alertas activas
    this.activeAlerts = new Map();
    this.alertHistory = [];
    this.lastAlertTimes = new Map();
    
    // Canales de notificación
    this.notificationChannels = {
      console: true,
      log: true,
      webhook: false,
      email: false
    };
    
    // Configuración de webhooks
    this.webhookConfig = {
      url: process.env.ALERT_WEBHOOK_URL || null,
      timeout: 5000,
      retries: 3
    };
    
    // Configuración de email
    this.emailConfig = {
      enabled: false,
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      },
      from: process.env.ALERT_EMAIL_FROM,
      to: process.env.ALERT_EMAIL_TO?.split(',') || []
    };
    
    this.init();
  }
  
  init() {
    // Iniciar monitoreo
    this.startMonitoring();
    
    // Configurar event listeners
    this.setupEventListeners();
    
    loggingService.info('AlertingService inicializado', {
      checkInterval: this.checkInterval,
      alertCooldown: this.alertCooldown,
      thresholds: Object.keys(this.thresholds).length
    });
  }
  
  setupEventListeners() {
    // Escuchar eventos de métricas críticas
    this.on('alert', (alert) => {
      this.handleAlert(alert);
    });
    
    this.on('alertResolved', (alert) => {
      this.handleAlertResolved(alert);
    });
  }
  
  startMonitoring() {
    // Verificar alertas cada intervalo configurado
    this.monitoringTimer = setInterval(() => {
      this.checkAllThresholds();
    }, this.checkInterval);
    
    loggingService.info('Monitoreo de alertas iniciado', {
      interval: this.checkInterval
    });
  }
  
  stopMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    
    loggingService.info('Monitoreo de alertas detenido');
  }
  
  async checkAllThresholds() {
    try {
      // Obtener métricas actuales
      const summary = metricsService.getSummary();
      
      // Verificar cada umbral configurado
      for (const [metricName, config] of Object.entries(this.thresholds)) {
        if (!config.enabled) continue;
        
        const currentValue = this.extractMetricValue(summary, metricName);
        if (currentValue !== null) {
          await this.checkThreshold(metricName, currentValue, config);
        }
      }
      
      // Limpiar alertas resueltas
      this.cleanupResolvedAlerts(summary);
      
    } catch (error) {
      loggingService.error('Error verificando umbrales de alertas', error);
    }
  }
  
  extractMetricValue(summary, metricName) {
    switch (metricName) {
      case 'responseTime':
        return parseFloat(summary.performance.responseTime.avg) || 0;
        
      case 'errorRate':
        const successRate = parseFloat(summary.requests.successRate) || 100;
        return 100 - successRate;
        
      case 'memoryUsage':
        const memory = summary.system.memory;
        return (memory.heapUsed / memory.heapTotal) * 100;
        
      case 'cacheHitRate':
        return parseFloat(summary.cache.hitRate) || 0;
        
      case 'dbQueryTime':
        return parseFloat(summary.performance.database.avgDuration) || 0;
        
      case 'requestsPerSecond':
        return summary.requests.total / summary.system.uptime;
        
      case 'uptime':
        return summary.system.uptime;
        
      default:
        return null;
    }
  }
  
  async checkThreshold(metricName, currentValue, config) {
    const alertKey = metricName;
    const now = Date.now();
    
    // Verificar cooldown
    const lastAlertTime = this.lastAlertTimes.get(alertKey);
    if (lastAlertTime && (now - lastAlertTime) < this.alertCooldown) {
      return; // Aún en cooldown
    }
    
    // Determinar nivel de alerta
    let alertLevel = null;
    let threshold = null;
    
    if (config.inverted) {
      // Para métricas donde valores bajos son problemáticos (ej: cache hit rate)
      if (currentValue <= config.critical) {
        alertLevel = 'critical';
        threshold = config.critical;
      } else if (currentValue <= config.warning) {
        alertLevel = 'warning';
        threshold = config.warning;
      }
    } else {
      // Para métricas donde valores altos son problemáticos
      if (currentValue >= config.critical) {
        alertLevel = 'critical';
        threshold = config.critical;
      } else if (currentValue >= config.warning) {
        alertLevel = 'warning';
        threshold = config.warning;
      }
    }
    
    if (alertLevel) {
      const alert = {
        id: `${alertKey}_${alertLevel}_${now}`,
        key: alertKey,
        metric: metricName,
        level: alertLevel,
        currentValue,
        threshold,
        timestamp: now,
        message: this.generateAlertMessage(metricName, alertLevel, currentValue, threshold, config.inverted)
      };
      
      // Verificar si ya existe una alerta activa para esta métrica
      const existingAlert = this.activeAlerts.get(alertKey);
      
      if (!existingAlert || existingAlert.level !== alertLevel) {
        // Nueva alerta o cambio de nivel
        this.activeAlerts.set(alertKey, alert);
        this.lastAlertTimes.set(alertKey, now);
        this.alertHistory.push(alert);
        
        // Emitir evento de alerta
        this.emit('alert', alert);
        
        loggingService.warn('Alerta generada', {
          metric: metricName,
          level: alertLevel,
          currentValue,
          threshold,
          alertId: alert.id
        });
      }
    } else {
      // Verificar si hay una alerta activa que debe resolverse
      const existingAlert = this.activeAlerts.get(alertKey);
      if (existingAlert) {
        this.activeAlerts.delete(alertKey);
        
        const resolvedAlert = {
          ...existingAlert,
          resolvedAt: now,
          resolvedValue: currentValue
        };
        
        this.emit('alertResolved', resolvedAlert);
        
        loggingService.info('Alerta resuelta', {
          metric: metricName,
          level: existingAlert.level,
          resolvedValue: currentValue,
          alertId: existingAlert.id
        });
      }
    }
  }
  
  generateAlertMessage(metric, level, currentValue, threshold, inverted = false) {
    const metricNames = {
      responseTime: 'Tiempo de Respuesta',
      errorRate: 'Tasa de Errores',
      memoryUsage: 'Uso de Memoria',
      cacheHitRate: 'Cache Hit Rate',
      dbQueryTime: 'Tiempo de Consulta DB',
      requestsPerSecond: 'Requests por Segundo',
      uptime: 'Tiempo de Actividad'
    };
    
    const metricName = metricNames[metric] || metric;
    const operator = inverted ? 'por debajo de' : 'por encima de';
    const levelText = level === 'critical' ? 'CRÍTICO' : 'ADVERTENCIA';
    
    let unit = '';
    switch (metric) {
      case 'responseTime':
      case 'dbQueryTime':
        unit = 'ms';
        break;
      case 'errorRate':
      case 'memoryUsage':
      case 'cacheHitRate':
        unit = '%';
        break;
      case 'requestsPerSecond':
        unit = 'req/s';
        break;
      case 'uptime':
        unit = 's';
        break;
    }
    
    return `${levelText}: ${metricName} está ${operator} del umbral. Valor actual: ${currentValue.toFixed(2)}${unit}, Umbral: ${threshold}${unit}`;
  }
  
  async handleAlert(alert) {
    try {
      // Registrar en métricas
      metricsService.incrementCounter('alerts_generated_total', 1, {
        metric: alert.metric,
        level: alert.level
      });
      
      // Enviar notificaciones
      await this.sendNotifications(alert);
      
    } catch (error) {
      loggingService.error('Error manejando alerta', error, {
        alertId: alert.id,
        metric: alert.metric
      });
    }
  }
  
  async handleAlertResolved(alert) {
    try {
      // Registrar resolución en métricas
      metricsService.incrementCounter('alerts_resolved_total', 1, {
        metric: alert.metric,
        level: alert.level
      });
      
      // Enviar notificación de resolución
      const resolvedAlert = {
        ...alert,
        message: `RESUELTO: ${alert.message.replace('CRÍTICO:', '').replace('ADVERTENCIA:', '')} - Valor actual: ${alert.resolvedValue.toFixed(2)}`
      };
      
      await this.sendNotifications(resolvedAlert, true);
      
    } catch (error) {
      loggingService.error('Error manejando resolución de alerta', error, {
        alertId: alert.id
      });
    }
  }
  
  async sendNotifications(alert, isResolved = false) {
    const notifications = [];
    
    // Notificación por consola
    if (this.notificationChannels.console) {
      notifications.push(this.sendConsoleNotification(alert, isResolved));
    }
    
    // Notificación por log
    if (this.notificationChannels.log) {
      notifications.push(this.sendLogNotification(alert, isResolved));
    }
    
    // Notificación por webhook
    if (this.notificationChannels.webhook && this.webhookConfig.url) {
      notifications.push(this.sendWebhookNotification(alert, isResolved));
    }
    
    // Notificación por email
    if (this.notificationChannels.email && this.emailConfig.enabled) {
      notifications.push(this.sendEmailNotification(alert, isResolved));
    }
    
    // Esperar a que se envíen todas las notificaciones
    await Promise.allSettled(notifications);
  }
  
  async sendConsoleNotification(alert, isResolved) {
    const prefix = isResolved ? '✅ ALERTA RESUELTA' : '🚨 NUEVA ALERTA';
    const color = alert.level === 'critical' ? '\x1b[31m' : '\x1b[33m'; // Rojo o amarillo
    const reset = '\x1b[0m';
    
    console.log(`${color}${prefix}: ${alert.message}${reset}`);
  }
  
  async sendLogNotification(alert, isResolved) {
    const logLevel = alert.level === 'critical' ? 'error' : 'warn';
    const prefix = isResolved ? 'Alerta resuelta' : 'Nueva alerta';
    
    loggingService[logLevel](`${prefix}: ${alert.message}`, {
      alertId: alert.id,
      metric: alert.metric,
      level: alert.level,
      currentValue: alert.currentValue,
      threshold: alert.threshold,
      isResolved
    });
  }
  
  async sendWebhookNotification(alert, isResolved) {
    try {
      const payload = {
        service: this.serviceName,
        alert: {
          ...alert,
          isResolved,
          timestamp: new Date(alert.timestamp).toISOString()
        }
      };
      
      const response = await fetch(this.webhookConfig.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `${this.serviceName}-alerting/1.0`
        },
        body: JSON.stringify(payload),
        timeout: this.webhookConfig.timeout
      });
      
      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }
      
      loggingService.debug('Webhook notification sent', {
        alertId: alert.id,
        webhookUrl: this.webhookConfig.url,
        status: response.status
      });
      
    } catch (error) {
      loggingService.error('Error enviando webhook notification', error, {
        alertId: alert.id,
        webhookUrl: this.webhookConfig.url
      });
    }
  }
  
  async sendEmailNotification(alert, isResolved) {
    // Implementación básica de email (requeriría nodemailer en producción)
    loggingService.info('Email notification would be sent', {
      alertId: alert.id,
      to: this.emailConfig.to,
      subject: `${isResolved ? '[RESOLVED]' : '[ALERT]'} ${alert.metric} - ${alert.level}`,
      message: alert.message
    });
  }
  
  cleanupResolvedAlerts(summary) {
    // Limpiar historial de alertas antiguas (mantener últimas 100)
    if (this.alertHistory.length > 100) {
      this.alertHistory = this.alertHistory.slice(-100);
    }
  }
  
  // Métodos públicos para gestión de alertas
  
  getActiveAlerts() {
    return Array.from(this.activeAlerts.values());
  }
  
  getAlertHistory(limit = 50) {
    return this.alertHistory.slice(-limit);
  }
  
  updateThreshold(metric, level, value) {
    if (this.thresholds[metric] && this.thresholds[metric][level] !== undefined) {
      this.thresholds[metric][level] = value;
      
      loggingService.info('Umbral de alerta actualizado', {
        metric,
        level,
        newValue: value
      });
      
      return true;
    }
    
    return false;
  }
  
  enableMetric(metric, enabled = true) {
    if (this.thresholds[metric]) {
      this.thresholds[metric].enabled = enabled;
      
      loggingService.info(`Métrica ${enabled ? 'habilitada' : 'deshabilitada'}`, {
        metric
      });
      
      return true;
    }
    
    return false;
  }
  
  getConfiguration() {
    return {
      thresholds: this.thresholds,
      checkInterval: this.checkInterval,
      alertCooldown: this.alertCooldown,
      notificationChannels: this.notificationChannels,
      activeAlertsCount: this.activeAlerts.size,
      alertHistoryCount: this.alertHistory.length
    };
  }
  
  // Método para testing
  triggerTestAlert(metric = 'responseTime', level = 'warning') {
    const alert = {
      id: `test_${metric}_${level}_${Date.now()}`,
      key: metric,
      metric,
      level,
      currentValue: 9999,
      threshold: 1000,
      timestamp: Date.now(),
      message: `TEST ALERT: ${metric} - ${level} level`
    };
    
    this.emit('alert', alert);
    
    return alert;
  }
}

// Instancia singleton del servicio de alertas
const alertingService = new AlertingService({
  serviceName: 'map-tracker-jw',
  checkInterval: 60000, // 1 minuto
  alertCooldown: 300000 // 5 minutos
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  alertingService.stopMonitoring();
});

process.on('SIGINT', () => {
  alertingService.stopMonitoring();
});

export default alertingService;