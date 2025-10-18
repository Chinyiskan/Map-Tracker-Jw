// frontend/js/components/LazyLibraryLoader.js
// OPTIMIZACIÓN SPRINT 3: Cargador Lazy de Librerías Externas

/**
 * Cargador Lazy de Librerías Externas
 * Carga librerías pesadas solo cuando son necesarias
 */
export class LazyLibraryLoader {
  constructor() {
    this.loadedLibraries = new Map();
    this.loadingPromises = new Map();
    this.libraryConfigs = new Map();
    
    // Configurar librerías disponibles
    this._setupLibraryConfigs();
    
    console.log('📚 LazyLibraryLoader inicializado');
  }
  
  /**
   * Configurar librerías disponibles
   * @private
   */
  _setupLibraryConfigs() {
    // Chart.js para gráficos
    this.libraryConfigs.set('chartjs', {
      name: 'Chart.js',
      url: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js',
      globalName: 'Chart',
      size: '~180KB',
      dependencies: []
    });
    
    // jsPDF para generación de PDFs
    this.libraryConfigs.set('jspdf', {
      name: 'jsPDF',
      url: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
      globalName: 'jsPDF',
      size: '~500KB',
      dependencies: []
    });
    
    // jsPDF AutoTable para tablas en PDF
    this.libraryConfigs.set('jspdf-autotable', {
      name: 'jsPDF AutoTable',
      url: './js/jspdf.plugin.autotable.min.js',
      globalName: 'jsPDFAutoTable',
      size: '~50KB',
      dependencies: ['jspdf']
    });
    
    // Leaflet para mapas (si se usa)
    this.libraryConfigs.set('leaflet', {
      name: 'Leaflet',
      url: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
      globalName: 'L',
      size: '~150KB',
      dependencies: [],
      css: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    });
    
    // Moment.js para manejo de fechas (si se usa)
    this.libraryConfigs.set('moment', {
      name: 'Moment.js',
      url: 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js',
      globalName: 'moment',
      size: '~70KB',
      dependencies: []
    });
  }
  
  /**
   * Cargar librería de forma lazy
   * @param {string} libraryKey - Clave de la librería
   * @param {Object} options - Opciones de carga
   * @returns {Promise} Librería cargada
   */
  async loadLibrary(libraryKey, options = {}) {
    const {
      timeout = 15000,
      retries = 2,
      fallback = null
    } = options;
    
    // Verificar si ya está cargada
    if (this.loadedLibraries.has(libraryKey)) {
      console.log(`📦 Librería desde caché: ${libraryKey}`);
      return this.loadedLibraries.get(libraryKey);
    }
    
    // Verificar si ya se está cargando
    if (this.loadingPromises.has(libraryKey)) {
      console.log(`⏳ Esperando carga de librería: ${libraryKey}`);
      return this.loadingPromises.get(libraryKey);
    }
    
    const config = this.libraryConfigs.get(libraryKey);
    if (!config) {
      throw new Error(`Librería no configurada: ${libraryKey}`);
    }
    
    console.log(`🔄 Cargando librería: ${config.name} (${config.size})`);
    
    // Crear promesa de carga
    const loadPromise = this._loadLibraryWithDependencies(libraryKey, timeout, retries, fallback);
    this.loadingPromises.set(libraryKey, loadPromise);
    
    try {
      const library = await loadPromise;
      this.loadedLibraries.set(libraryKey, library);
      console.log(`✅ Librería cargada: ${config.name}`);
      return library;
    } catch (error) {
      console.error(`❌ Error cargando librería ${config.name}:`, error);
      throw error;
    } finally {
      this.loadingPromises.delete(libraryKey);
    }
  }
  
  /**
   * Cargar librería con dependencias
   * @private
   */
  async _loadLibraryWithDependencies(libraryKey, timeout, retries, fallback) {
    const config = this.libraryConfigs.get(libraryKey);
    
    // Cargar dependencias primero
    if (config.dependencies && config.dependencies.length > 0) {
      console.log(`📋 Cargando dependencias para ${config.name}:`, config.dependencies);
      
      for (const dependency of config.dependencies) {
        await this.loadLibrary(dependency, { timeout, retries });
      }
    }
    
    // Cargar CSS si es necesario
    if (config.css) {
      await this._loadCSS(config.css);
    }
    
    // Cargar la librería principal
    return await this._loadScript(config, timeout, retries, fallback);
  }
  
  /**
   * Cargar script con reintentos
   * @private
   */
  async _loadScript(config, timeout, retries, fallback) {
    let lastError;
    let hasLoggedRetry = false;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this._loadScriptWithTimeout(config, timeout);
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          
          // OPTIMIZADO: Solo log del primer reintento para evitar spam
          if (!hasLoggedRetry) {
            console.log(`🔄 Reintentando carga de ${config.name} (${retries + 1} intentos)`);
            hasLoggedRetry = true;
          }
          
          await this._delay(delay);
        }
      }
    }
    
    // Intentar fallback si está disponible
    if (fallback) {
      console.log(`🔄 Intentando fallback para ${config.name}`);
      try {
        return await fallback();
      } catch (fallbackError) {
        console.error(`❌ Fallback también falló para ${config.name}:`, fallbackError);
      }
    }
    
    throw lastError;
  }
  
  /**
   * Cargar script con timeout
   * @private
   */
  async _loadScriptWithTimeout(config, timeout) {
    return new Promise((resolve, reject) => {
      // Verificar si ya está disponible globalmente
      if (config.globalName && window[config.globalName]) {
        resolve(window[config.globalName]);
        return;
      }
      
      const script = document.createElement('script');
      script.src = config.url;
      script.async = true;
      
      const timeoutId = setTimeout(() => {
        script.remove();
        reject(new Error(`Timeout cargando ${config.name}`));
      }, timeout);
      
      script.onload = () => {
        clearTimeout(timeoutId);
        
        // Verificar que la librería esté disponible
        if (config.globalName && window[config.globalName]) {
          resolve(window[config.globalName]);
        } else {
          reject(new Error(`Librería ${config.name} no disponible después de la carga`));
        }
      };
      
      script.onerror = () => {
        clearTimeout(timeoutId);
        script.remove();
        reject(new Error(`Error cargando script ${config.name}`));
      };
      
      document.head.appendChild(script);
    });
  }
  
  /**
   * Cargar CSS
   * @private
   */
  async _loadCSS(url) {
    return new Promise((resolve, reject) => {
      // Verificar si ya está cargado
      const existingLink = document.querySelector(`link[href="${url}"]`);
      if (existingLink) {
        resolve();
        return;
      }
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Error cargando CSS: ${url}`));
      
      document.head.appendChild(link);
    });
  }
  
  /**
   * Precargar librerías críticas
   * @param {Array} libraryKeys - Lista de claves de librerías
   */
  async preloadLibraries(libraryKeys) {
    console.log(`🔮 Precargando ${libraryKeys.length} librerías...`);
    
    const preloadPromises = libraryKeys.map(async (key) => {
      try {
        await this.loadLibrary(key);
        console.log(`✨ Librería precargada: ${key}`);
      } catch (error) {
        console.warn(`⚠️ Error precargando librería ${key}:`, error.message);
      }
    });
    
    await Promise.allSettled(preloadPromises);
    console.log('🎯 Precarga de librerías completada');
  }
  
  /**
   * Verificar si una librería está cargada
   * @param {string} libraryKey - Clave de la librería
   * @returns {boolean} True si está cargada
   */
  isLibraryLoaded(libraryKey) {
    return this.loadedLibraries.has(libraryKey);
  }
  
  /**
   * Obtener información de librerías cargadas
   */
  getLoadedLibrariesInfo() {
    const info = [];
    
    for (const [key, library] of this.loadedLibraries.entries()) {
      const config = this.libraryConfigs.get(key);
      info.push({
        key,
        name: config?.name || key,
        size: config?.size || 'Unknown',
        globalName: config?.globalName,
        loaded: true
      });
    }
    
    return info;
  }
  
  /**
   * Limpiar librerías cargadas
   */
  clearCache() {
    this.loadedLibraries.clear();
    console.log('🧹 Caché de librerías limpiado');
  }
  
  /**
   * Delay helper
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Instancia singleton del cargador de librerías
const lazyLibraryLoader = new LazyLibraryLoader();

export default lazyLibraryLoader;

// Funciones de conveniencia para librerías específicas
export const loadChartJS = () => lazyLibraryLoader.loadLibrary('chartjs');
export const loadJsPDF = () => lazyLibraryLoader.loadLibrary('jspdf');
export const loadJsPDFAutoTable = () => lazyLibraryLoader.loadLibrary('jspdf-autotable');
export const loadLeaflet = () => lazyLibraryLoader.loadLibrary('leaflet');
export const loadMoment = () => lazyLibraryLoader.loadLibrary('moment');