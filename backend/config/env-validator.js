// backend/config/env-validator.js
// Validador de variables de entorno críticas

/**
 * Lista de variables de entorno requeridas para el funcionamiento del sistema
 */
const requiredEnvVars = [
  // Configuración de Supabase
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  
  // Configuración de autenticación admin
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
  
  // Configuración de correo electrónico
  'EMAIL_DESTINO',
  'EMAIL_USER',
  'EMAIL_PASS',
  'SMTP_HOST',
  'SMTP_PORT'
];

/**
 * Valida que todas las variables de entorno requeridas estén configuradas
 * @throws {Error} Si alguna variable requerida no está definida
 */
export function validateEnvironment() {
  console.log('🔍 Validando variables de entorno...');
  
  const missing = requiredEnvVars.filter(varName => {
    const value = process.env[varName];
    return !value || value.trim() === '';
  });
  
  if (missing.length > 0) {
    const errorMessage = `❌ Variables de entorno faltantes o vacías: ${missing.join(', ')}`;
    console.error(errorMessage);
    
    // Mensaje específico para producción/Vercel
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      console.error('🚨 ERROR CRÍTICO EN PRODUCCIÓN:');
      console.error('   Las variables de entorno no están configuradas en Vercel.');
      console.error('   Esto causará fallos en el login y otras funcionalidades.');
      console.error('');
      console.error('📋 SOLUCIÓN:');
      console.error('   1. Ve a tu proyecto en vercel.com');
      console.error('   2. Settings → Environment Variables');
      console.error('   3. Agrega TODAS las variables faltantes');
      console.error('   4. Redesplega la aplicación');
      console.error('');
      console.error('📖 Guía completa: docs/CONFIGURACION_VERCEL_PRODUCCION.md');
    } else {
      console.error('💡 Asegúrate de que todas las variables estén definidas en el archivo .env');
    }
    
    throw new Error(errorMessage);
  }
  
  console.log('✅ Todas las variables de entorno están configuradas correctamente');
  
  // Validaciones adicionales
  validateEmailConfiguration();
  validateSupabaseConfiguration();
  validateAuthenticationConfiguration();
}

/**
 * Valida la configuración específica de correo electrónico
 * @throws {Error} Si la configuración de correo es inválida
 */
function validateEmailConfiguration() {
  const smtpPort = process.env.SMTP_PORT;
  
  // Validar que el puerto SMTP sea un número válido
  if (isNaN(parseInt(smtpPort)) || parseInt(smtpPort) <= 0) {
    throw new Error(`❌ SMTP_PORT debe ser un número válido, recibido: ${smtpPort}`);
  }
  
  // Validar formato básico de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(process.env.EMAIL_DESTINO)) {
    throw new Error(`❌ EMAIL_DESTINO tiene un formato inválido: ${process.env.EMAIL_DESTINO}`);
  }
  
  if (!emailRegex.test(process.env.EMAIL_USER)) {
    throw new Error(`❌ EMAIL_USER tiene un formato inválido: ${process.env.EMAIL_USER}`);
  }
  
  console.log('✅ Configuración de correo electrónico validada');
}

/**
 * Valida la configuración específica de Supabase
 * @throws {Error} Si la configuración de Supabase es inválida
 */
function validateSupabaseConfiguration() {
  const supabaseUrl = process.env.SUPABASE_URL;
  
  // Validar que la URL de Supabase tenga el formato correcto
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    throw new Error(`❌ SUPABASE_URL tiene un formato inválido: ${supabaseUrl}`);
  }
  
  // Validar que la clave de servicio tenga el formato JWT básico
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey.startsWith('eyJ') || serviceKey.split('.').length !== 3) {
    throw new Error('❌ SUPABASE_SERVICE_ROLE_KEY no tiene el formato JWT válido');
  }
  
  console.log('✅ Configuración de Supabase validada');
}

/**
 * Valida la configuración específica de autenticación
 * @throws {Error} Si la configuración de autenticación es inválida
 */
function validateAuthenticationConfiguration() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  
  // Validar formato del username
  if (!username || username.length < 3) {
    throw new Error('❌ ADMIN_USERNAME debe tener al menos 3 caracteres');
  }
  
  // Validar formato de la contraseña
  if (!password || password.length < 6) {
    throw new Error('❌ ADMIN_PASSWORD debe tener al menos 6 caracteres');
  }
  
  // Advertencia específica para producción
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    if (username !== 'Admin' || password !== 'Jw_1914') {
      console.warn('⚠️  ADVERTENCIA: Las credenciales en producción no coinciden con las esperadas.');
      console.warn('   Asegúrate de que ADMIN_USERNAME=Admin y ADMIN_PASSWORD=Jw_1914');
    }
  }
  
  console.log('✅ Configuración de autenticación validada');
}

/**
 * Obtiene información sobre las variables de entorno configuradas (sin mostrar valores sensibles)
 * @returns {Object} Información de configuración
 */
export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    emailConfigured: !!(process.env.EMAIL_DESTINO && process.env.EMAIL_USER && process.env.EMAIL_PASS),
    adminConfigured: !!(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD),
    totalVariables: requiredEnvVars.length,
    configuredVariables: requiredEnvVars.filter(varName => process.env[varName]).length
  };
}

/**
 * Muestra un resumen de la configuración del entorno
 */
export function showEnvironmentSummary() {
  const info = getEnvironmentInfo();
  
  console.log('📋 Resumen de configuración del entorno:');
  console.log(`   • Entorno: ${info.nodeEnv}`);
  console.log(`   • Supabase: ${info.supabaseConfigured ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`   • Correo: ${info.emailConfigured ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`   • Admin: ${info.adminConfigured ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`   • Variables: ${info.configuredVariables}/${info.totalVariables} configuradas`);
}

// Exportación por defecto para compatibilidad
export default {
  validateEnvironment,
  getEnvironmentInfo,
  showEnvironmentSummary
};