// frontend/js/components/ModuleLoader.js
// OPTIMIZACIÓN SPRINT 3: Sistema de Lazy Loading para Módulos

/**
 * Cargador de Módulos Dinámico
 * Implementa lazy loading, code splitting y tree shaking
 */
export class ModuleLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
    this.preloadQueue = [];
    this.performanceMetrics = {
      totalModules: 0,
      loadedModules: 0,
      loadTimes: [],
      cacheHits: 0
    };
    
    console.log('🚀 ModuleLoader inicializado con lazy loading');
  }
  
  /**
   * Cargar módulo de forma dinámica
   * @param {string} modulePath - Ruta del módulo
   * @param {Object} options - Opciones de carga
   * @returns {Promise} Módulo cargado
   */
  async loadModule(modulePath, options = {}) {
    const {
      cache = true,
      timeout = 10000,
      retries = 2,
      preload = false
    } = options;
    
    // Verificar si ya está cargado
    if (cache && this.loadedModules.has(modulePath)) {
      this.performanceMetrics.cacheHits++;
      console.log(`📦 Módulo desde caché: ${modulePath}`);
      return this.loadedModules.get(modulePath);
    }
    
    // Verificar si ya se está cargando
    if (this.loadingPromises.has(modulePath)) {
      console.log(`⏳ Esperando carga en progreso: ${modulePath}`);
      return this.loadingPromises.get(modulePath);
    }
    
    // Crear promesa de carga
    const loadPromise = this._loadModuleWithRetry(modulePath, timeout, retries);
    this.loadingPromises.set(modulePath, loadPromise);
    
    try {
      const startTime = performance.now();
      const module = await loadPromise;
      const loadTime = performance.now() - startTime;
      
      // Guardar en caché si está habilitado
      if (cache) {
        this.loadedModules.set(modulePath, module);
      }
      
      // Registrar métricas
      this.performanceMetrics.totalModules++;
      this.performanceMetrics.loadedModules++;
      this.performanceMetrics.loadTimes.push(loadTime);
      
      console.log(`✅ Módulo cargado: ${modulePath} (${loadTime.toFixed(2)}ms)`);
      
      return module;
      
    } catch (error) {
      console.error(`❌ Error cargando módulo ${modulePath}:`, error);
      throw error;
    } finally {
      this.loadingPromises.delete(modulePath);
    }
  }
  
  /**
   * Cargar módulo con reintentos
   * @private
   */
  async _loadModuleWithRetry(modulePath, timeout, retries) {
    let lastError;
    let hasLoggedRetry = false;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this._loadModuleWithTimeout(modulePath, timeout);
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // Backoff exponencial
          
          // OPTIMIZADO: Solo log del primer reintento para evitar spam
          if (!hasLoggedRetry) {
            console.log(`🔄 Reintentando carga de ${modulePath} (${retries + 1} intentos)`);
            hasLoggedRetry = true;
          }
          
          await this._delay(delay);
        }
      }
    }
    
    throw lastError;
  }
  
  /**
   * Cargar módulo con timeout
   * @private
   */
  async _loadModuleWithTimeout(modulePath, timeout) {
    return Promise.race([
      import(modulePath),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout cargando ${modulePath}`)), timeout);
      })
    ]);
  }
  
  /**
   * Precargar módulos en segundo plano
   * @param {Array} modulePaths - Lista de rutas de módulos
   */
  async preloadModules(modulePaths) {
    console.log(`🔮 Precargando ${modulePaths.length} módulos...`);
    
    const preloadPromises = modulePaths.map(async (modulePath) => {
      try {
        await this.loadModule(modulePath, { preload: true });
        console.log(`✨ Módulo precargado: ${modulePath}`);
      } catch (error) {
        console.warn(`⚠️ Error precargando ${modulePath}:`, error.message);
      }
    });
    
    await Promise.allSettled(preloadPromises);
    console.log('🎯 Precarga de módulos completada');
  }
  
  /**
   * Cargar módulo cuando sea necesario (lazy loading)
   * @param {string} modulePath - Ruta del módulo
   * @param {Function} condition - Condición para cargar
   * @returns {Promise} Módulo cargado cuando se cumpla la condición
   */
  async loadWhenNeeded(modulePath, condition) {
    return new Promise((resolve, reject) => {
      const checkCondition = async () => {
        if (condition()) {
          try {
            const module = await this.loadModule(modulePath);
            resolve(module);
          } catch (error) {
            reject(error);
          }
        } else {
          // Verificar cada 100ms
          setTimeout(checkCondition, 100);
        }
      };
      
      checkCondition();
    });
  }
  
  /**
   * Cargar módulo al hacer scroll cerca de un elemento
   * @param {string} modulePath - Ruta del módulo
   * @param {string} elementSelector - Selector del elemento
   * @param {number} threshold - Distancia en píxeles para activar la carga
   */
  loadOnScroll(modulePath, elementSelector, threshold = 200) {
    const element = document.querySelector(elementSelector);
    if (!element) {
      console.warn(`⚠️ Elemento no encontrado para lazy loading: ${elementSelector}`);
      return Promise.reject(new Error('Elemento no encontrado'));
    }
    
    return new Promise((resolve, reject) => {
      const observer = new IntersectionObserver(
        async (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting) {
            observer.disconnect();
            try {
              const module = await this.loadModule(modulePath);
              resolve(module);
            } catch (error) {
              reject(error);
            }
          }
        },
        {
          rootMargin: `${threshold}px`
        }
      );
      
      observer.observe(element);
    });
  }
  
  /**
   * Cargar módulo al hacer clic en un elemento
   * @param {string} modulePath - Ruta del módulo
   * @param {string} elementSelector - Selector del elemento
   */
  loadOnClick(modulePath, elementSelector) {
    const element = document.querySelector(elementSelector);
    if (!element) {
      console.warn(`⚠️ Elemento no encontrado para lazy loading: ${elementSelector}`);
      return Promise.reject(new Error('Elemento no encontrado'));
    }
    
    return new Promise((resolve, reject) => {
      const clickHandler = async () => {
        element.removeEventListener('click', clickHandler);
        try {
          const module = await this.loadModule(modulePath);
          resolve(module);
        } catch (error) {
          reject(error);
        }
      };
      
      element.addEventListener('click', clickHandler);
    });
  }
  
  /**
   * Obtener métricas de rendimiento
   */
  getPerformanceMetrics() {
    const avgLoadTime = this.performanceMetrics.loadTimes.length > 0
      ? this.performanceMetrics.loadTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.loadTimes.length
      : 0;
    
    return {
      ...this.performanceMetrics,
      avgLoadTime: Math.round(avgLoadTime * 100) / 100,
      cacheHitRate: this.performanceMetrics.totalModules > 0
        ? Math.round((this.performanceMetrics.cacheHits / this.performanceMetrics.totalModules) * 100)
        : 0,
      loadedModulesCount: this.loadedModules.size,
      activeLoadingCount: this.loadingPromises.size
    };
  }
  
  /**
   * Limpiar caché de módulos
   */
  clearCache() {
    this.loadedModules.clear();
    this.performanceMetrics.cacheHits = 0;
    console.log('🧹 Caché de módulos limpiado');
  }
  
  /**
   * Delay helper
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Obtener información de módulos cargados
   */
  getLoadedModulesInfo() {
    const modules = [];
    for (const [path, module] of this.loadedModules.entries()) {
      modules.push({
        path,
        exports: Object.keys(module),
        size: JSON.stringify(module).length
      });
    }
    return modules;
  }
}

// Instancia singleton del cargador de módulos
const moduleLoader = new ModuleLoader();

// Configurar precarga de módulos críticos
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Precargar módulos comunes después de que la página esté lista
    setTimeout(() => {
      const commonModules = [
        '../json-utils.js',
        '../ui.js'
      ];
      moduleLoader.preloadModules(commonModules);
    }, 1000);
  });
}

export default moduleLoader;