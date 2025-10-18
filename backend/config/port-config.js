// backend/config/port-config.js
// Configuración centralizada de puertos para el servidor

import { createServer } from 'net';

/**
 * Configuración de puertos del sistema
 */
export const PORT_CONFIG = {
  // Puerto por defecto
  DEFAULT_PORT: 3002,
  
  // Puertos preferidos en orden de prioridad
  PREFERRED_PORTS: [3002, 3000, 3001, 3003, 3004, 3005],
  
  // Rango de puertos para búsqueda automática
  AUTO_SEARCH_RANGE: {
    START: 3000,
    END: 3010
  },
  
  // Rango extendido para casos extremos
  EXTENDED_RANGE: {
    START: 3011,
    END: 3050
  },
  
  // Host por defecto
  DEFAULT_HOST: 'localhost',
  
  // Timeout para verificación de puertos
  PORT_CHECK_TIMEOUT: 1000
};

/**
 * Verificar si un puerto está disponible
 * @param {number} port - Puerto a verificar
 * @param {string} host - Host a verificar (opcional)
 * @returns {Promise<boolean>} - True si está disponible
 */
export function isPortAvailable(port, host = PORT_CONFIG.DEFAULT_HOST) {
  return new Promise((resolve) => {
    const server = createServer();
    
    // Timeout para evitar bloqueos
    const timeout = setTimeout(() => {
      server.close();
      resolve(false);
    }, PORT_CONFIG.PORT_CHECK_TIMEOUT);
    
    server.listen(port, host, () => {
      clearTimeout(timeout);
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

/**
 * Encontrar el primer puerto disponible en una lista
 * @param {number[]} ports - Lista de puertos a verificar
 * @param {string} host - Host a verificar (opcional)
 * @returns {Promise<number|null>} - Puerto disponible o null
 */
export async function findAvailablePortFromList(ports, host = PORT_CONFIG.DEFAULT_HOST) {
  for (const port of ports) {
    const available = await isPortAvailable(port, host);
    if (available) {
      return port;
    }
  }
  return null;
}

/**
 * Encontrar puerto disponible en un rango
 * @param {number} startPort - Puerto inicial
 * @param {number} endPort - Puerto final
 * @param {string} host - Host a verificar (opcional)
 * @returns {Promise<number|null>} - Puerto disponible o null
 */
export async function findAvailablePortInRange(startPort, endPort, host = PORT_CONFIG.DEFAULT_HOST) {
  for (let port = startPort; port <= endPort; port++) {
    const available = await isPortAvailable(port, host);
    if (available) {
      return port;
    }
  }
  return null;
}

/**
 * Obtener puerto óptimo para el servidor
 * @param {number} preferredPort - Puerto preferido (opcional)
 * @param {string} host - Host a verificar (opcional)
 * @returns {Promise<{port: number, isPreferred: boolean, message: string}>}
 */
export async function getOptimalPort(preferredPort = null, host = PORT_CONFIG.DEFAULT_HOST) {
  const targetPort = preferredPort || parseInt(process.env.PORT, 10) || PORT_CONFIG.DEFAULT_PORT;
  
  // Verificar puerto preferido primero
  const preferredAvailable = await isPortAvailable(targetPort, host);
  if (preferredAvailable) {
    return {
      port: targetPort,
      isPreferred: true,
      message: `Puerto preferido ${targetPort} disponible`
    };
  }
  
  console.log(`⚠️  Puerto ${targetPort} ocupado, buscando alternativas...`);
  
  // Buscar en puertos preferidos
  const availablePreferredPort = await findAvailablePortFromList(PORT_CONFIG.PREFERRED_PORTS, host);
  if (availablePreferredPort) {
    return {
      port: availablePreferredPort,
      isPreferred: false,
      message: `Puerto alternativo ${availablePreferredPort} encontrado en lista preferida`
    };
  }
  
  // Buscar en rango automático
  const autoPort = await findAvailablePortInRange(
    PORT_CONFIG.AUTO_SEARCH_RANGE.START,
    PORT_CONFIG.AUTO_SEARCH_RANGE.END,
    host
  );
  if (autoPort) {
    return {
      port: autoPort,
      isPreferred: false,
      message: `Puerto ${autoPort} encontrado en rango automático`
    };
  }
  
  // Buscar en rango extendido
  const extendedPort = await findAvailablePortInRange(
    PORT_CONFIG.EXTENDED_RANGE.START,
    PORT_CONFIG.EXTENDED_RANGE.END,
    host
  );
  if (extendedPort) {
    return {
      port: extendedPort,
      isPreferred: false,
      message: `Puerto ${extendedPort} encontrado en rango extendido`
    };
  }
  
  // No se encontró puerto disponible
  throw new Error('No se encontró ningún puerto disponible en los rangos configurados');
}

/**
 * Obtener información de puertos ocupados
 * @param {number[]} ports - Lista de puertos a verificar
 * @param {string} host - Host a verificar (opcional)
 * @returns {Promise<{available: number[], occupied: number[]}>}
 */
export async function getPortsStatus(ports = PORT_CONFIG.PREFERRED_PORTS, host = PORT_CONFIG.DEFAULT_HOST) {
  const available = [];
  const occupied = [];
  
  for (const port of ports) {
    const isAvailable = await isPortAvailable(port, host);
    if (isAvailable) {
      available.push(port);
    } else {
      occupied.push(port);
    }
  }
  
  return { available, occupied };
}

/**
 * Mostrar información de puertos disponibles
 * @param {string} host - Host a verificar (opcional)
 */
export async function showPortsInfo(host = PORT_CONFIG.DEFAULT_HOST) {
  console.log('🔍 Verificando estado de puertos...');
  
  const status = await getPortsStatus(PORT_CONFIG.PREFERRED_PORTS, host);
  
  console.log('\n📊 Estado de puertos preferidos:');
  if (status.available.length > 0) {
    console.log(`✅ Disponibles: ${status.available.join(', ')}`);
  }
  if (status.occupied.length > 0) {
    console.log(`❌ Ocupados: ${status.occupied.join(', ')}`);
  }
  
  return status;
}

export default {
  PORT_CONFIG,
  isPortAvailable,
  findAvailablePortFromList,
  findAvailablePortInRange,
  getOptimalPort,
  getPortsStatus,
  showPortsInfo
};