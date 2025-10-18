// @ts-check
// backend/infrastructure/middleware/rateLimiting.js
// OPTIMIZACIÓN SPRINT 2: Rate Limiting para protección contra abuso

import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting General - Protección básica por IP
 * Límite: 100 requests por minuto por IP
 */
export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // Máximo 100 requests por ventana de tiempo
  message: {
    success: false,
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo en un minuto',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true, // Incluir headers `RateLimit-*`
  legacyHeaders: false, // Deshabilitar headers `X-RateLimit-*`
  handler: (req, res) => {
    console.log(`🚫 Rate limit excedido para IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo en un minuto',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 60,
      timestamp: new Date().toISOString()
    });
  },
  skip: (req) => {
    // Saltar rate limiting para health checks
    return req.path === '/api/health';
  }
});

/**
 * Rate Limiting para Endpoints Críticos
 * Límite: 10 requests por minuto por IP
 * Aplicado a: reportes, ciclos, operaciones de escritura
 */
export const criticalRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // Máximo 10 requests por ventana de tiempo
  message: {
    success: false,
    error: 'Demasiadas solicitudes a endpoints críticos, intenta de nuevo en un minuto',
    code: 'CRITICAL_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚨 Rate limit crítico excedido para IP: ${req.ip} en ${req.path}`);
    res.status(429).json({
      success: false,
      error: 'Demasiadas solicitudes a endpoints críticos, intenta de nuevo en un minuto',
      code: 'CRITICAL_RATE_LIMIT_EXCEEDED',
      retryAfter: 60,
      endpoint: req.path,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Rate Limiting para Endpoints de Lectura Frecuente
 * Límite: 30 requests por minuto por IP
 * Aplicado a: consultas de progreso, estadísticas
 */
export const readRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // Máximo 30 requests por ventana de tiempo
  message: {
    success: false,
    error: 'Demasiadas consultas, intenta de nuevo en un minuto',
    code: 'READ_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`📊 Rate limit de lectura excedido para IP: ${req.ip} en ${req.path}`);
    res.status(429).json({
      success: false,
      error: 'Demasiadas consultas, intenta de nuevo en un minuto',
      code: 'READ_RATE_LIMIT_EXCEEDED',
      retryAfter: 60,
      endpoint: req.path,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Rate Limiting para Autenticación
 * Límite: 5 intentos por 15 minutos por IP
 * Aplicado a: login, registro, reset password
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos por ventana de tiempo
  message: {
    success: false,
    error: 'Demasiados intentos de autenticación, intenta de nuevo en 15 minutos',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🔐 Rate limit de autenticación excedido para IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Demasiados intentos de autenticación, intenta de nuevo en 15 minutos',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 900,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Configuración de Rate Limiting por Tipo de Endpoint
 */
export const rateLimitConfig = {
  // Endpoints que requieren rate limiting crítico
  critical: [
    '/api/reportes',
    '/api/ciclos/barrio/*/progreso', // Endpoints individuales
    '/api/salidas',
    '/api/capitanes'
  ],
  
  // Endpoints que requieren rate limiting de lectura
  read: [
    '/api/ciclos/progreso', // Endpoint agregado
    '/api/ciclos/estadisticas',
    '/api/ciclos/activos'
  ],
  
  // Endpoints de autenticación
  auth: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/reset-password'
  ]
};

/**
 * Middleware para aplicar rate limiting según el tipo de endpoint
 * @param {string} type - Tipo de rate limiting (general, critical, read, auth)
 * @returns {Function} Middleware de rate limiting
 */
export function getRateLimitMiddleware(type = 'general') {
  switch (type) {
    case 'critical':
      return criticalRateLimit;
    case 'read':
      return readRateLimit;
    case 'auth':
      return authRateLimit;
    default:
      return generalRateLimit;
  }
}

/**
 * Logging de estadísticas de rate limiting
 */
export function logRateLimitStats() {
  console.log('📊 Rate Limiting configurado:');
  console.log('   🔒 General: 100 req/min por IP');
  console.log('   🚨 Crítico: 10 req/min por IP');
  console.log('   📖 Lectura: 30 req/min por IP');
  console.log('   🔐 Auth: 5 req/15min por IP');
}

export default {
  generalRateLimit,
  criticalRateLimit,
  readRateLimit,
  authRateLimit,
  getRateLimitMiddleware,
  rateLimitConfig,
  logRateLimitStats
};