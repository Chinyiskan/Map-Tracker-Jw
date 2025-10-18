#!/usr/bin/env node
// scripts/start-with-port.js
// Script para iniciar el servidor con un puerto específico

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script para iniciar el servidor con un puerto personalizado
 * Uso: npm run start:port [puerto]
 * Ejemplo: npm run start:port 3005
 */
function startWithPort() {
  // Obtener el puerto de los argumentos de línea de comandos
  const args = process.argv.slice(2);
  const port = args[0];
  
  if (!port) {
    console.log('❌ Error: Debes especificar un puerto');
    console.log('📋 Uso: npm run start:port [puerto]');
    console.log('📋 Ejemplo: npm run start:port 3005');
    console.log('\n📌 Puertos disponibles predefinidos:');
    console.log('   npm run start:3000');
    console.log('   npm run start:3001');
    console.log('   npm run start:3002');
    console.log('   npm run start:3003');
    console.log('   npm run start:3004');
    console.log('   npm run start:3005');
    process.exit(1);
  }
  
  // Validar que el puerto sea un número válido
  const portNumber = parseInt(port, 10);
  if (isNaN(portNumber) || portNumber < 1000 || portNumber > 65535) {
    console.log('❌ Error: El puerto debe ser un número entre 1000 y 65535');
    process.exit(1);
  }
  
  console.log(`🚀 Iniciando servidor en puerto ${portNumber}...`);
  
  // Configurar variables de entorno
  const env = {
    ...process.env,
    PORT: portNumber.toString(),
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
}

// Ejecutar el script
startWithPort();