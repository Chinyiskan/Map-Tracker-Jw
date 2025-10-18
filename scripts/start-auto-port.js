#!/usr/bin/env node
// scripts/start-auto-port.js
// Script para iniciar el servidor con auto-detección de puerto disponible

import { spawn } from 'child_process';
import { createServer } from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Verificar si un puerto está disponible
 * @param {number} port - Puerto a verificar
 * @returns {Promise<boolean>} - True si está disponible
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Encontrar el primer puerto disponible en un rango
 * @param {number} startPort - Puerto inicial
 * @param {number} endPort - Puerto final
 * @returns {Promise<number|null>} - Puerto disponible o null
 */
async function findAvailablePort(startPort = 3000, endPort = 3010) {
  for (let port = startPort; port <= endPort; port++) {
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
  }
  return null;
}

/**
 * Script principal para auto-detección de puerto
 */
async function startAutoPort() {
  console.log('🔍 Buscando puerto disponible...');
  
  // Puertos preferidos en orden de prioridad
  const preferredPorts = [3002, 3000, 3001, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];
  
  let availablePort = null;
  
  // Intentar puertos preferidos primero
  for (const port of preferredPorts) {
    const available = await isPortAvailable(port);
    if (available) {
      availablePort = port;
      break;
    } else {
      console.log(`⚠️  Puerto ${port} ocupado`);
    }
  }
  
  // Si no hay puertos preferidos disponibles, buscar en rango extendido
  if (!availablePort) {
    console.log('🔍 Buscando en rango extendido (3011-3050)...');
    availablePort = await findAvailablePort(3011, 3050);
  }
  
  if (!availablePort) {
    console.log('❌ Error: No se encontró ningún puerto disponible en el rango 3000-3050');
    console.log('💡 Sugerencias:');
    console.log('   - Cierra otras aplicaciones que puedan estar usando puertos');
    console.log('   - Usa npm run start:port [puerto] para especificar un puerto manualmente');
    process.exit(1);
  }
  
  console.log(`✅ Puerto disponible encontrado: ${availablePort}`);
  console.log(`🚀 Iniciando servidor en puerto ${availablePort}...`);
  
  // Configurar variables de entorno
  const env = {
    ...process.env,
    PORT: availablePort.toString(),
    NODE_ENV: process.env.NODE_ENV || 'development'
  };
  
  // Ruta al archivo del servidor
  const serverPath = path.join(__dirname, '..', 'backend', 'server.js');
  
  // Iniciar el proceso del servidor
  const serverProcess = spawn('node', [serverPath], {
    env,
    stdio: 'inherit',
    shell: true
  });
  
  // Manejar eventos del proceso
  serverProcess.on('error', (error) => {
    console.error('❌ Error al iniciar el servidor:', error.message);
    process.exit(1);
  });
  
  serverProcess.on('exit', (code, signal) => {
    if (code !== 0) {
      console.log(`❌ El servidor se cerró con código ${code}`);
    } else {
      console.log('✅ Servidor cerrado correctamente');
    }
    process.exit(code || 0);
  });
  
  // Manejar señales de cierre
  process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    serverProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando servidor...');
    serverProcess.kill('SIGTERM');
  });
  
  // Mostrar información útil
  setTimeout(() => {
    console.log('\n📋 Información del servidor:');
    console.log(`   🌐 URL: http://localhost:${availablePort}`);
    console.log(`   ⚙️  Admin: http://localhost:${availablePort}/admin`);
    console.log(`   🔌 Health: http://localhost:${availablePort}/api/health`);
    console.log(`   📊 Métricas: http://localhost:${availablePort}/api/metrics`);
    console.log('\n💡 Para usar un puerto específico: npm run start:port [puerto]');
  }, 2000);
}

// Ejecutar el script
startAutoPort().catch((error) => {
  console.error('❌ Error en auto-detección de puerto:', error.message);
  process.exit(1);
});