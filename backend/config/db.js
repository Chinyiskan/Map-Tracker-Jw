// backend/config/db.js
// Cliente modular de SheetDB para Google Sheets

const SHEETDB_URL = 'https://sheetdb.io/api/v1/yh8g3sq2sswqv';

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
 * Realiza una petición genérica a la API de SheetDB
 * @param {string} path - Ruta o parámetros de consulta
 * @param {Object} options - Opciones de fetch (method, body, headers)
 * @returns {Promise<any>} Datos devueltos por la API
 */
async function apiRequest(path, options = {}) {
  const url = `${SHEETDB_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'No response body');
    throw new Error(`SheetDB Error [${response.status}]: ${errorText}`);
  }

  return response.json();
}

/**
 * Obtener todos los registros de una hoja específica
 * @param {string} sheetName - Nombre de la hoja de cálculo
 * @returns {Promise<Array>} Registros de la hoja
 */
export async function getRows(sheetName) {
  const now = Date.now();
  const cached = dbCache.get(sheetName);
  
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    console.log(`⚡ Servido desde caché para la hoja "${sheetName}"`);
    return JSON.parse(JSON.stringify(cached.data)); // Retornar copia para evitar mutaciones
  }

  try {
    const data = await apiRequest(`?sheet=${encodeURIComponent(sheetName)}`);
    const rows = Array.isArray(data) ? data : [];
    
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
 * Insertar un nuevo registro en una hoja específica
 * @param {string} sheetName - Nombre de la hoja de cálculo
 * @param {Object} rowData - Datos a insertar
 * @returns {Promise<any>} Resultado de la inserción
 */
export async function addRow(sheetName, rowData) {
  try {
    const result = await apiRequest(`?sheet=${encodeURIComponent(sheetName)}`, {
      method: 'POST',
      body: JSON.stringify({ data: [rowData] }),
    });
    invalidateCache(sheetName);
    return result;
  } catch (error) {
    console.error(`❌ Error en addRow para la hoja "${sheetName}":`, error.message);
    throw error;
  }
}

/**
 * Actualizar registros que coincidan con un criterio
 * @param {string} sheetName - Nombre de la hoja de cálculo
 * @param {string} columnName - Columna filtro (ej. 'id' o 'ID')
 * @param {string|number} columnValue - Valor de la columna filtro
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<any>} Resultado de la actualización
 */
export async function updateRow(sheetName, columnName, columnValue, updateData) {
  try {
    const result = await apiRequest(`/${encodeURIComponent(columnName)}/${encodeURIComponent(columnValue)}?sheet=${encodeURIComponent(sheetName)}`, {
      method: 'PATCH',
      body: JSON.stringify({ data: updateData }),
    });
    invalidateCache(sheetName);
    return result;
  } catch (error) {
    console.error(`❌ Error en updateRow para la hoja "${sheetName}":`, error.message);
    throw error;
  }
}

/**
 * Eliminar registros que coincidan con un criterio
 * @param {string} sheetName - Nombre de la hoja de cálculo
 * @param {string} columnName - Columna filtro (ej. 'id' o 'ID')
 * @param {string|number} columnValue - Valor de la columna filtro
 * @returns {Promise<any>} Resultado de la eliminación
 */
export async function deleteRow(sheetName, columnName, columnValue) {
  try {
    const result = await apiRequest(`/${encodeURIComponent(columnName)}/${encodeURIComponent(columnValue)}?sheet=${encodeURIComponent(sheetName)}`, {
      method: 'DELETE',
    });
    invalidateCache(sheetName);
    return result;
  } catch (error) {
    console.error(`❌ Error en deleteRow para la hoja "${sheetName}":`, error.message);
    throw error;
  }
}

/**
 * Probar conexión con SheetDB obteniendo las hojas
 * @returns {Promise<boolean>} True si la conexión es exitosa
 */
export async function testConnection() {
  try {
    const response = await fetch(`${SHEETDB_URL}/sheets`);
    if (!response.ok) return false;
    const data = await response.json();
    return Array.isArray(data) || (data && typeof data === 'object');
  } catch (error) {
    console.error('❌ Error de prueba de conexión con SheetDB:', error.message);
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