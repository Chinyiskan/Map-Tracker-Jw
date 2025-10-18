// backend/infrastructure/cache/CacheService.js
// Servicio de cache en memoria para optimizar consultas frecuentes

/**
 * Servicio de Cache en Memoria
 * Implementa un sistema de cache LRU (Least Recently Used) con TTL (Time To Live)
 */
export class CacheService {
  /**
   * Constructor del servicio de cache
   * @param {Object} opciones - Configuración del cache
   */
  constructor(opciones = {}) {
    this.maxSize = opciones.maxSize || 100; // Máximo número de entradas
    this.defaultTTL = opciones.defaultTTL || 300000; // 5 minutos por defecto
    this.cache = new Map();
    this.accessOrder = new Map(); // Para implementar LRU
    this.timers = new Map(); // Para manejar TTL
    
    console.log(`🗄️ CacheService inicializado: maxSize=${this.maxSize}, defaultTTL=${this.defaultTTL}ms`);
  }
  
  /**
   * Obtener valor del cache
   * @param {string} key - Clave del cache
   * @returns {*} Valor almacenado o null si no existe/expiró
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }
    
    const entry = this.cache.get(key);
    
    // Verificar si ha expirado
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }
    
    // Actualizar orden de acceso (LRU)
    this.accessOrder.delete(key);
    this.accessOrder.set(key, Date.now());
    
    console.log(`🎯 Cache HIT: ${key}`);
    return entry.value;
  }
  
  /**
   * Almacenar valor en el cache
   * @param {string} key - Clave del cache
   * @param {*} value - Valor a almacenar
   * @param {number} ttl - Tiempo de vida en milisegundos (opcional)
   */
  set(key, value, ttl = null) {
    const timeToLive = ttl || this.defaultTTL;
    const expiresAt = Date.now() + timeToLive;
    
    // Si el cache está lleno, eliminar el menos usado recientemente
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this._evictLRU();
    }
    
    // Limpiar timer anterior si existe
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }
    
    // Almacenar entrada
    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now()
    });
    
    // Actualizar orden de acceso
    this.accessOrder.set(key, Date.now());
    
    // Configurar timer para expiración automática
    const timer = setTimeout(() => {
      this.delete(key);
    }, timeToLive);
    
    this.timers.set(key, timer);
    
    console.log(`💾 Cache SET: ${key} (TTL: ${timeToLive}ms)`);
  }
  
  /**
   * Eliminar entrada del cache
   * @param {string} key - Clave a eliminar
   * @returns {boolean} true si se eliminó, false si no existía
   */
  delete(key) {
    const existed = this.cache.has(key);
    
    if (existed) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }
      
      console.log(`🗑️ Cache DELETE: ${key}`);
    }
    
    return existed;
  }
  
  /**
   * Limpiar todo el cache
   */
  clear() {
    // Limpiar todos los timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    
    this.cache.clear();
    this.accessOrder.clear();
    this.timers.clear();
    
    console.log('🧹 Cache completamente limpiado');
  }
  
  /**
   * Verificar si una clave existe en el cache
   * @param {string} key - Clave a verificar
   * @returns {boolean} true si existe y no ha expirado
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }
    
    const entry = this.cache.get(key);
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Obtener estadísticas del cache
   * @returns {Object} Estadísticas del cache
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    
    // Contar entradas expiradas
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredCount++;
      }
    }
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: Math.round((this.cache.size / this.maxSize) * 100),
      expiredEntries: expiredCount,
      activeTimers: this.timers.size,
      oldestEntry: this._getOldestEntry(),
      newestEntry: this._getNewestEntry()
    };
  }
  
  /**
   * Limpiar entradas expiradas manualmente
   * @returns {number} Número de entradas eliminadas
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cache cleanup: ${expiredKeys.length} entradas expiradas eliminadas`);
    }
    
    return expiredKeys.length;
  }
  
  /**
   * Obtener o establecer valor con función de carga
   * @param {string} key - Clave del cache
   * @param {Function} loadFunction - Función para cargar el valor si no existe
   * @param {number} ttl - Tiempo de vida opcional
   * @returns {Promise<*>} Valor del cache o cargado
   */
  async getOrSet(key, loadFunction, ttl = null) {
    // Intentar obtener del cache primero
    const cachedValue = this.get(key);
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    console.log(`🔄 Cache MISS: ${key} - Cargando datos...`);
    
    try {
      // Cargar valor usando la función proporcionada
      const value = await loadFunction();
      
      // Almacenar en cache
      this.set(key, value, ttl);
      
      return value;
    } catch (error) {
      console.error(`❌ Error cargando datos para cache key ${key}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Invalidar cache por patrón
   * @param {string|RegExp} pattern - Patrón para buscar claves
   * @returns {number} Número de entradas eliminadas
   */
  invalidatePattern(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`🎯 Cache invalidation: ${keysToDelete.length} entradas eliminadas por patrón`);
    }
    
    return keysToDelete.length;
  }
  
  // ==========================================
  // OPTIMIZACIÓN SPRINT 1: CACHÉ DIFERENCIADO
  // ==========================================
  
  /**
   * Caché para datos estáticos (TTL: 24 horas)
   * Usado para: total de territorios, lista de barrios, configuración
   * @param {string} key - Clave del cache
   * @param {*} value - Valor a almacenar
   */
  setStatic(key, value) {
    const staticTTL = 24 * 60 * 60 * 1000; // 24 horas
    this.set(`static:${key}`, value, staticTTL);
    console.log(`📦 Cache estático: ${key} (TTL: 24h)`);
  }
  
  /**
   * Obtener datos estáticos del cache
   * @param {string} key - Clave del cache
   * @returns {*} Valor almacenado o null
   */
  getStatic(key) {
    return this.get(`static:${key}`);
  }
  
  /**
   * Caché para datos dinámicos (TTL: 5 minutos)
   * Usado para: progreso de barrios, estadísticas
   * @param {string} key - Clave del cache
   * @param {*} value - Valor a almacenar
   */
  setDynamic(key, value) {
    const dynamicTTL = 5 * 60 * 1000; // 5 minutos
    this.set(`dynamic:${key}`, value, dynamicTTL);
    console.log(`⚡ Cache dinámico: ${key} (TTL: 5min)`);
  }
  
  /**
   * Obtener datos dinámicos del cache
   * @param {string} key - Clave del cache
   * @returns {*} Valor almacenado o null
   */
  getDynamic(key) {
    return this.get(`dynamic:${key}`);
  }
  
  /**
   * Caché para datos críticos (TTL: 1 minuto)
   * Usado para: reportes recientes, alertas
   * @param {string} key - Clave del cache
   * @param {*} value - Valor a almacenar
   */
  setCritical(key, value) {
    const criticalTTL = 1 * 60 * 1000; // 1 minuto
    this.set(`critical:${key}`, value, criticalTTL);
    console.log(`🚨 Cache crítico: ${key} (TTL: 1min)`);
  }
  
  /**
   * Obtener datos críticos del cache
   * @param {string} key - Clave del cache
   * @returns {*} Valor almacenado o null
   */
  getCritical(key) {
    return this.get(`critical:${key}`);
  }
  
  /**
   * Método helper para obtener o establecer datos estáticos
   * @param {string} key - Clave del cache
   * @param {Function} loadFunction - Función para cargar el valor
   * @returns {Promise<*>} Valor del cache o cargado
   */
  async getOrSetStatic(key, loadFunction) {
    const cachedValue = this.getStatic(key);
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    console.log(`🔄 Cache estático MISS: ${key} - Cargando datos...`);
    const value = await loadFunction();
    this.setStatic(key, value);
    return value;
  }
  
  /**
   * Método helper para obtener o establecer datos dinámicos
   * @param {string} key - Clave del cache
   * @param {Function} loadFunction - Función para cargar el valor
   * @returns {Promise<*>} Valor del cache o cargado
   */
  async getOrSetDynamic(key, loadFunction) {
    const cachedValue = this.getDynamic(key);
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    console.log(`🔄 Cache dinámico MISS: ${key} - Cargando datos...`);
    const value = await loadFunction();
    this.setDynamic(key, value);
    return value;
  }
  
  /**
   * Método helper para obtener o establecer datos críticos
   * @param {string} key - Clave del cache
   * @param {Function} loadFunction - Función para cargar el valor
   * @returns {Promise<*>} Valor del cache o cargado
   */
  async getOrSetCritical(key, loadFunction) {
    const cachedValue = this.getCritical(key);
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    console.log(`🔄 Cache crítico MISS: ${key} - Cargando datos...`);
    const value = await loadFunction();
    this.setCritical(key, value);
    return value;
  }
  
  // Métodos privados
  
  /**
   * Eliminar la entrada menos usada recientemente (LRU)
   * @private
   */
  _evictLRU() {
    if (this.accessOrder.size === 0) {
      return;
    }
    
    // Encontrar la clave con el timestamp más antiguo
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, timestamp] of this.accessOrder.entries()) {
      if (timestamp < oldestTime) {
        oldestTime = timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      console.log(`🔄 Cache LRU eviction: ${oldestKey}`);
      this.delete(oldestKey);
    }
  }
  
  /**
   * Obtener información de la entrada más antigua
   * @private
   */
  _getOldestEntry() {
    if (this.cache.size === 0) return null;
    
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }
    
    return oldestKey ? {
      key: oldestKey,
      age: Date.now() - oldestTime
    } : null;
  }
  
  /**
   * Obtener información de la entrada más nueva
   * @private
   */
  _getNewestEntry() {
    if (this.cache.size === 0) return null;
    
    let newestKey = null;
    let newestTime = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt > newestTime) {
        newestTime = entry.createdAt;
        newestKey = key;
      }
    }
    
    return newestKey ? {
      key: newestKey,
      age: Date.now() - newestTime
    } : null;
  }
}

// Configuración del servicio de caché según el entorno
let cacheConfig;

if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  // Configuración para Vercel (serverless)
  cacheConfig = {
    maxSize: 100, // Reducido para serverless
    defaultTTL: 5 * 60 * 1000, // 5 minutos
    cleanupInterval: 0 // Deshabilitado en serverless
  };
} else {
  // Configuración para desarrollo
  cacheConfig = {
    maxSize: 200,
    defaultTTL: 5 * 60 * 1000, // 5 minutos
    cleanupInterval: 10 * 60 * 1000 // 10 minutos
  };
}

const cacheService = new CacheService(cacheConfig);

// Configurar limpieza automática solo si no es serverless
if (cacheConfig.cleanupInterval > 0) {
  setInterval(() => {
    cacheService.cleanup();
  }, cacheConfig.cleanupInterval);
}

export default cacheService;