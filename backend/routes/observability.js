// backend/routes/observability.js
// Rutas para endpoints de observabilidad

import express from 'express';
import observabilityController from '../infrastructure/web/ObservabilityController.js';
import observabilityMiddleware from '../infrastructure/middleware/ObservabilityMiddleware.js';

const router = express.Router();

/**
 * @route GET /health
 * @desc Health check básico
 * @access Public
 */
router.get('/health', async (req, res) => {
  await observabilityController.healthCheck(req, res);
});

/**
 * @route GET /health/detailed
 * @desc Health check detallado con información completa del sistema
 * @access Public
 */
router.get('/health/detailed', async (req, res) => {
  await observabilityController.detailedHealthCheck(req, res);
});

/**
 * @route GET /metrics
 * @desc Métricas del sistema en formato JSON
 * @access Public
 */
router.get('/metrics', async (req, res) => {
  await observabilityController.getMetrics(req, res);
});

/**
 * @route GET /metrics/prometheus
 * @desc Métricas en formato Prometheus
 * @access Public
 */
router.get('/metrics/prometheus', async (req, res) => {
  await observabilityController.getPrometheusMetrics(req, res);
});

/**
 * @route GET /status
 * @desc Status completo del sistema
 * @access Public
 */
router.get('/status', async (req, res) => {
  await observabilityController.getStatus(req, res);
});

/**
 * @route GET /info
 * @desc Información de la aplicación
 * @access Public
 */
router.get('/info', async (req, res) => {
  await observabilityController.getInfo(req, res);
});

/**
 * @route GET /logs
 * @desc Logs recientes (solo desarrollo)
 * @access Public
 */
router.get('/logs', async (req, res) => {
  await observabilityController.getRecentLogs(req, res);
});

/**
 * @route GET /ping
 * @desc Ping simple para verificar conectividad
 * @access Public
 */
router.get('/ping', (req, res) => {
  res.json({
    message: 'pong',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * @route GET /version
 * @desc Versión de la aplicación
 * @access Public
 */
router.get('/version', (req, res) => {
  res.json({
    version: process.env.npm_package_version || '1.0.0',
    name: 'Map Tracker JW',
    environment: process.env.NODE_ENV || 'development',
    node: process.version,
    platform: process.platform
  });
});

/**
 * @route GET /env-check
 * @desc Verificación de variables de entorno (sin exponer valores sensibles)
 * @access Public
 */
router.get('/env-check', (req, res) => {
  try {
    const requiredVars = [
      'ADMIN_USERNAME',
      'ADMIN_PASSWORD',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'EMAIL_DESTINO',
      'EMAIL_USER',
      'EMAIL_PASS',
      'SMTP_HOST',
      'SMTP_PORT'
    ];

    const envStatus = requiredVars.map(varName => ({
      name: varName,
      configured: !!(process.env[varName] && process.env[varName].trim() !== ''),
      hasValue: process.env[varName] ? process.env[varName].length > 0 : false
    }));

    const missingVars = envStatus.filter(env => !env.configured);
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';

    res.json({
      status: missingVars.length === 0 ? 'OK' : 'ERROR',
      environment: process.env.NODE_ENV || 'development',
      isProduction,
      isVercel: !!process.env.VERCEL,
      totalVariables: requiredVars.length,
      configuredVariables: envStatus.filter(env => env.configured).length,
      missingVariables: missingVars.map(env => env.name),
      variables: envStatus,
      message: missingVars.length === 0 
        ? 'Todas las variables de entorno están configuradas correctamente'
        : `Faltan ${missingVars.length} variables de entorno críticas`,
      troubleshooting: missingVars.length > 0 && isProduction ? {
        issue: 'Variables de entorno faltantes en producción',
        solution: 'Configura las variables faltantes en el panel de Vercel',
        steps: [
          '1. Ve a vercel.com → tu proyecto',
          '2. Settings → Environment Variables',
          '3. Agrega las variables faltantes',
          '4. Redesplega la aplicación'
        ],
        documentation: 'docs/CONFIGURACION_VERCEL_PRODUCCION.md'
      } : null
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Error al verificar variables de entorno',
      error: error.message
    });
  }
});

/**
 * @route GET /auth-debug
 * @desc Debug de configuración de autenticación (sin exponer credenciales)
 * @access Public
 */
router.get('/auth-debug', (req, res) => {
  try {
    const authConfig = {
      environment: process.env.NODE_ENV || 'development',
      isVercel: !!process.env.VERCEL,
      hasAdminUsername: !!(process.env.ADMIN_USERNAME && process.env.ADMIN_USERNAME.trim() !== ''),
      hasAdminPassword: !!(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim() !== ''),
      adminUsernameLength: process.env.ADMIN_USERNAME ? process.env.ADMIN_USERNAME.length : 0,
      adminPasswordLength: process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.length : 0,
      expectedUsername: 'Admin',
      expectedUsernameLength: 5,
      expectedPasswordLength: 7,
      usernameMatches: process.env.ADMIN_USERNAME === 'Admin',
      passwordMatches: process.env.ADMIN_PASSWORD === 'Jw_1914',
      timestamp: new Date().toISOString()
    };

    const status = authConfig.hasAdminUsername && authConfig.hasAdminPassword && 
                   authConfig.usernameMatches && authConfig.passwordMatches ? 'OK' : 'ERROR';

    res.json({
      status,
      message: status === 'OK' ? 'Configuración de autenticación correcta' : 'Problemas en configuración de autenticación',
      config: authConfig,
      troubleshooting: status === 'ERROR' ? {
        steps: [
          '1. Verificar variables en Vercel: Settings → Environment Variables',
          '2. Asegurar ADMIN_USERNAME=Admin',
          '3. Asegurar ADMIN_PASSWORD=Jw_1914',
          '4. Redesplegar la aplicación',
          '5. Verificar este endpoint nuevamente'
        ]
      } : null
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Error al verificar configuración de autenticación',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;