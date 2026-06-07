// backend/config/env-validator.js
// Validador de variables de entorno críticas

/**
 * Lista de variables de entorno requeridas para el funcionamiento del sistema
 */
const requiredEnvVars = [
  // Configuración de autenticación admin
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD'
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
    } else {
      console.error('💡 Asegúrate de que todas las variables estén definidas en el archivo .env');
    }
    
    throw new Error(errorMessage);
  }
  
  console.log('✅ Todas las variables de entorno están configuradas correctamente');
  validateAuthenticationConfiguration();
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
  
  console.log('✅ Configuración de autenticación validada');
}

/**
 * Obtiene información sobre las variables de entorno configuradas (sin mostrar valores sensibles)
 * @returns {Object} Información de configuración
 */
export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
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
  console.log(`   • Admin: ${info.adminConfigured ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`   • Variables: ${info.configuredVariables}/${info.totalVariables} configuradas`);
}

export default {
  validateEnvironment,
  getEnvironmentInfo,
  showEnvironmentSummary
};