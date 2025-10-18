// backend/config/vercel-config.js
// Configuración específica para el entorno Vercel

/**
 * Configuración para Vercel
 * Deshabilita funcionalidades que no son compatibles con serverless
 */
export const VERCEL_CONFIG = {
  // Deshabilitar funcionalidades problemáticas en Vercel
  DISABLE_WINSTON_LOGGING: true,
  DISABLE_FILE_LOGGING: true,
  DISABLE_CRON_JOBS: true,
  DISABLE_BACKGROUND_TASKS: true,
  
  // Configuración de métricas simplificada
  METRICS: {
    ENABLED: true,
    USE_SERVERLESS_VERSION: true,
    RETENTION_PERIOD: 3600000, // 1 hora
    MAX_HISTORY_SIZE: 50
  },
  
  // Configuración de caché simplificada
  CACHE: {
    ENABLED: true,
    MAX_SIZE: 100, // Reducido para serverless
    DEFAULT_TTL: 300000, // 5 minutos
    CLEANUP_INTERVAL: 0 // Deshabilitado en serverless
  },
  
  // Rate limiting simplificado
  RATE_LIMITING: {
    ENABLED: true,
    STORE_TYPE: 'memory', // Solo memoria en serverless
    WINDOW_MS: 60000, // 1 minuto
    MAX_REQUESTS: 100
  },
  
  // Configuración de base de datos
  DATABASE: {
    CONNECTION_TIMEOUT: 5000, // 5 segundos
    QUERY_TIMEOUT: 10000, // 10 segundos
    MAX_RETRIES: 2
  }
};

/**
 * Verificar si estamos en Vercel
 */
export function isVercelEnvironment() {
  return !!(process.env.VERCEL || process.env.VERCEL_ENV);
}

/**
 * Obtener configuración según el entorno
 */
export function getEnvironmentConfig() {
  if (isVercelEnvironment()) {
    return {
      ...VERCEL_CONFIG,
      ENVIRONMENT: 'vercel',
      IS_SERVERLESS: true
    };
  }
  
  return {
    ENVIRONMENT: 'local',
    IS_SERVERLESS: false,
    METRICS: {
      ENABLED: true,
      USE_SERVERLESS_VERSION: false,
      RETENTION_PERIOD: 86400000, // 24 horas
      MAX_HISTORY_SIZE: 1000
    },
    CACHE: {
      ENABLED: true,
      MAX_SIZE: 200,
      DEFAULT_TTL: 300000,
      CLEANUP_INTERVAL: 300000 // 5 minutos
    }
  };
}

/**
 * Configurar aplicación para Vercel
 */
export function configureForVercel(app) {
  if (!isVercelEnvironment()) {
    return;
  }
  
  console.log('🔧 Configurando aplicación para Vercel...');
  
  // Deshabilitar funcionalidades problemáticas
  process.env.DISABLE_WINSTON = 'true';
  process.env.DISABLE_FILE_LOGGING = 'true';
  process.env.DISABLE_CRON_JOBS = 'true';
  
  // Configurar timeouts más cortos
  if (app && app.set) {
    app.set('trust proxy', true);
  }
  
  console.log('✅ Configuración de Vercel aplicada');
}

export default {
  VERCEL_CONFIG,
  isVercelEnvironment,
  getEnvironmentConfig,
  configureForVercel
};