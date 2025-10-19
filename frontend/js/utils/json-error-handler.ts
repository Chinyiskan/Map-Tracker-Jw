/**
 * Manejador global de errores JSON y limpieza de datos corruptos
 * Previene y corrige errores de parsing JSON en toda la aplicación
 */

import { JSONUtils } from './json-utils.js';
import type { JSONError, ErrorHandlerConfig } from '../types/index.js';

interface HealthStats {
  localStorage: StorageStats;
  sessionStorage: StorageStats;
}

interface StorageStats {
  total: number;
  valid: number;
  corrupted: number;
  keys: (string | null)[];
}

export interface JSONErrorHandlerInterface {
  init(): void;
  cleanExistingCorruptedData(): void;
  setupGlobalErrorHandlers(): void;
  interceptJSONMethods(): void;
  handleJSONError(error: Error): void;
  validateAndRepair(key: string, storageType?: 'local' | 'session'): boolean;
  getHealthStats(): HealthStats;
  showHealthReport(): HealthStats;
}

export const JSONErrorHandler: JSONErrorHandlerInterface = {
  /**
   * Inicializar el manejador de errores JSON
   */
  init(): void {
    console.log('🔧 Inicializando JSONErrorHandler...');
    
    // Limpiar datos corruptos existentes
    this.cleanExistingCorruptedData();
    
    // Configurar manejadores globales
    this.setupGlobalErrorHandlers();
    
    // Interceptar métodos nativos de JSON
    this.interceptJSONMethods();
    
    console.log('✅ JSONErrorHandler inicializado correctamente');
  },

  /**
   * Limpiar datos corruptos existentes en localStorage y sessionStorage
   */
  cleanExistingCorruptedData(): void {
    console.log('🧹 Limpiando datos corruptos existentes...');
    
    const keysToCheck: string[] = [
      'barrio',
      'form_cache_reporte',
      'ultimo_barrio_seleccionado',
      'theme',
      'admin_token',
      'admin_logged',
      'nombreCapitan',
      'fechaReporte',
      'estadoReporte'
    ];
    
    let cleanedCount = 0;
    
    // Limpiar localStorage
    keysToCheck.forEach(key => {
      if (JSONUtils.cleanCorruptedData(key, 'local')) {
        cleanedCount++;
        console.log(`🧹 Limpiado localStorage['${key}']`);
      }
    });
    
    // Limpiar sessionStorage
    keysToCheck.forEach(key => {
      if (JSONUtils.cleanCorruptedData(key, 'session')) {
        cleanedCount++;
        console.log(`🧹 Limpiado sessionStorage['${key}']`);
      }
    });
    
    // Limpiar claves de ciclos (patrón cycle_*)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cycle_')) {
        if (JSONUtils.cleanCorruptedData(key, 'local')) {
          cleanedCount++;
          console.log(`🧹 Limpiado localStorage['${key}']`);
        }
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`✅ Limpieza completada: ${cleanedCount} elementos corruptos eliminados`);
    } else {
      console.log('✅ No se encontraron datos corruptos');
    }
  },

  /**
   * Configurar manejadores globales de errores
   */
  setupGlobalErrorHandlers(): void {
    // Interceptar errores de JSON no capturados
    window.addEventListener('error', (event: ErrorEvent) => {
      if (event.error && event.error.message && 
          event.error.message.includes('JSON') && 
          event.error.message.includes('not valid')) {
        console.error('🚨 Error JSON interceptado:', event.error.message);
        console.error('📄 Archivo:', event.filename, 'Línea:', event.lineno);
        
        // Intentar limpiar datos relacionados
        this.handleJSONError(event.error);
        
        // Prevenir que el error se propague
        event.preventDefault();
        return false;
      }
    });
    
    // Interceptar promesas rechazadas relacionadas con JSON
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.message && 
          event.reason.message.includes('JSON')) {
        console.error('🚨 Promise rechazada por JSON:', event.reason.message);
        
        // Intentar limpiar datos relacionados
        this.handleJSONError(event.reason);
        
        // Prevenir que el error se propague
        event.preventDefault();
      }
    });
  },

  /**
   * Interceptar métodos nativos de JSON para agregar validación
   */
  interceptJSONMethods(): void {
    // Deshabilitar interceptor para evitar conflictos con extensiones del navegador
    // El interceptor puede causar problemas con content.js de extensiones
    console.log('🔧 JSONErrorHandler: Interceptor deshabilitado para evitar conflictos con extensiones');
    
    // Mantener referencias originales pero no interceptar
    const originalParse = JSON.parse;
    const originalStringify = JSON.stringify;
    
    // Solo interceptar en caso de errores críticos detectados
    // JSON.parse = function(text, reviver) {
    //   try {
    //     if (typeof text !== 'string') {
    //       console.warn('🚨 JSON.parse: Input no es string, usando JSONUtils.safeParse');
    //       return JSONUtils.safeParse(text);
    //     }
    //     
    //     return originalParse.call(this, text, reviver);
    //   } catch (error) {
    //     console.error('🚨 JSON.parse interceptado - Error:', error.message);
    //     console.error('📄 Contenido problemático:', text);
    //     
    //     // Usar método seguro como fallback
     //     return JSONUtils.safeParse(text);
     //   }
     // };
    
    // Interceptor de JSON.stringify también deshabilitado
    // JSON.stringify = function(value, replacer, space) {
    //   try {
    //     return originalStringify.call(this, value, replacer, space);
    //   } catch (error) {
    //     console.error('🚨 JSON.stringify interceptado - Error:', error.message);
    //     console.error('📄 Datos problemáticos:', value);
    //     
    //     // Usar método seguro como fallback
    //     return JSONUtils.safeStringify(value);
    //   }
    // };
    
    console.log('🔧 Interceptores JSON deshabilitados para evitar conflictos con extensiones');
  },

  /**
   * Manejar errores específicos de JSON
   * @param error - Error de JSON
   */
  handleJSONError(error: Error): void {
    const errorMessage = error.message.toLowerCase();
    
    // Detectar si el error está relacionado con storage
    if (errorMessage.includes('localstorage') || errorMessage.includes('sessionstorage')) {
      console.log('🔧 Error relacionado con storage, iniciando limpieza...');
      this.cleanExistingCorruptedData();
    }
    
    // Detectar si el error está relacionado con datos específicos
    if (errorMessage.includes('barrio')) {
      console.log('🔧 Error relacionado con barrio, limpiando datos de barrio...');
      localStorage.removeItem('barrio');
      localStorage.removeItem('ultimo_barrio_seleccionado');
    }
    
    if (errorMessage.includes('form') || errorMessage.includes('cache')) {
      console.log('🔧 Error relacionado con formulario, limpiando cache...');
      localStorage.removeItem('form_cache_reporte');
    }
  },

  /**
   * Validar y reparar datos específicos
   * @param key - Clave a validar
   * @param storageType - Tipo de storage
   */
  validateAndRepair(key: string, storageType: 'local' | 'session' = 'local'): boolean {
    try {
      const storage = storageType === 'local' ? localStorage : sessionStorage;
      const data = storage.getItem(key);
      
      if (!data) return true; // No hay datos, está bien
      
      // Intentar parsear
      if (!JSONUtils.isValidJSON(data)) {
        console.warn(`🔧 Reparando datos corruptos en ${storageType}Storage['${key}']`);
        storage.removeItem(key);
        return false;
      }
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error(`❌ Error validando ${storageType}Storage['${key}']:`, errorMessage);
      return false;
    }
  },

  /**
   * Obtener estadísticas de salud de datos
   */
  getHealthStats(): HealthStats {
    const stats: HealthStats = {
      localStorage: {
        total: localStorage.length,
        valid: 0,
        corrupted: 0,
        keys: []
      },
      sessionStorage: {
        total: sessionStorage.length,
        valid: 0,
        corrupted: 0,
        keys: []
      }
    };
    
    // Verificar localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const data = localStorage.getItem(key);
      
      stats.localStorage.keys.push(key);
      
      if (data && JSONUtils.isValidJSON(data)) {
        stats.localStorage.valid++;
      } else {
        stats.localStorage.corrupted++;
      }
    }
    
    // Verificar sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      const data = sessionStorage.getItem(key);
      
      stats.sessionStorage.keys.push(key);
      
      if (data && JSONUtils.isValidJSON(data)) {
        stats.sessionStorage.valid++;
      } else {
        stats.sessionStorage.corrupted++;
      }
    }
    
    return stats;
  },

  /**
   * Mostrar reporte de salud en consola
   */
  showHealthReport(): HealthStats {
    const stats = this.getHealthStats();
    
    console.group('📊 Reporte de Salud JSON');
    console.log('localStorage:', stats.localStorage);
    console.log('sessionStorage:', stats.sessionStorage);
    
    const totalCorrupted = stats.localStorage.corrupted + stats.sessionStorage.corrupted;
    if (totalCorrupted > 0) {
      console.warn(`⚠️ Se encontraron ${totalCorrupted} elementos corruptos`);
    } else {
      console.log('✅ Todos los datos JSON están en buen estado');
    }
    
    console.groupEnd();
    
    return stats;
  }
};

// Declaración global para TypeScript
declare global {
  interface Window {
    JSONErrorHandler: typeof JSONErrorHandler;
  }
}

// Auto-inicializar cuando se carga el módulo
if (typeof window !== 'undefined') {
  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      JSONErrorHandler.init();
    });
  } else {
    JSONErrorHandler.init();
  }
  
  // Exponer globalmente para debugging
  window.JSONErrorHandler = JSONErrorHandler;
}

export default JSONErrorHandler;