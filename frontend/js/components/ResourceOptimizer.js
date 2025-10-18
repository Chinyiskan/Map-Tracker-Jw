// frontend/js/components/ResourceOptimizer.js
// OPTIMIZACIÓN SPRINT 3: Optimizador de Recursos y Lazy Loading de Imágenes

/**
 * Optimizador de Recursos
 * Implementa lazy loading de imágenes, compresión y optimización de recursos
 */
export class ResourceOptimizer {
  constructor() {
    this.imageObserver = null;
    this.loadedImages = new Set();
    this.imageCache = new Map();
    this.performanceMetrics = {
      imagesLoaded: 0,
      totalLoadTime: 0,
      cacheHits: 0,
      compressionSavings: 0
    };
    
    this._initImageObserver();
    console.log('🖼️ ResourceOptimizer inicializado');
  }
  
  /**
   * Inicializar Intersection Observer para lazy loading de imágenes
   * @private
   */
  _initImageObserver() {
    if ('IntersectionObserver' in window) {
      this.imageObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this._loadImage(entry.target);
              this.imageObserver.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '50px 0px', // Cargar 50px antes de que sea visible
          threshold: 0.1
        }
      );
    } else {
      console.warn('⚠️ IntersectionObserver no soportado, usando carga inmediata');
    }
  }
  
  /**
   * Configurar lazy loading para todas las imágenes
   */
  setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src], img[data-lazy]');
    
    if (this.imageObserver) {
      images.forEach(img => {
        // Agregar placeholder mientras carga
        this._addPlaceholder(img);
        this.imageObserver.observe(img);
      });
      
      console.log(`🔍 Configurado lazy loading para ${images.length} imágenes`);
    } else {
      // Fallback: cargar todas las imágenes inmediatamente
      images.forEach(img => this._loadImage(img));
    }
  }
  
  /**
   * Agregar placeholder a imagen
   * @private
   */
  _addPlaceholder(img) {
    if (!img.src || img.src === '') {
      // Crear placeholder SVG
      const placeholder = this._createPlaceholderSVG(
        img.dataset.width || 300,
        img.dataset.height || 200
      );
      img.src = placeholder;
      img.classList.add('lazy-loading');
    }
  }
  
  /**
   * Crear placeholder SVG
   * @private
   */
  _createPlaceholderSVG(width, height) {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" 
              fill="#999" text-anchor="middle" dy=".3em">Cargando...</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
  
  /**
   * Cargar imagen con optimizaciones
   * @private
   */
  async _loadImage(img) {
    const startTime = performance.now();
    const originalSrc = img.dataset.src || img.dataset.lazy;
    
    if (!originalSrc || this.loadedImages.has(originalSrc)) {
      return;
    }
    
    try {
      // Verificar caché primero
      if (this.imageCache.has(originalSrc)) {
        const cachedData = this.imageCache.get(originalSrc);
        img.src = cachedData.optimizedSrc;
        this.performanceMetrics.cacheHits++;
        console.log(`📦 Imagen desde caché: ${originalSrc}`);
        this._onImageLoaded(img, startTime);
        return;
      }
      
      // Optimizar imagen antes de cargar
      const optimizedSrc = await this._optimizeImage(originalSrc, img);
      
      // Precargar imagen
      const preloadImg = new Image();
      preloadImg.onload = () => {
        img.src = optimizedSrc;
        this._onImageLoaded(img, startTime);
        
        // Guardar en caché
        this.imageCache.set(originalSrc, {
          optimizedSrc,
          loadTime: performance.now() - startTime,
          timestamp: Date.now()
        });
      };
      
      preloadImg.onerror = () => {
        console.error(`❌ Error cargando imagen: ${originalSrc}`);
        this._onImageError(img);
      };
      
      preloadImg.src = optimizedSrc;
      this.loadedImages.add(originalSrc);
      
    } catch (error) {
      console.error(`❌ Error optimizando imagen ${originalSrc}:`, error);
      this._onImageError(img);
    }
  }
  
  /**
   * Optimizar imagen según el dispositivo y conexión
   * @private
   */
  async _optimizeImage(src, img) {
    // Detectar tipo de conexión
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
    
    // Detectar tamaño de pantalla
    const isSmallScreen = window.innerWidth < 768;
    const isRetinaDisplay = window.devicePixelRatio > 1;
    
    // Determinar calidad de imagen
    let quality = 'high';
    if (isSlowConnection) {
      quality = 'low';
    } else if (isSmallScreen && !isRetinaDisplay) {
      quality = 'medium';
    }
    
    // Si es SVG, no necesita optimización
    if (src.endsWith('.svg')) {
      return src;
    }
    
    // Para imágenes locales, aplicar parámetros de optimización
    if (src.startsWith('./') || src.startsWith('/')) {
      return this._applyImageOptimization(src, quality, img);
    }
    
    // Para URLs externas, usar tal como están
    return src;
  }
  
  /**
   * Aplicar optimización a imagen local
   * @private
   */
  _applyImageOptimization(src, quality, img) {
    // Determinar dimensiones objetivo
    const targetWidth = this._getTargetWidth(img);
    const targetHeight = this._getTargetHeight(img);
    
    // Para este proyecto, simplemente retornamos la imagen original
    // En un entorno de producción, aquí se aplicarían transformaciones
    // como redimensionamiento, compresión, formato WebP, etc.
    
    console.log(`🔧 Optimizando imagen: ${src} (${quality}, ${targetWidth}x${targetHeight})`);
    
    return src;
  }
  
  /**
   * Obtener ancho objetivo para la imagen
   * @private
   */
  _getTargetWidth(img) {
    const containerWidth = img.parentElement?.offsetWidth || window.innerWidth;
    const maxWidth = Math.min(containerWidth, 1920); // Máximo 1920px
    
    // Ajustar para pantallas de alta densidad
    return Math.round(maxWidth * (window.devicePixelRatio || 1));
  }
  
  /**
   * Obtener alto objetivo para la imagen
   * @private
   */
  _getTargetHeight(img) {
    const aspectRatio = img.dataset.aspectRatio;
    if (aspectRatio) {
      const [width, height] = aspectRatio.split(':').map(Number);
      return Math.round(this._getTargetWidth(img) * (height / width));
    }
    
    return null; // Mantener aspecto original
  }
  
  /**
   * Manejar imagen cargada exitosamente
   * @private
   */
  _onImageLoaded(img, startTime) {
    const loadTime = performance.now() - startTime;
    
    img.classList.remove('lazy-loading');
    img.classList.add('lazy-loaded');
    
    // Agregar efecto de fade-in
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.3s ease-in-out';
    
    requestAnimationFrame(() => {
      img.style.opacity = '1';
    });
    
    // Actualizar métricas
    this.performanceMetrics.imagesLoaded++;
    this.performanceMetrics.totalLoadTime += loadTime;
    
    console.log(`✅ Imagen cargada: ${img.dataset.src || img.dataset.lazy} (${loadTime.toFixed(2)}ms)`);
  }
  
  /**
   * Manejar error de carga de imagen
   * @private
   */
  _onImageError(img) {
    img.classList.remove('lazy-loading');
    img.classList.add('lazy-error');
    
    // Mostrar imagen de error
    const errorPlaceholder = this._createErrorPlaceholder(
      img.dataset.width || 300,
      img.dataset.height || 200
    );
    
    img.src = errorPlaceholder;
    img.alt = 'Error cargando imagen';
  }
  
  /**
   * Crear placeholder de error
   * @private
   */
  _createErrorPlaceholder(width, height) {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ffebee"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" 
              fill="#c62828" text-anchor="middle" dy=".3em">❌ Error</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
  
  /**
   * Precargar imágenes críticas
   * @param {Array} imageSrcs - Lista de URLs de imágenes
   */
  async preloadCriticalImages(imageSrcs) {
    console.log(`🔮 Precargando ${imageSrcs.length} imágenes críticas...`);
    
    const preloadPromises = imageSrcs.map(async (src) => {
      try {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = src;
        });
        
        this.imageCache.set(src, {
          optimizedSrc: src,
          loadTime: 0,
          timestamp: Date.now()
        });
        
        console.log(`✨ Imagen crítica precargada: ${src}`);
      } catch (error) {
        console.warn(`⚠️ Error precargando imagen ${src}:`, error.message);
      }
    });
    
    await Promise.allSettled(preloadPromises);
    console.log('🎯 Precarga de imágenes críticas completada');
  }
  
  /**
   * Optimizar recursos CSS y JS
   */
  optimizeResources() {
    // Optimizar carga de CSS
    this._optimizeCSS();
    
    // Optimizar carga de fuentes
    this._optimizeFonts();
    
    // Configurar prefetch para recursos futuros
    this._setupResourcePrefetch();
  }
  
  /**
   * Optimizar carga de CSS
   * @private
   */
  _optimizeCSS() {
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    
    stylesheets.forEach(link => {
      // Agregar preload para CSS crítico
      if (link.href.includes('critical') || link.href.includes('main')) {
        link.rel = 'preload';
        link.as = 'style';
        link.onload = function() {
          this.rel = 'stylesheet';
        };
      }
    });
  }
  
  /**
   * Optimizar carga de fuentes
   * @private
   */
  _optimizeFonts() {
    // Precargar fuentes críticas
    const criticalFonts = [
      // Agregar URLs de fuentes críticas aquí
    ];
    
    criticalFonts.forEach(fontUrl => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = fontUrl;
      document.head.appendChild(link);
    });
  }
  
  /**
   * Configurar prefetch para recursos futuros
   * @private
   */
  _setupResourcePrefetch() {
    // Prefetch para páginas probables
    const likelyPages = [
      './admin.html',
      './reportes.html',
      './consulta.html'
    ];
    
    likelyPages.forEach(page => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = page;
      document.head.appendChild(link);
    });
  }
  
  /**
   * Obtener métricas de rendimiento
   */
  getPerformanceMetrics() {
    const avgLoadTime = this.performanceMetrics.imagesLoaded > 0
      ? this.performanceMetrics.totalLoadTime / this.performanceMetrics.imagesLoaded
      : 0;
    
    return {
      ...this.performanceMetrics,
      avgLoadTime: Math.round(avgLoadTime * 100) / 100,
      cacheHitRate: this.performanceMetrics.imagesLoaded > 0
        ? Math.round((this.performanceMetrics.cacheHits / this.performanceMetrics.imagesLoaded) * 100)
        : 0,
      cachedImages: this.imageCache.size
    };
  }
  
  /**
   * Limpiar caché de imágenes
   */
  clearImageCache() {
    this.imageCache.clear();
    this.loadedImages.clear();
    console.log('🧹 Caché de imágenes limpiado');
  }
  
  /**
   * Destruir el optimizador
   */
  destroy() {
    if (this.imageObserver) {
      this.imageObserver.disconnect();
    }
    this.clearImageCache();
  }
}

// Instancia singleton del optimizador de recursos
const resourceOptimizer = new ResourceOptimizer();

// Configurar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    resourceOptimizer.setupLazyLoading();
    resourceOptimizer.optimizeResources();
  });
} else {
  resourceOptimizer.setupLazyLoading();
  resourceOptimizer.optimizeResources();
}

export default resourceOptimizer;