// @ts-check
// backend/infrastructure/middleware/cacheHeaders.js
// OPTIMIZACIÓN SPRINT 2: Headers de Caché HTTP para optimizar transferencias

import crypto from 'crypto';

/**
 * Middleware para agregar headers de caché HTTP
 * Incluye ETag, Last-Modified, Cache-Control
 */
export function cacheHeaders(options = {}) {
  const {
    maxAge = 300, // 5 minutos por defecto
    mustRevalidate = true,
    public: isPublic = true,
    etag = true,
    lastModified = true
  } = options;

  return (req, res, next) => {
    // Guardar el método original de res.json
    const originalJson = res.json;
    
    // Sobrescribir res.json para agregar headers de caché
    res.json = function(data) {
      try {
        // Generar ETag basado en el contenido
        if (etag && data) {
          const content = JSON.stringify(data);
          const hash = crypto.createHash('md5').update(content).digest('hex');
          const etagValue = `"${hash}"`;
          
          // Verificar si el cliente ya tiene esta versión
          const clientETag = req.headers['if-none-match'];
          if (clientETag === etagValue) {
            console.log(`💾 ETag match para ${req.path} - Enviando 304`);
            return res.status(304).end();
          }
          
          res.set('ETag', etagValue);
        }
        
        // Agregar Last-Modified
        if (lastModified) {
          const now = new Date();
          res.set('Last-Modified', now.toUTCString());
          
          // Verificar If-Modified-Since
          const ifModifiedSince = req.headers['if-modified-since'];
          if (ifModifiedSince) {
            const clientDate = new Date(ifModifiedSince);
            const serverDate = new Date(now.toDateString()); // Solo comparar fecha, no hora
            
            if (clientDate >= serverDate) {
              console.log(`📅 Not modified para ${req.path} - Enviando 304`);
              return res.status(304).end();
            }
          }
        }
        
        // Agregar Cache-Control
        const cacheControlParts = [];
        
        if (isPublic) {
          cacheControlParts.push('public');
        } else {
          cacheControlParts.push('private');
        }
        
        cacheControlParts.push(`max-age=${maxAge}`);
        
        if (mustRevalidate) {
          cacheControlParts.push('must-revalidate');
        }
        
        res.set('Cache-Control', cacheControlParts.join(', '));
        
        // Agregar Vary header para indicar que la respuesta varía según Accept-Encoding
        res.set('Vary', 'Accept-Encoding, If-None-Match, If-Modified-Since');
        
        console.log(`🏷️ Headers de caché agregados para ${req.path}`);
        
      } catch (error) {
        console.error('❌ Error generando headers de caché:', error);
      }
      
      // Llamar al método original
      return originalJson.call(this, data);
    };
    
    next();
  };
}

/**
 * Middleware de caché para datos estáticos (24 horas)
 * Para: configuración, lista de barrios, totales de territorios
 */
export const staticCacheHeaders = cacheHeaders({
  maxAge: 86400, // 24 horas
  mustRevalidate: false,
  public: true,
  etag: true,
  lastModified: true
});

/**
 * Middleware de caché para datos dinámicos (5 minutos)
 * Para: progreso de barrios, estadísticas
 */
export const dynamicCacheHeaders = cacheHeaders({
  maxAge: 300, // 5 minutos
  mustRevalidate: true,
  public: true,
  etag: true,
  lastModified: true
});

/**
 * Middleware de caché para datos críticos (1 minuto)
 * Para: reportes recientes, alertas
 */
export const criticalCacheHeaders = cacheHeaders({
  maxAge: 60, // 1 minuto
  mustRevalidate: true,
  public: false, // Privado para datos críticos
  etag: true,
  lastModified: true
});

/**
 * Middleware para deshabilitar caché completamente
 * Para: operaciones de escritura, datos en tiempo real
 */
export function noCacheHeaders(req, res, next) {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  
  console.log(`🚫 No-cache headers agregados para ${req.path}`);
  next();
}

/**
 * Configuración de headers de caché por tipo de endpoint
 */
export const cacheConfig = {
  // Endpoints con datos estáticos
  static: [
    '/api/ciclos/health',
    '/api/health'
  ],
  
  // Endpoints con datos dinámicos
  dynamic: [
    '/api/ciclos/progreso',
    '/api/ciclos/estadisticas',
    '/api/ciclos/activos'
  ],
  
  // Endpoints con datos críticos
  critical: [
    '/api/reportes',
    '/api/ciclos/barrio/*/progreso'
  ],
  
  // Endpoints sin caché
  noCache: [
    '/api/ciclos/barrio/*/completar',
    '/api/ciclos/barrio/*/pausar',
    '/api/ciclos/barrio/*/reactivar',
    '/api/reportes', // POST/PUT/DELETE
    '/api/salidas', // POST/PUT/DELETE
    '/api/capitanes' // POST/PUT/DELETE
  ]
};

/**
 * Función helper para obtener el middleware de caché apropiado
 * @param {string} type - Tipo de caché (static, dynamic, critical, none)
 * @returns {Function} Middleware de caché
 */
export function getCacheMiddleware(type = 'dynamic') {
  switch (type) {
    case 'static':
      return staticCacheHeaders;
    case 'dynamic':
      return dynamicCacheHeaders;
    case 'critical':
      return criticalCacheHeaders;
    case 'none':
      return noCacheHeaders;
    default:
      return dynamicCacheHeaders;
  }
}

/**
 * Middleware condicional de caché basado en el método HTTP
 * GET/HEAD: Aplica caché
 * POST/PUT/DELETE: No caché
 */
export function conditionalCacheHeaders(cacheType = 'dynamic') {
  return (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return getCacheMiddleware(cacheType)(req, res, next);
    } else {
      return noCacheHeaders(req, res, next);
    }
  };
}

/**
 * Logging de configuración de headers de caché
 */
export function logCacheHeadersConfig() {
  console.log('🏷️ Headers de Caché HTTP configurados:');
  console.log('   📦 Estático: 24h, public, ETag + Last-Modified');
  console.log('   ⚡ Dinámico: 5min, public, ETag + Last-Modified');
  console.log('   🚨 Crítico: 1min, private, ETag + Last-Modified');
  console.log('   🚫 Sin caché: no-store para operaciones de escritura');
}

export default {
  cacheHeaders,
  staticCacheHeaders,
  dynamicCacheHeaders,
  criticalCacheHeaders,
  noCacheHeaders,
  getCacheMiddleware,
  conditionalCacheHeaders,
  cacheConfig,
  logCacheHeadersConfig
};