// backend/server.js
// Punto de entrada del servidor - Versión simplificada y limpia

import app, { initializeApp } from './app.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateEnvironment, showEnvironmentSummary } from './config/env-validator.js';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Validar variables de entorno críticas
try {
  validateEnvironment();
  showEnvironmentSummary();
} catch (error) {
  console.error('💥 Error en la configuración del entorno:', error.message);
  console.error('🛑 El servidor no puede iniciarse sin la configuración correcta');
  process.exit(1);
}

// Configuración del servidor
const PORT = parseInt(process.env.PORT, 10) || 3002;
const HOST = process.env.HOST || 'localhost';
const NODE_ENV = process.env.NODE_ENV || 'production';

/**
 * Función principal para iniciar el servidor
 */
async function startServer() {
  try {
    console.log('🚀 Iniciando Map Tracker JW Server...');
    console.log('📁 Arquitectura: Frontend/Backend Modular Simplificado');
    
    // Inicializar la aplicación
    const initialized = await initializeApp();
    if (!initialized) {
      throw new Error('Fallo en la inicialización de la aplicación');
    }
    
    // Iniciar el servidor Express
    const server = app.listen(PORT, HOST, () => {
      console.log('\n🎉 ¡Servidor Map Tracker JW iniciado exitosamente!');
      console.log(`🌍 Entorno: ${NODE_ENV}`);
      console.log(`🔌 Puerto: ${PORT}`);
      console.log(`🏠 Host: ${HOST}`);
      
      console.log('\n🌐 URLs Principales:');
      console.log(`   📡 Aplicación: http://${HOST}:${PORT}`);
      console.log(`   ⚙️  Panel Admin: http://${HOST}:${PORT}/admin`);
      console.log(`   🔌 Health Check: http://${HOST}:${PORT}/api/health`);
      
      console.log('\n📋 APIs Disponibles:');
      console.log(`   📊 Reportes: http://${HOST}:${PORT}/api/reportes`);
      console.log(`   🔐 Auth: http://${HOST}:${PORT}/api/auth`);
      
      console.log('\n🚀 Optimizaciones activas:');
      console.log('   ✅ Compresión Gzip habilitada');
      console.log('   ✅ Conexión directa a Google Apps Script activa');
      console.log('\n✅ Servidor listo para recibir solicitudes\n');
    });
    
    // Manejo de cierre graceful
    const shutdown = (signal) => {
      console.log(`\n🛑 Recibida señal ${signal}, cerrando servidor...`);
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message);
    console.error('📋 Stack trace:', error.stack);
    process.exit(1);
  }
}

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error.message);
  console.error('📋 Stack trace:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  console.error('📋 Promesa:', promise);
  process.exit(1);
});

// Iniciar el servidor
startServer();