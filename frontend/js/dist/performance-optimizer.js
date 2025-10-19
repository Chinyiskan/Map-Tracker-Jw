// frontend/js/performance-optimizer.js
// OPTIMIZACIÓN SPRINT 3: Configuración Principal de Optimizaciones
/**
 * Optimizador de Performance Principal
 * Integra todas las optimizaciones del Sprint 3
 */
class PerformanceOptimizer {
    constructor() {
        this.moduleLoader = null;
        this.libraryLoader = null;
        this.resourceOptimizer = null;
        this.isInitialized = false;
        this.config = {
            enableLazyLoading: true,
            enableModuleSplitting: true,
            enableResourceOptimization: true,
            enableMetrics: true,
            preloadCriticalResources: true,
            compressionEnabled: true
        };
        console.log('🚀 PerformanceOptimizer inicializando...');
    }
    /**
     * Inicializar todas las optimizaciones
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('⚠️ PerformanceOptimizer ya está inicializado');
            return;
        }
        try {
            console.log('🔧 Inicializando optimizaciones de performance...');
            // Cargar módulos de optimización
            await this._loadOptimizationModules();
            // Configurar lazy loading de módulos
            if (this.config.enableModuleSplitting) {
                await this._setupModuleSplitting();
            }
            // Configurar optimización de recursos
            if (this.config.enableResourceOptimization) {
                await this._setupResourceOptimization();
            }
            // Precargar recursos críticos
            if (this.config.preloadCriticalResources) {
                await this._preloadCriticalResources();
            }
            // Configurar métricas de performance
            if (this.config.enableMetrics) {
                this._setupPerformanceMetrics();
            }
            // Configurar optimizaciones específicas por página
            this._setupPageSpecificOptimizations();
            this.isInitialized = true;
            console.log('✅ PerformanceOptimizer inicializado exitosamente');
            // Mostrar métricas iniciales
            this._logInitialMetrics();
        }
        catch (error) {
            console.error('❌ Error inicializando PerformanceOptimizer:', error);
        }
    }
    /**
     * Cargar módulos de optimización
     * @private
     */
    async _loadOptimizationModules() {
        try {
            // Cargar ModuleLoader
            const moduleLoaderModule = await import('./components/ModuleLoader.js');
            this.moduleLoader = moduleLoaderModule.default;
            // Cargar LazyLibraryLoader
            const libraryLoaderModule = await import('./components/LazyLibraryLoader.js');
            this.libraryLoader = libraryLoaderModule.default;
            // Cargar ResourceOptimizer
            const resourceOptimizerModule = await import('./components/ResourceOptimizer.js');
            this.resourceOptimizer = resourceOptimizerModule.default;
            console.log('📦 Módulos de optimización cargados');
        }
        catch (error) {
            console.error('❌ Error cargando módulos de optimización:', error);
            throw error;
        }
    }
    /**
     * Configurar code splitting y lazy loading de módulos
     * @private
     */
    async _setupModuleSplitting() {
        if (!this.moduleLoader)
            return;
        // Configurar lazy loading para módulos pesados
        const heavyModules = [
            './barrios-progress-chart.js',
            './grafica-progreso-barrios.js',
            './monitoring-dashboard.js',
            './resumenMensual.js'
        ];
        // Precargar módulos comunes después de un delay
        setTimeout(() => {
            const commonModules = [
                '../json-utils.js',
                '../ui.js',
                '../supabase.js'
            ];
            this.moduleLoader.preloadModules(commonModules);
        }, 2000);
        console.log('🔀 Code splitting configurado');
    }
    /**
     * Configurar optimización de recursos
     * @private
     */
    async _setupResourceOptimization() {
        if (!this.resourceOptimizer)
            return;
        // El ResourceOptimizer ya se configura automáticamente
        // Aquí podemos agregar configuraciones adicionales
        // Precargar imágenes críticas
        const criticalImages = [
            './assets/sun.svg',
            './assets/moon.svg'
            // Agregar más imágenes críticas según sea necesario
        ];
        if (criticalImages.length > 0) {
            await this.resourceOptimizer.preloadCriticalImages(criticalImages);
        }
        console.log('🖼️ Optimización de recursos configurada');
    }
    /**
     * Precargar recursos críticos
     * @private
     */
    async _preloadCriticalResources() {
        // Precargar librerías que probablemente se usarán
        const currentPage = window.location.pathname;
        if (currentPage.includes('admin') || currentPage.includes('reportes')) {
            // Precargar Chart.js para gráficos
            setTimeout(() => {
                this.libraryLoader?.preloadLibraries(['chartjs']);
            }, 3000);
        }
        if (currentPage.includes('admin')) {
            // Precargar jsPDF para reportes
            setTimeout(() => {
                this.libraryLoader?.preloadLibraries(['jspdf', 'jspdf-autotable']);
            }, 5000);
        }
        console.log('🔮 Recursos críticos configurados para precarga');
    }
    /**
     * Configurar métricas de performance
     * @private
     */
    _setupPerformanceMetrics() {
        // Monitorear Core Web Vitals
        this._monitorCoreWebVitals();
        // OPTIMIZADO: Reporte de métricas menos frecuente y solo en desarrollo
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Solo en desarrollo: reporte cada 5 minutos en lugar de 30 segundos
            setInterval(() => {
                this._reportPerformanceMetrics();
            }, 300000); // 5 minutos
        }
        console.log('📊 Métricas de performance configuradas (modo optimizado)');
    }
    /**
     * Monitorear Core Web Vitals
     * @private
     */
    _monitorCoreWebVitals() {
        // Largest Contentful Paint (LCP) - Solo log inicial
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('📏 LCP:', lastEntry.startTime.toFixed(2) + 'ms');
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        // First Input Delay (FID) - Solo log cuando ocurre
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                console.log('⚡ FID:', entry.processingStart - entry.startTime + 'ms');
            });
        }).observe({ entryTypes: ['first-input'] });
        // Cumulative Layout Shift (CLS) - OPTIMIZADO: Solo log significativo
        let clsValue = 0;
        let lastLoggedCLS = 0;
        let clsLogCount = 0;
        const CLS_LOG_THRESHOLD = 0.1; // Solo log si cambia más de 0.1
        const MAX_CLS_LOGS = 5; // Máximo 5 logs de CLS por sesión
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
            // Solo log si hay cambio significativo y no hemos excedido el límite
            if (clsLogCount < MAX_CLS_LOGS &&
                Math.abs(clsValue - lastLoggedCLS) >= CLS_LOG_THRESHOLD) {
                console.log('📐 CLS:', clsValue.toFixed(4));
                lastLoggedCLS = clsValue;
                clsLogCount++;
                if (clsLogCount === MAX_CLS_LOGS) {
                    console.log('📐 CLS logging limitado para evitar spam. Valor final:', clsValue.toFixed(4));
                }
            }
        }).observe({ entryTypes: ['layout-shift'] });
    }
    /**
     * Reportar métricas de performance
     * @private
     */
    _reportPerformanceMetrics() {
        const metrics = {
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            moduleLoader: this.moduleLoader?.getPerformanceMetrics(),
            resourceOptimizer: this.resourceOptimizer?.getPerformanceMetrics(),
            libraryLoader: this.libraryLoader?.getLoadedLibrariesInfo(),
            memory: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
            } : null,
            navigation: performance.getEntriesByType('navigation')[0]
        };
        console.log('📊 Métricas de Performance:', metrics);
        // Enviar métricas al servidor si está configurado
        this._sendMetricsToServer(metrics);
    }
    /**
     * Enviar métricas al servidor
     * @private
     */
    async _sendMetricsToServer(metrics) {
        try {
            // Solo enviar en producción y con una probabilidad del 10%
            if (window.location.hostname === 'localhost' || Math.random() > 0.1) {
                return;
            }
            await fetch('/api/metrics/client', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metrics)
            });
        }
        catch (error) {
            // Silenciar errores de métricas para no afectar la experiencia
            console.debug('📊 Error enviando métricas:', error.message);
        }
    }
    /**
     * Configurar optimizaciones específicas por página
     * @private
     */
    _setupPageSpecificOptimizations() {
        const currentPage = window.location.pathname;
        if (currentPage.includes('admin')) {
            this._optimizeAdminPage();
        }
        else if (currentPage.includes('reportes')) {
            this._optimizeReportesPage();
        }
        else if (currentPage.includes('mapa')) {
            this._optimizeMapaPage();
        }
        else {
            this._optimizeGeneralPage();
        }
    }
    /**
     * Optimizar página de administración
     * @private
     */
    _optimizeAdminPage() {
        // Lazy load del dashboard de monitoreo
        setTimeout(() => {
            const monitoringSection = document.querySelector('#monitoring-section');
            if (monitoringSection) {
                this.moduleLoader?.loadOnScroll('../monitoring-dashboard.js', '#monitoring-section');
            }
        }, 1000);
        console.log('👑 Optimizaciones para página admin aplicadas');
    }
    /**
     * Optimizar página de reportes
     * @private
     */
    _optimizeReportesPage() {
        // Precargar módulos de gráficos
        setTimeout(() => {
            this.moduleLoader?.preloadModules(['../grafica-progreso-barrios.js']);
        }, 2000);
        console.log('📊 Optimizaciones para página reportes aplicadas');
    }
    /**
     * Optimizar página de mapa
     * @private
     */
    _optimizeMapaPage() {
        // Lazy load de funcionalidades del mapa
        setTimeout(() => {
            this.moduleLoader?.preloadModules(['../mapa_reporte.js']);
        }, 1000);
        console.log('🗺️ Optimizaciones para página mapa aplicadas');
    }
    /**
     * Optimizar páginas generales
     * @private
     */
    _optimizeGeneralPage() {
        // Optimizaciones básicas
        console.log('🌐 Optimizaciones generales aplicadas');
    }
    /**
     * Mostrar métricas iniciales
     * @private
     */
    _logInitialMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        console.log('🚀 Métricas Iniciales de Performance:');
        console.log(`   📄 Página: ${window.location.pathname}`);
        console.log(`   ⏱️ DOM Content Loaded: ${navigation.domContentLoadedEventEnd.toFixed(2)}ms`);
        console.log(`   🏁 Load Complete: ${navigation.loadEventEnd.toFixed(2)}ms`);
        if (performance.memory) {
            console.log(`   💾 Memoria JS: ${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)}MB`);
        }
    }
    /**
     * Obtener estado de las optimizaciones
     */
    getOptimizationStatus() {
        return {
            initialized: this.isInitialized,
            config: this.config,
            moduleLoader: {
                loaded: !!this.moduleLoader,
                metrics: this.moduleLoader?.getPerformanceMetrics()
            },
            libraryLoader: {
                loaded: !!this.libraryLoader,
                libraries: this.libraryLoader?.getLoadedLibrariesInfo()
            },
            resourceOptimizer: {
                loaded: !!this.resourceOptimizer,
                metrics: this.resourceOptimizer?.getPerformanceMetrics()
            }
        };
    }
}
// Crear instancia global del optimizador
window.performanceOptimizer = new PerformanceOptimizer();
// Inicializar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.performanceOptimizer.initialize();
    });
}
else {
    window.performanceOptimizer.initialize();
}
// Exportar para uso en módulos
export default window.performanceOptimizer;
//# sourceMappingURL=performance-optimizer.js.map