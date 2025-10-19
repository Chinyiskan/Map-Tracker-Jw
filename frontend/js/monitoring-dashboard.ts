/**
 * Dashboard de Monitoreo del Sistema
 * Migrado de monitoring-dashboard.js a TypeScript
 */

import {
  MonitoringDashboardInterface,
  HealthData,
  MetricsData,
  StatusData,
  SystemAlert,
  AlertThresholds,
  RequestMetrics,
  MemoryInfo,
  BusinessMetrics
} from './types/index.js';

/**
 * Clase principal del Dashboard de Monitoreo
 */
export class MonitoringDashboard implements MonitoringDashboardInterface {
  public apiBaseUrl: string;
  public refreshInterval: number;
  public autoRefreshEnabled: boolean;
  public charts: Record<string, any>;
  public previousData: Record<string, number>;
  public alertThresholds: AlertThresholds;
  public refreshTimer?: NodeJS.Timeout;

  constructor(apiBaseUrl: string = '/api') {
    this.apiBaseUrl = apiBaseUrl;
    this.refreshInterval = 30000; // 30 segundos
    this.autoRefreshEnabled = true;
    this.charts = {};
    this.previousData = {};
    this.alertThresholds = {
      responseTime: 1000, // 1 segundo
      memoryUsage: 80, // 80%
      errorRate: 5, // 5%
      cacheHitRate: 70 // 70%
    };
  }

  /**
   * Inicializa el dashboard
   */
  async init(): Promise<void> {
    try {
      this.setupEventListeners();
      this.initializeCharts();
      await this.refreshData();
      this.setupAutoRefresh();
    } catch (error) {
      console.error('Error inicializando dashboard:', error);
      this.showError('Error al inicializar el dashboard de monitoreo');
    }
  }

  /**
   * Configura los event listeners
   */
  setupEventListeners(): void {
    // Botón de refresh manual
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshData());
    }

    // Toggle auto-refresh
    const autoRefreshToggle = document.getElementById('auto-refresh-toggle') as HTMLInputElement;
    if (autoRefreshToggle) {
      autoRefreshToggle.checked = this.autoRefreshEnabled;
      autoRefreshToggle.addEventListener('change', (e) => {
        this.autoRefreshEnabled = (e.target as HTMLInputElement).checked;
        this.setupAutoRefresh();
      });
    }

    // Selector de intervalo
    const intervalSelect = document.getElementById('refresh-interval') as HTMLSelectElement;
    if (intervalSelect) {
      intervalSelect.value = this.refreshInterval.toString();
      intervalSelect.addEventListener('change', (e) => {
        this.refreshInterval = parseInt((e.target as HTMLSelectElement).value);
        this.setupAutoRefresh();
      });
    }
  }

  /**
   * Configura el auto-refresh
   */
  setupAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    if (this.autoRefreshEnabled) {
      this.refreshTimer = setInterval(() => {
        this.refreshData();
      }, this.refreshInterval);
    }
  }

  /**
   * Inicializa los gráficos
   */
  initializeCharts(): void {
    // Verificar si Chart.js está disponible
    if (typeof (window as any).Chart === 'undefined') {
      console.warn('Chart.js no está disponible');
      return;
    }

    const Chart = (window as any).Chart;

    // Gráfico de tiempo de respuesta
    const responseTimeCtx = document.getElementById('response-time-chart') as HTMLCanvasElement;
    if (responseTimeCtx) {
      this.charts.responseTime = new Chart(responseTimeCtx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Tiempo de Respuesta (ms)',
            data: [],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            x: {
              display: true,
              grid: {
                display: false
              }
            },
            y: {
              display: true,
              beginAtZero: true,
              grid: {
                display: true
              },
              title: {
                display: true,
                text: 'Milisegundos'
              }
            }
          },
          animation: {
            duration: 750
          }
        }
      });
    }

    // Gráfico de requests por segundo
    const requestsCtx = document.getElementById('requests-chart') as HTMLCanvasElement;
    if (requestsCtx) {
      this.charts.requests = new Chart(requestsCtx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Requests/seg',
            data: [],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            x: {
              display: true,
              grid: {
                display: false
              }
            },
            y: {
              display: true,
              beginAtZero: true,
              grid: {
                display: true
              },
              title: {
                display: true,
                text: 'Requests/seg'
              }
            }
          },
          animation: {
            duration: 750
          }
        }
      });
    }

    // Gráfico de uso de memoria
    const memoryCtx = document.getElementById('memory-chart') as HTMLCanvasElement;
    if (memoryCtx) {
      this.charts.memory = new Chart(memoryCtx, {
        type: 'doughnut',
        data: {
          labels: ['Usado', 'Libre'],
          datasets: [{
            data: [0, 100],
            backgroundColor: ['#ef4444', '#e5e7eb'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'bottom'
            },
            tooltip: {
              enabled: true
            }
          },
          animation: {
            duration: 750
          }
        }
      });
    }
  }

  /**
   * Refresca todos los datos
   */
  async refreshData(): Promise<void> {
    this.setLoadingState(true);

    try {
      const [healthData, metricsData, statusData] = await Promise.all([
        this.fetchHealthData(),
        this.fetchMetricsData(),
        this.fetchStatusData()
      ]);

      this.updateSystemStatus(healthData);
      this.updateMetrics(metricsData);
      this.updateSystemInfo(statusData);
      this.updateCharts(metricsData);
      this.checkAlerts(metricsData);

      // Actualizar timestamp de última actualización
      const lastUpdateElement = document.getElementById('last-update');
      if (lastUpdateElement) {
        lastUpdateElement.textContent = new Date().toLocaleTimeString();
      }

    } catch (error) {
      console.error('Error refrescando datos:', error);
      this.showError('Error al obtener datos del servidor');
    } finally {
      this.setLoadingState(false);
    }
  }

  /**
   * Obtiene datos de salud del sistema
   */
  async fetchHealthData(): Promise<HealthData> {
    const response = await fetch(`${this.apiBaseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Obtiene métricas del sistema
   */
  async fetchMetricsData(): Promise<MetricsData> {
    const response = await fetch(`${this.apiBaseUrl}/metrics`);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Obtiene estado del sistema
   */
  async fetchStatusData(): Promise<StatusData> {
    const response = await fetch(`${this.apiBaseUrl}/status`);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Actualiza el estado del sistema
   */
  updateSystemStatus(healthData: HealthData): void {
    const statusElement = document.getElementById('system-status');
    const statusBadge = document.getElementById('status-badge');
    
    if (statusElement && statusBadge) {
      statusElement.textContent = healthData.status;
      
      // Remover clases anteriores
      statusBadge.className = 'status-badge';
      
      // Agregar clase según estado
      switch (healthData.status) {
        case 'healthy':
          statusBadge.classList.add('status-healthy');
          break;
        case 'degraded':
          statusBadge.classList.add('status-warning');
          break;
        case 'unhealthy':
          statusBadge.classList.add('status-error');
          break;
      }
    }

    // Actualizar checks de salud
    const checksContainer = document.getElementById('health-checks');
    if (checksContainer && healthData.checks) {
      checksContainer.innerHTML = '';
      
      healthData.checks.forEach(check => {
        const checkElement = document.createElement('div');
        checkElement.className = `health-check health-check-${check.status}`;
        checkElement.innerHTML = `
          <span class="check-name">${check.name}</span>
          <span class="check-status">${check.status}</span>
          ${check.message ? `<span class="check-message">${check.message}</span>` : ''}
        `;
        checksContainer.appendChild(checkElement);
      });
    }
  }

  /**
   * Actualiza las métricas
   */
  updateMetrics(data: MetricsData): void {
    const { metrics } = data;

    // Requests por segundo
    const requestsPerSecond = this.calculateRequestsPerSecond(metrics.requests);
    this.updateMetricCard('requests-per-second', requestsPerSecond, 'req/s', 'requests-progress', 
      Math.min((requestsPerSecond / 100) * 100, 100));

    // Tiempo de respuesta promedio
    this.updateMetricCard('avg-response-time', metrics.performance.responseTime.avg, 'ms', 
      'response-time-progress', Math.min((metrics.performance.responseTime.avg / 1000) * 100, 100));

    // Tasa de éxito
    this.updateMetricCard('success-rate', metrics.requests.successRate, '%', 'success-rate-progress', 
      metrics.requests.successRate);

    // Cache hit rate
    this.updateMetricCard('cache-hit-rate', metrics.cache.hitRate, '%', 'cache-hit-progress', 
      metrics.cache.hitRate);

    // Uso de memoria
    const memoryPercentage = this.calculateMemoryUsagePercentage(metrics.system.memory);
    this.updateMetricCard('memory-usage', memoryPercentage, '%', 'memory-progress', memoryPercentage);

    // Uptime
    const uptimeHours = Math.floor(metrics.system.uptime / 3600);
    this.updateMetricCard('uptime', uptimeHours, 'h', 'uptime-progress', 
      Math.min((uptimeHours / 24) * 100, 100));

    // Actualizar métricas de negocio
    this.updateBusinessMetrics(metrics.business);
  }

  /**
   * Actualiza una tarjeta de métrica
   */
  updateMetricCard(valueId: string, value: number, unit: string, progressId: string, progressPercent: number): void {
    const valueElement = document.getElementById(valueId);
    const progressElement = document.getElementById(progressId);

    if (valueElement) {
      const formattedValue = typeof value === 'number' ? value.toFixed(1) : value;
      valueElement.textContent = `${formattedValue} ${unit}`;
    }

    if (progressElement) {
      progressElement.style.width = `${Math.min(Math.max(progressPercent, 0), 100)}%`;
    }

    // Calcular y mostrar cambio respecto a datos anteriores
    const changeElement = document.getElementById(`${valueId}-change`);
    if (changeElement && this.previousData[valueId] !== undefined) {
      const previousValue = this.previousData[valueId];
      const change = value - previousValue;
      const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;
      
      changeElement.textContent = `${change >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`;
      changeElement.className = `metric-change ${change >= 0 ? 'positive' : 'negative'}`;
    }

    // Guardar valor actual para próxima comparación
    this.previousData[valueId] = value;
  }

  /**
   * Actualiza métricas de negocio
   */
  updateBusinessMetrics(business: BusinessMetrics): void {
    this.updateMetricCard('reportes-creados', business.reportesCreados, '', 'reportes-progress', 
      Math.min((business.reportesCreados / 100) * 100, 100));
    
    this.updateMetricCard('ciclos-completados', business.ciclosCompletados, '', 'ciclos-progress', 
      Math.min((business.ciclosCompletados / 10) * 100, 100));
    
    this.updateMetricCard('barrios-activos', business.barriosActivos, '', 'barrios-progress', 
      Math.min((business.barriosActivos / 50) * 100, 100));
    
    this.updateMetricCard('capitanes-activos', business.capitanesActivos, '', 'capitanes-progress', 
      Math.min((business.capitanesActivos / 20) * 100, 100));
  }

  /**
   * Actualiza información del sistema
   */
  updateSystemInfo(statusData: StatusData): void {
    const versionElement = document.getElementById('system-version');
    const environmentElement = document.getElementById('system-environment');
    const platformElement = document.getElementById('system-platform');
    const nodeVersionElement = document.getElementById('node-version');

    if (versionElement) versionElement.textContent = statusData.version;
    if (environmentElement) environmentElement.textContent = statusData.environment;
    if (platformElement) platformElement.textContent = statusData.system.platform;
    if (nodeVersionElement) nodeVersionElement.textContent = statusData.system.nodeVersion;
  }

  /**
   * Actualiza los gráficos
   */
  updateCharts(data: MetricsData): void {
    const timestamp = new Date(data.timestamp).toLocaleTimeString();

    // Actualizar gráfico de tiempo de respuesta
    if (this.charts.responseTime) {
      this.updateChart(this.charts.responseTime, timestamp, data.metrics.performance.responseTime.avg, 20);
    }

    // Actualizar gráfico de requests
    if (this.charts.requests) {
      const requestsPerSecond = this.calculateRequestsPerSecond(data.metrics.requests);
      this.updateChart(this.charts.requests, timestamp, requestsPerSecond, 20);
    }

    // Actualizar gráfico de memoria
    if (this.charts.memory) {
      const memoryPercentage = this.calculateMemoryUsagePercentage(data.metrics.system.memory);
      this.charts.memory.data.datasets[0].data = [memoryPercentage, 100 - memoryPercentage];
      this.charts.memory.update();
    }
  }

  /**
   * Actualiza un gráfico específico
   */
  updateChart(chart: any, label: string, value: number, maxPoints: number): void {
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(value);

    // Mantener solo los últimos maxPoints puntos
    if (chart.data.labels.length > maxPoints) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }

    chart.update();
  }

  /**
   * Verifica alertas
   */
  checkAlerts(data: MetricsData): void {
    const alerts: SystemAlert[] = [];
    const { metrics } = data;

    // Verificar tiempo de respuesta
    if (metrics.performance.responseTime.avg > this.alertThresholds.responseTime) {
      alerts.push({
        type: 'warning',
        title: 'Tiempo de respuesta alto',
        message: `El tiempo de respuesta promedio es ${metrics.performance.responseTime.avg}ms`,
        timestamp: new Date().toISOString(),
        metric: 'responseTime',
        value: metrics.performance.responseTime.avg,
        threshold: this.alertThresholds.responseTime
      });
    }

    // Verificar uso de memoria
    const memoryPercentage = this.calculateMemoryUsagePercentage(metrics.system.memory);
    if (memoryPercentage > this.alertThresholds.memoryUsage) {
      alerts.push({
        type: 'error',
        title: 'Uso de memoria alto',
        message: `El uso de memoria es ${memoryPercentage.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        metric: 'memoryUsage',
        value: memoryPercentage,
        threshold: this.alertThresholds.memoryUsage
      });
    }

    // Verificar tasa de error
    if (metrics.performance.errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        type: 'error',
        title: 'Tasa de error alta',
        message: `La tasa de error es ${metrics.performance.errorRate.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        metric: 'errorRate',
        value: metrics.performance.errorRate,
        threshold: this.alertThresholds.errorRate
      });
    }

    // Verificar cache hit rate
    if (metrics.cache.hitRate < this.alertThresholds.cacheHitRate) {
      alerts.push({
        type: 'warning',
        title: 'Cache hit rate bajo',
        message: `El cache hit rate es ${metrics.cache.hitRate.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        metric: 'cacheHitRate',
        value: metrics.cache.hitRate,
        threshold: this.alertThresholds.cacheHitRate
      });
    }

    this.updateAlerts(alerts);
  }

  /**
   * Actualiza las alertas en la UI
   */
  updateAlerts(alerts: SystemAlert[]): void {
    const alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) return;

    alertsContainer.innerHTML = '';

    if (alerts.length === 0) {
      alertsContainer.innerHTML = '<div class="no-alerts">No hay alertas activas</div>';
      return;
    }

    alerts.forEach(alert => {
      const alertElement = document.createElement('div');
      alertElement.className = `alert alert-${alert.type}`;
      alertElement.innerHTML = `
        <div class="alert-header">
          <span class="alert-title">${alert.title}</span>
          <span class="alert-time">${new Date(alert.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="alert-message">${alert.message}</div>
      `;
      alertsContainer.appendChild(alertElement);
    });
  }

  /**
   * Calcula requests por segundo
   */
  calculateRequestsPerSecond(requests: RequestMetrics): number {
    return requests.perSecond || 0;
  }

  /**
   * Calcula porcentaje de uso de memoria
   */
  calculateMemoryUsagePercentage(memory: MemoryInfo): number {
    return memory.percentage || ((memory.used / memory.total) * 100);
  }

  /**
   * Establece estado de carga
   */
  setLoadingState(loading: boolean): void {
    const loadingIndicator = document.getElementById('loading-indicator');
    const refreshBtn = document.getElementById('refresh-btn') as HTMLButtonElement;

    if (loadingIndicator) {
      loadingIndicator.style.display = loading ? 'block' : 'none';
    }

    if (refreshBtn) {
      refreshBtn.disabled = loading;
      refreshBtn.textContent = loading ? 'Cargando...' : 'Actualizar';
    }
  }

  /**
   * Muestra un error
   */
  showError(message: string): void {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
      errorContainer.innerHTML = `
        <div class="error-message">
          <span class="error-icon">⚠️</span>
          <span class="error-text">${message}</span>
          <button class="error-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
        </div>
      `;
      errorContainer.style.display = 'block';

      // Auto-ocultar después de 5 segundos
      setTimeout(() => {
        errorContainer.style.display = 'none';
      }, 5000);
    }
  }
}

// Exportar para uso global
declare global {
  interface Window {
    MonitoringDashboard: typeof MonitoringDashboard;
  }
}

window.MonitoringDashboard = MonitoringDashboard;