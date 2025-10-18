// backend/infrastructure/database/ErrorHandlingService.js
// Servicio centralizado para manejo estandarizado de errores en repositorios

/**
 * Servicio de Manejo de Errores - Estandariza el comportamiento ante fallos
 * Proporciona fallbacks automáticos y datos mock para garantizar disponibilidad
 */
export class ErrorHandlingService {
  /**
   * Manejar errores de base de datos con fallback automático
   * @param {Error} error - Error capturado
   * @param {string} operation - Operación que falló
   * @param {string} tableName - Nombre de la tabla
   * @param {Function} mockDataProvider - Función que proporciona datos mock
   * @param {Object} filters - Filtros aplicados (opcional)
   * @returns {any} Datos mock o error re-lanzado según el tipo
   */
  static handleDatabaseError(error, operation, tableName, mockDataProvider, filters = {}) {
    console.error(`❌ Error en ${operation} para tabla ${tableName}:`, error);
    
    // Verificar si es un error de tabla inexistente
    if (this.isTableNotExistError(error)) {
      console.log(`⚠️ Tabla ${tableName} no existe, usando datos mock`);
      return mockDataProvider(filters);
    }
    
    // Verificar si es un error de conexión
    if (this.isConnectionError(error)) {
      console.log(`⚠️ Error de conexión en ${tableName}, usando datos mock como fallback`);
      return mockDataProvider(filters);
    }
    
    // Verificar si es un error de permisos
    if (this.isPermissionError(error)) {
      console.log(`⚠️ Error de permisos en ${tableName}, usando datos mock como fallback`);
      return mockDataProvider(filters);
    }
    
    // Para otros errores críticos, re-lanzar
    throw error;
  }
  
  /**
   * Manejar errores en operaciones de escritura
   * @param {Error} error - Error capturado
   * @param {string} operation - Operación que falló
   * @param {string} tableName - Nombre de la tabla
   * @param {Object} data - Datos que se intentaban escribir
   * @returns {Object} Resultado mock o error re-lanzado
   */
  static handleWriteError(error, operation, tableName, data) {
    console.error(`❌ Error en ${operation} para tabla ${tableName}:`, error);
    
    // Si la tabla no existe, simular operación exitosa
    if (this.isTableNotExistError(error)) {
      console.log(`⚠️ Tabla ${tableName} no existe, simulando ${operation}`);
      return this.createMockWriteResult(operation, data);
    }
    
    // Para otros errores, re-lanzar
    throw error;
  }
  
  /**
   * Verificar si es un error de tabla inexistente
   * @param {Error} error - Error a verificar
   * @returns {boolean} True si es error de tabla inexistente
   */
  static isTableNotExistError(error) {
    if (!error) return false;
    
    // Error code de PostgreSQL para tabla inexistente
    if (error.code === '42P01') return true;
    
    // Mensajes comunes de tabla inexistente
    const message = error.message?.toLowerCase() || '';
    return message.includes('relation') && message.includes('does not exist') ||
           message.includes('table') && message.includes('does not exist') ||
           message.includes('no existe');
  }
  
  /**
   * Verificar si es un error de conexión
   * @param {Error} error - Error a verificar
   * @returns {boolean} True si es error de conexión
   */
  static isConnectionError(error) {
    if (!error) return false;
    
    const message = error.message?.toLowerCase() || '';
    const code = error.code?.toLowerCase() || '';
    
    return message.includes('connection') ||
           message.includes('network') ||
           message.includes('timeout') ||
           message.includes('econnrefused') ||
           message.includes('enotfound') ||
           code.includes('econnrefused') ||
           code.includes('enotfound');
  }
  
  /**
   * Verificar si es un error de permisos
   * @param {Error} error - Error a verificar
   * @returns {boolean} True si es error de permisos
   */
  static isPermissionError(error) {
    if (!error) return false;
    
    const message = error.message?.toLowerCase() || '';
    const code = error.code?.toLowerCase() || '';
    
    return message.includes('permission') ||
           message.includes('unauthorized') ||
           message.includes('forbidden') ||
           message.includes('access denied') ||
           code === '42501' || // PostgreSQL insufficient privilege
           code === '28000';   // PostgreSQL invalid authorization
  }
  
  /**
   * Crear resultado mock para operaciones de escritura
   * @param {string} operation - Tipo de operación
   * @param {Object} data - Datos originales
   * @returns {Object} Resultado mock
   */
  static createMockWriteResult(operation, data) {
    const timestamp = new Date().toISOString();
    
    switch (operation) {
      case 'create':
      case 'insert':
        return {
          ...data,
          id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          created_at: timestamp,
          updated_at: timestamp
        };
        
      case 'update':
        return {
          ...data,
          updated_at: timestamp
        };
        
      case 'delete':
        return { success: true, deleted_at: timestamp };
        
      default:
        return { success: true, timestamp };
    }
  }
  
  /**
   * Ejecutar operación con manejo automático de errores
   * @param {Function} operation - Función de operación a ejecutar
   * @param {string} operationName - Nombre de la operación
   * @param {string} tableName - Nombre de la tabla
   * @param {Function} mockDataProvider - Proveedor de datos mock
   * @param {Object} filters - Filtros aplicados
   * @returns {Promise<any>} Resultado de la operación o datos mock
   */
  static async executeWithFallback(operation, operationName, tableName, mockDataProvider, filters = {}) {
    try {
      console.log(`🔍 Ejecutando ${operationName} en tabla ${tableName}`);
      const result = await operation();
      console.log(`✅ ${operationName} exitoso en ${tableName}`);
      return result;
    } catch (error) {
      console.error(`❌ Error en ${operationName} para ${tableName}:`, error);
      
      // Intentar fallback automático
      if (this.shouldUseFallback(error)) {
        console.log(`⚠️ Usando fallback para ${operationName} en ${tableName}`);
        return mockDataProvider(filters);
      }
      
      // Re-lanzar errores que no tienen fallback
      throw error;
    }
  }
  
  /**
   * Determinar si se debe usar fallback para un error
   * @param {Error} error - Error a evaluar
   * @returns {boolean} True si se debe usar fallback
   */
  static shouldUseFallback(error) {
    return this.isTableNotExistError(error) ||
           this.isConnectionError(error) ||
           this.isPermissionError(error);
  }
  
  /**
   * Crear respuesta estandarizada de error
   * @param {Error} error - Error original
   * @param {string} operation - Operación que falló
   * @param {string} tableName - Nombre de la tabla
   * @returns {Object} Respuesta de error estandarizada
   */
  static createErrorResponse(error, operation, tableName) {
    return {
      success: false,
      error: `Error en ${operation} para ${tableName}`,
      message: error.message,
      timestamp: new Date().toISOString(),
      details: {
        operation,
        table: tableName,
        code: error.code,
        type: this.getErrorType(error)
      }
    };
  }
  
  /**
   * Obtener tipo de error
   * @param {Error} error - Error a clasificar
   * @returns {string} Tipo de error
   */
  static getErrorType(error) {
    if (this.isTableNotExistError(error)) return 'TABLE_NOT_EXIST';
    if (this.isConnectionError(error)) return 'CONNECTION_ERROR';
    if (this.isPermissionError(error)) return 'PERMISSION_ERROR';
    return 'UNKNOWN_ERROR';
  }
  
  /**
   * Log de error con contexto completo
   * @param {Error} error - Error a loggear
   * @param {string} operation - Operación que falló
   * @param {string} tableName - Nombre de la tabla
   * @param {Object} context - Contexto adicional
   */
  static logError(error, operation, tableName, context = {}) {
    console.error(`❌ [${tableName}] Error en ${operation}:`, {
      message: error.message,
      code: error.code,
      type: this.getErrorType(error),
      context,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Log de fallback utilizado
   * @param {string} operation - Operación que usó fallback
   * @param {string} tableName - Nombre de la tabla
   * @param {string} fallbackType - Tipo de fallback usado
   */
  static logFallback(operation, tableName, fallbackType) {
    console.log(`⚠️ [${tableName}] Fallback usado en ${operation}: ${fallbackType}`);
  }
}

export default ErrorHandlingService;