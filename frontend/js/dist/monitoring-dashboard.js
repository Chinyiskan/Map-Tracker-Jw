// frontend/js/monitoring-dashboard.js
// JavaScript para el dashboard de monitoreo en tiempo real
class MonitoringDashboard {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.refreshInterval = 30000; // 30 segundos
        this.autoRefreshEnabled = true;
        this.charts = {};
        this.previousData = {};
        this.alertThresholds = {
            responseTime: 1000, // ms
            memoryUsage: 80, // %
            errorRate: 5, // %
            cacheHitRate: 90 // %
        };
        this.init();
    }
    async init() {
        console.log('🔍 Inicializando Dashboard de Monitoreo...');
        // Configurar event listeners
        this.setupEventListeners();
        // Inicializar gráficos
        this.initializeCharts();
        // Cargar datos iniciales
        await this.refreshData();
        // Configurar auto-refresh
        this.setupAutoRefresh();
        console.log('✅ Dashboard de Monitoreo inicializado');
    }
    setupEventListeners() {
        // Auto-refresh toggle
        const autoRefreshCheckbox = document.getElementById('autoRefresh');
        autoRefreshCheckbox.addEventListener('change', (e) => {
            this.autoRefreshEnabled = e.target.checked;
            if (this.autoRefreshEnabled) {
                this.setupAutoRefresh();
            }
            else {
                clearInterval(this.refreshTimer);
            }
        });
        // Manual refresh button
        window.refreshData = () => this.refreshData();
    }
    setupAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        if (this.autoRefreshEnabled) {
            this.refreshTimer = setInterval(() => {
                this.refreshData();
            }, this.refreshInterval);
        }
    }
    async refreshData() {
        try {
            this.setLoadingState(true);
            // Obtener datos de múltiples endpoints
            const [healthData, metricsData, statusData] = await Promise.all([
                this.fetchHealthData(),
                this.fetchMetricsData(),
                this.fetchStatusData()
            ]);
            // Actualizar UI
            this.updateSystemStatus(healthData);
            this.updateMetrics(metricsData);
            this.updateSystemInfo(statusData);
            this.updateCharts(metricsData);
            this.checkAlerts(metricsData);
            // Actualizar timestamp
            document.getElementById('lastUpdate').textContent = new Date().toLocaleString('es-ES');
            this.setLoadingState(false);
        }
        catch (error) {
            console.error('❌ Error actualizando datos:', error);
            this.showError('Error al actualizar datos del dashboard');
            this.setLoadingState(false);
        }
    }
    async fetchHealthData() {
        const response = await fetch(`${this.apiBaseUrl}/health/detailed`);
        if (!response.ok)
            throw new Error('Error fetching health data');
        return await response.json();
    }
    async fetchMetricsData() {
        const response = await fetch(`${this.apiBaseUrl}/metrics`);
        if (!response.ok)
            throw new Error('Error fetching metrics data');
        return await response.json();
    }
    async fetchStatusData() {
        const response = await fetch(`${this.apiBaseUrl}/status`);
        if (!response.ok)
            throw new Error('Error fetching status data');
        return await response.json();
    }
    updateSystemStatus(healthData) {
        const statusElement = document.getElementById('systemStatus');
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        // Determinar estado general
        let status = 'healthy';
        let statusIcon = '🟢';
        let statusMessage = 'Sistema Saludable';
        if (healthData.status === 'degraded') {
            status = 'warning';
            statusIcon = '🟡';
            statusMessage = 'Sistema Degradado';
        }
        else if (healthData.status === 'unhealthy') {
            status = 'error';
            statusIcon = '🔴';
            statusMessage = 'Sistema con Problemas';
        }
        statusDot.textContent = statusIcon;
        statusText.textContent = statusMessage;
        // Actualizar clases CSS
        statusElement.className = `status-indicator status-${status}`;
    }
    updateMetrics(data) {
        const metrics = data.metrics;
        // Requests por segundo
        const requestsPerSecond = this.calculateRequestsPerSecond(metrics.requests);
        this.updateMetricCard('requestsPerSecond', requestsPerSecond, 'req/s', 'requestsProgress', requestsPerSecond / 100 * 100);
        // Tiempo de respuesta promedio
        const avgResponseTime = parseFloat(metrics.performance.responseTime.avg) || 0;
        this.updateMetricCard('responseTime', avgResponseTime.toFixed(1), 'ms', 'responseTimeProgress', Math.min(avgResponseTime / 1000 * 100, 100));
        // Tasa de éxito
        const successRate = parseFloat(metrics.requests.successRate) || 0;
        this.updateMetricCard('successRate', successRate.toFixed(1), '%', 'successRateProgress', successRate);
        // Cache hit rate
        const cacheHitRate = parseFloat(metrics.cache.hitRate) || 0;
        this.updateMetricCard('cacheHitRate', cacheHitRate.toFixed(1), '%', 'cacheHitRateProgress', cacheHitRate);
        // Uso de memoria
        const memoryUsage = this.calculateMemoryUsagePercentage(metrics.system.memory);
        this.updateMetricCard('memoryUsage', memoryUsage.toFixed(1), 'MB', 'memoryUsageProgress', memoryUsage);
        // Uptime
        const uptimeHours = (metrics.system.uptime / 3600).toFixed(1);
        this.updateMetricCard('uptime', uptimeHours, 'h', 'uptimeProgress', 100);
        // Métricas de negocio
        this.updateBusinessMetrics(metrics.business);
    }
    updateMetricCard(valueId, value, unit, progressId, progressPercent) {
        const valueElement = document.getElementById(valueId);
        const progressElement = document.getElementById(progressId);
        if (valueElement) {
            valueElement.innerHTML = `${value}<span class="metric-unit">${unit}</span>`;
        }
        if (progressElement) {
            progressElement.style.width = `${Math.min(progressPercent, 100)}%`;
        }
        // Calcular cambio respecto al valor anterior
        const changeId = valueId + 'Change';
        const changeElement = document.getElementById(changeId);
        if (changeElement && this.previousData[valueId] !== undefined) {
            const previousValue = this.previousData[valueId];
            const change = value - previousValue;
            const changePercent = previousValue !== 0 ? (change / previousValue * 100).toFixed(1) : 0;
            if (change > 0) {
                changeElement.innerHTML = `<span class="change-positive">↗ +${changePercent}%</span>`;
            }
            else if (change < 0) {
                changeElement.innerHTML = `<span class="change-negative">↘ ${changePercent}%</span>`;
            }
            else {
                changeElement.innerHTML = `<span>→ Sin cambios</span>`;
            }
        }
        // Guardar valor actual para la próxima comparación
        this.previousData[valueId] = value;
    }
    updateBusinessMetrics(business) {
        document.getElementById('reportesCreados').textContent = business.reportesCreados || 0;
        document.getElementById('ciclosCompletados').textContent = business.ciclosCompletados || 0;
        document.getElementById('barriosActivos').textContent = business.barriosActivos || 0;
        document.getElementById('capitanesActivos').textContent = business.capitanesActivos || 0;
    }
    updateSystemInfo(statusData) {
        document.getElementById('systemVersion').textContent = statusData.version || '-';
        document.getElementById('systemEnvironment').textContent = statusData.environment || '-';
        document.getElementById('nodeVersion').textContent = statusData.system.nodeVersion || '-';
        document.getElementById('systemPlatform').textContent = statusData.system.platform || '-';
        document.getElementById('systemPid').textContent = statusData.system.pid || '-';
    }
    calculateRequestsPerSecond(requestsData) {
        // Calcular requests por segundo basado en el total y el uptime
        const total = requestsData.total || 0;
        const uptime = this.previousData.uptime || 1;
        return (total / uptime).toFixed(1);
    }
    calculateMemoryUsagePercentage(memoryData) {
        // Calcular porcentaje de uso de memoria
        const heapUsed = memoryData.heapUsed || 0;
        const heapTotal = memoryData.heapTotal || 1;
        return (heapUsed / heapTotal * 100);
    }
    initializeCharts() {
        // Configuración común para los gráficos
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    display: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        };
        // Gráfico de tiempo de respuesta
        const responseTimeCtx = document.getElementById('responseTimeChart').getContext('2d');
        this.charts.responseTime = new Chart(responseTimeCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                        label: 'Tiempo de Respuesta (ms)',
                        data: [],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
            },
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    y: {
                        ...commonOptions.scales.y,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Tiempo (ms)'
                        }
                    }
                }
            }
        });
        // Gráfico de throughput
        const throughputCtx = document.getElementById('throughputChart').getContext('2d');
        this.charts.throughput = new Chart(throughputCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                        label: 'Requests por Minuto',
                        data: [],
                        backgroundColor: '#10b981',
                        borderColor: '#059669',
                        borderWidth: 1
                    }]
            },
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    y: {
                        ...commonOptions.scales.y,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Requests/min'
                        }
                    }
                }
            }
        });
    }
    updateCharts(data) {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        // Actualizar gráfico de tiempo de respuesta
        const responseTime = parseFloat(data.metrics.performance.responseTime.avg) || 0;
        this.updateChart(this.charts.responseTime, timeLabel, responseTime, 20); // Mantener últimos 20 puntos
        // Actualizar gráfico de throughput
        const requestsPerMinute = this.calculateRequestsPerSecond(data.metrics.requests) * 60;
        this.updateChart(this.charts.throughput, timeLabel, requestsPerMinute, 10); // Mantener últimos 10 puntos
    }
    updateChart(chart, label, value, maxPoints) {
        chart.data.labels.push(label);
        chart.data.datasets[0].data.push(value);
        // Mantener solo los últimos N puntos
        if (chart.data.labels.length > maxPoints) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }
        chart.update('none'); // Actualizar sin animación para mejor performance
    }
    checkAlerts(data) {
        const alerts = [];
        const metrics = data.metrics;
        // Verificar tiempo de respuesta
        const avgResponseTime = parseFloat(metrics.performance.responseTime.avg) || 0;
        if (avgResponseTime > this.alertThresholds.responseTime) {
            alerts.push({
                type: 'warning',
                title: 'Tiempo de respuesta elevado',
                message: `Tiempo promedio: ${avgResponseTime.toFixed(1)}ms (umbral: ${this.alertThresholds.responseTime}ms)`
            });
        }
        // Verificar uso de memoria
        const memoryUsage = this.calculateMemoryUsagePercentage(metrics.system.memory);
        if (memoryUsage > this.alertThresholds.memoryUsage) {
            alerts.push({
                type: 'warning',
                title: 'Uso de memoria elevado',
                message: `Uso actual: ${memoryUsage.toFixed(1)}% (umbral: ${this.alertThresholds.memoryUsage}%)`
            });
        }
        // Verificar tasa de errores
        const errorRate = 100 - parseFloat(metrics.requests.successRate);
        if (errorRate > this.alertThresholds.errorRate) {
            alerts.push({
                type: 'error',
                title: 'Tasa de errores elevada',
                message: `Tasa de errores: ${errorRate.toFixed(1)}% (umbral: ${this.alertThresholds.errorRate}%)`
            });
        }
        // Verificar cache hit rate
        const cacheHitRate = parseFloat(metrics.cache.hitRate) || 0;
        if (cacheHitRate < this.alertThresholds.cacheHitRate) {
            alerts.push({
                type: 'warning',
                title: 'Cache hit rate bajo',
                message: `Hit rate actual: ${cacheHitRate.toFixed(1)}% (umbral: ${this.alertThresholds.cacheHitRate}%)`
            });
        }
        this.updateAlerts(alerts);
    }
    updateAlerts(alerts) {
        const container = document.getElementById('alertsContainer');
        // Limpiar alertas existentes (excepto la de sistema iniciado)
        const existingAlerts = container.querySelectorAll('.alert-item:not(.alert-info)');
        existingAlerts.forEach(alert => alert.remove());
        // Añadir nuevas alertas
        alerts.forEach(alert => {
            const alertElement = document.createElement('div');
            alertElement.className = `alert-item alert-${alert.type}`;
            const icon = alert.type === 'error' ? '🚨' : '⚠️';
            alertElement.innerHTML = `
        <span>${icon}</span>
        <div>
          <strong>${alert.title}</strong><br>
          <small>${alert.message}</small>
        </div>
      `;
            container.appendChild(alertElement);
        });
        // Si no hay alertas, mostrar mensaje de estado OK
        if (alerts.length === 0) {
            const noAlertsElement = document.createElement('div');
            noAlertsElement.className = 'alert-item alert-info';
            noAlertsElement.innerHTML = `
        <span>✅</span>
        <div>
          <strong>Sistema funcionando correctamente</strong><br>
          <small>Todas las métricas dentro de los umbrales normales</small>
        </div>
      `;
            container.appendChild(noAlertsElement);
        }
    }
    setLoadingState(loading) {
        const dashboard = document.querySelector('.monitoring-dashboard');
        if (loading) {
            dashboard.classList.add('loading');
        }
        else {
            dashboard.classList.remove('loading');
        }
    }
    showError(message) {
        const container = document.getElementById('alertsContainer');
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.innerHTML = `
      <strong>Error:</strong> ${message}<br>
      <small>Última actualización: ${new Date().toLocaleString('es-ES')}</small>
    `;
        container.insertBefore(errorElement, container.firstChild);
        // Remover el error después de 10 segundos
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.parentNode.removeChild(errorElement);
            }
        }, 10000);
    }
}
// Inicializar dashboard cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.monitoringDashboard = new MonitoringDashboard();
});
// Manejar visibilidad de la página para pausar/reanudar actualizaciones
document.addEventListener('visibilitychange', () => {
    if (window.monitoringDashboard) {
        if (document.hidden) {
            // Pausar actualizaciones cuando la página no es visible
            clearInterval(window.monitoringDashboard.refreshTimer);
        }
        else {
            // Reanudar actualizaciones cuando la página vuelve a ser visible
            window.monitoringDashboard.setupAutoRefresh();
            window.monitoringDashboard.refreshData();
        }
    }
});
//# sourceMappingURL=monitoring-dashboard.js.map