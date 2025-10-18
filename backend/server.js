// backend/server.js
// Punto de entrada del servidor - Refactorizado para arquitectura modular

const { default: app, initializeApp } = require('./app.js');
const dotenv = require('dotenv');
const path = require('path');
const { validateEnvironment, showEnvironmentSummary } = require('./config/env-validator.js');

// Configurar __dirname para CommonJS
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

// Importar configuración de puertos
const { getOptimalPort, PORT_CONFIG } = require('./config/port-config.js');

// Configuración del servidor
const PREFERRED_PORT = parseInt(process.env.PORT, 10) || PORT_CONFIG.DEFAULT_PORT;
const HOST = process.env.HOST || PORT_CONFIG.DEFAULT_HOST;
const NODE_ENV = process.env.NODE_ENV || 'production';

/**
 * Función principal para iniciar el servidor
 */
async function startServer() {
  try {
    console.log('🚀 Iniciando Map Tracker JW Server...');
    console.log('📁 Arquitectura: Frontend/Backend Modular');
    console.log('🌿 Rama:', 'refactor/modular-architecture-from-ajuste1');
    
    // Inicializar la aplicación
    const initialized = await initializeApp();
    if (!initialized) {
      throw new Error('Fallo en la inicialización de la aplicación');
    }
    
    // Obtener puerto óptimo usando la configuración centralizada
    let portInfo;
    try {
      portInfo = await getOptimalPort(PREFERRED_PORT, HOST);
      console.log(`✅ ${portInfo.message}`);
    } catch (error) {
      console.error('❌ Error al encontrar puerto disponible:', error.message);
      console.error('💡 Sugerencias:');
      console.error('   - Cierra otras aplicaciones que usen puertos');
      console.error('   - Usa npm run dev:auto para auto-detección');
      console.error('   - Usa npm run start:port [puerto] para puerto específico');
      process.exit(1);
    }
    
    const finalPort = portInfo.port;
    
    // Actualizar variable de entorno para otros módulos
    process.env.PORT = finalPort.toString();
    
    // Iniciar el servidor
    const server = app.listen(finalPort, HOST, () => {
      console.log('\n🎉 ¡Servidor Map Tracker JW iniciado exitosamente!');
      console.log(`🌍 Entorno: ${NODE_ENV}`);
      console.log(`🔌 Puerto: ${finalPort} ${portInfo.isPreferred ? '(preferido)' : '(alternativo)'}`);
      console.log(`🏠 Host: ${HOST}`);
      
      console.log('\n🌐 URLs Principales:');
      console.log(`   📡 Aplicación: http://${HOST}:${finalPort}`);
      console.log(`   ⚙️  Panel Admin: http://${HOST}:${finalPort}/admin`);
      console.log(`   🔌 Health Check: http://${HOST}:${finalPort}/api/health`);
      console.log(`   📊 Métricas: http://${HOST}:${finalPort}/api/metrics`);
      
      console.log('\n📋 APIs Disponibles:');
      console.log(`   📊 Reportes: http://${HOST}:${finalPort}/api/reportes`);
      console.log(`   🚪 Salidas: http://${HOST}:${finalPort}/api/salidas`);
      console.log(`   👥 Capitanes: http://${HOST}:${finalPort}/api/capitanes`);
      console.log(`   🔄 Ciclos: http://${HOST}:${finalPort}/api/ciclos`);
      console.log(`   🔐 Auth: http://${HOST}:${finalPort}/api/auth`);
      console.log(`   🔧 Optimización: http://${HOST}:${finalPort}/api/optimizacion`);
      
      console.log('\n💡 Comandos útiles para desarrollo:');
      console.log('   npm start           - Iniciar en puerto por defecto');
      console.log('   npm run dev:auto    - Auto-detectar puerto disponible');
      console.log('   npm run start:3000  - Iniciar en puerto específico');
      console.log('   npm run start:port 3005 - Iniciar en puerto personalizado');
      console.log('   npm run dev:watch   - Modo desarrollo con auto-reload');
      
      console.log('\n🚀 Optimizaciones activas:');
      console.log('   ✅ Compresión Gzip habilitada');
      console.log('   ✅ Rate Limiting configurado');
      console.log('   ✅ Headers de caché HTTP');
      console.log('   ✅ Sistema de métricas en tiempo real');
      console.log('   ✅ Bundle optimization con lazy loading');
      
      console.log('\n✅ Servidor listo para recibir solicitudes\n');
    });
    
    // Manejo de cierre graceful
    process.on('SIGTERM', () => {
      console.log('\n🛑 Recibida señal SIGTERM, cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('\n🛑 Recibida señal SIGINT (Ctrl+C), cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });
    
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