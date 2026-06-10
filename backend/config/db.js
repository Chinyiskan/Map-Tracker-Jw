// backend/config/db.js
// Cliente modular directo para Google Sheets usando Google Apps Script

const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxKT7dRZExcPf3jFNn2CQQv37dM1Q7UnD8_rnaFI3IcuHZRCuA2DUwFSQrJVaqFtep-/exec';

// Cache en memoria para almacenar las filas de las hojas
const dbCache = new Map();
const CACHE_TTL = 30000; // 30 segundos

/**
 * Invalida el caché de una hoja específica
 * @param {string} sheetName - Nombre de la hoja de cálculo
 */
export function invalidateCache(sheetName) {
  if (dbCache.has(sheetName)) {
    console.log(`🧹 Cache invalidado para la hoja: "${sheetName}"`);
    dbCache.delete(sheetName);
  }
}

/**
 * Normaliza cualquier formato de fecha a string YYYY-MM-DD
 * @param {any} dateVal - Valor de fecha a normalizar
 * @returns {string} Fecha formateada como YYYY-MM-DD
 */
export function normalizeDateStr(dateVal) {
  if (!dateVal) return '';
  const valStr = String(dateVal).trim();
  if (!valStr) return '';

  // 1. Número de serie de Excel/Google Sheets (ej. "46179")
  if (/^\d+(\.\d+)?$/.test(valStr)) {
    const serial = parseFloat(valStr);
    const jsDate = new Date(1899, 11, 30 + Math.floor(serial));
    if (!isNaN(jsDate.getTime())) {
      return jsDate.toISOString().split('T')[0];
    }
  }

  // 2. Formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(valStr)) {
    return valStr;
  }

  // 3. Formato DD/MM/YYYY o MM/DD/YYYY con slash/guiones
  const slashMatch = valStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashMatch) {
    const [, d, m, y] = slashMatch;
    const paddedMonth = m.padStart(2, '0');
    const paddedDay = d.padStart(2, '0');
    return `${y}-${paddedMonth}-${paddedDay}`;
  }

  // 4. Intentar parsing estándar de fecha
  const parsedDate = new Date(valStr);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().split('T')[0];
  }

  return valStr;
}

/**
 * Obtener todos los registros de la hoja de reportes
 * @param {string} sheetName - Nombre de la hoja de cálculo (debe ser 'reportes')
 * @returns {Promise<Array>} Registros de la hoja
 */
export async function getRows(sheetName) {
  if (sheetName !== 'reportes') {
    console.warn(`⚠️ Intento de acceder a hoja no soportada: "${sheetName}"`);
    return [];
  }

  const now = Date.now();
  const cached = dbCache.get(sheetName);
  
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    console.log(`⚡ Servido desde caché para la hoja "${sheetName}"`);
    return JSON.parse(JSON.stringify(cached.data));
  }

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL);
    if (!response.ok) {
      throw new Error(`Google Apps Script Error [${response.status}]`);
    }

    const json = await response.json();
    if (json.status !== 'success') {
      throw new Error(json.message || 'Error en respuesta de Google Apps Script');
    }

    const rows = Array.isArray(json.data) ? json.data : [];
    
    // Guardar en caché
    dbCache.set(sheetName, {
      data: rows,
      timestamp: now
    });
    
    return rows;
  } catch (error) {
    console.error(`❌ Error en getRows para la hoja "${sheetName}":`, error.message);
    return [];
  }
}

/**
 * Mapea el estado del reporte al formato exacto requerido por la validación de la hoja de cálculo:
 * "0: Iniciando", "1: Trabajando", "2: Finalizado"
 * @param {string} estado - Estado del reporte recibido
 * @returns {string} Estado mapeado
 */
function mapEstadoToSheet(estado) {
  if (!estado) return '0: Iniciando';
  const val = String(estado).trim().toLowerCase();
  
  if (val.includes('0') || val.includes('iniciando') || val.includes('iniciado')) {
    return '0: Iniciando';
  }
  if (val.includes('1') || val.includes('progreso') || val.includes('trabajando') || val.includes('asignado')) {
    return '1: Trabajando';
  }
  if (val.includes('2') || val.includes('finalizado') || val.includes('completado') || val.includes('finalizando')) {
    return '2: Finalizado';
  }
  
  return '0: Iniciando'; // fallback seguro
}

/**
 * Insertar un nuevo registro en la hoja de reportes
 * @param {string} sheetName - Nombre de la hoja de cálculo (debe ser 'reportes')
 * @param {Object} rowData - Datos a insertar
 * @returns {Promise<any>} Resultado de la inserción
 */
export async function addRow(sheetName, rowData) {
  if (sheetName !== 'reportes') {
    throw new Error(`Operación addRow no soportada para la hoja: "${sheetName}"`);
  }

  try {
    const payload = {
      ID: rowData.ID || rowData.id || '',
      Fecha: rowData.Fecha || rowData.fecha || '',
      Manzanas: rowData.Manzanas || rowData.manzanas || '',
      Barrio: rowData.Barrio || rowData.barrio || '',
      Estado: mapEstadoToSheet(rowData.Estado || rowData.estado),
      nombreCapitan: rowData['Nombre del capitán'] || rowData.nombre_capitan || rowData.nombreCapitan || '',
      Observaciones: rowData.Observaciones || rowData.observaciones || ''
    };

    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script POST Error [${response.status}]`);
    }

    const json = await response.json();
    if (json.status !== 'success') {
      throw new Error(json.message || 'Error en respuesta de Google Apps Script POST');
    }

    invalidateCache(sheetName);
    return json;
  } catch (error) {
    console.error(`❌ Error en addRow para la hoja "${sheetName}":`, error.message);
    throw error;
  }
}

/**
 * Actualizar registros (No implementado en Apps Script, deshabilitado)
 */
export async function updateRow(sheetName, columnName, columnValue, updateData) {
  console.warn(`⚠️ updateRow deshabilitado para la hoja "${sheetName}"`);
  return { success: false, message: 'Operación no soportada' };
}

/**
 * Eliminar registros (No implementado en Apps Script, deshabilitado)
 */
export async function deleteRow(sheetName, columnName, columnValue) {
  console.warn(`⚠️ deleteRow deshabilitado para la hoja "${sheetName}"`);
  return { success: false, message: 'Operación no soportada' };
}

/**
 * Probar conexión con Google Apps Script
 * @returns {Promise<boolean>} True si la conexión es exitosa
 */
export async function testConnection() {
  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL);
    if (!response.ok) return false;
    const json = await response.json();
    return json.status === 'success';
  } catch (error) {
    console.error('❌ Error de prueba de conexión con Google Apps Script:', error.message);
    return false;
  }
}

export default {
  getRows,
  addRow,
  updateRow,
  deleteRow,
  testConnection,
  invalidateCache,
  normalizeDateStr
};