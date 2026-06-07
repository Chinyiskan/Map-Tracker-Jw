/**
 * Utilidades para manejo seguro de JSON - Migrado a TypeScript
 * Previene errores de parsing y stringify
 * 
 * @version 2.0.0 - TypeScript Migration
 * @author Map Tracker JW Team
 */

// Importar tipos
interface JSONParseOptions {
  defaultValue?: any;
  validateStructure?: boolean;
}

interface JSONStringifyOptions {
  fallback?: string;
  detectCircular?: boolean;
}

interface StorageOptions {
  storageType: 'local' | 'session';
  key: string;
  defaultValue?: any;
}

interface JSONUtilsInterface {
  safeParse<T = any>(jsonString: string, defaultValue?: T): T;
  safeStringify(data: any, fallback?: string): string;
  isValidJSON(jsonString: string): boolean;
  getFromStorage<T = any>(key: string, defaultValue?: T): T;
  setToStorage(key: string, data: any): boolean;
  getFromSession<T = any>(key: string, defaultValue?: T): T;
  setToSession(key: string, data: any): boolean;
  cleanCorruptedData(key: string, storageType?: 'local' | 'session'): boolean;
}

export const JSONUtils: JSONUtilsInterface = {
  /**
   * Parse seguro de JSON con validación
   * @param jsonString - String a parsear
   * @param defaultValue - Valor por defecto si falla el parsing
   * @returns Objeto parseado o valor por defecto
   */
  safeParse<T = any>(jsonString: string, defaultValue: T = null as T): T {
    try {
      // Validar que el input sea string
      if (typeof jsonString !== 'string') {
        console.warn('🚨 JSONUtils.safeParse: Input no es string:', typeof jsonString, jsonString);
        return defaultValue;
      }

      // Validar que no esté vacío
      if (!jsonString.trim()) {
        console.warn('🚨 JSONUtils.safeParse: String vacío');
        return defaultValue;
      }

      // Validar que parezca JSON válido
      const trimmed = jsonString.trim();
      if (!((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
            (trimmed.startsWith('[') && trimmed.endsWith(']')))) {
        console.warn('🚨 JSONUtils.safeParse: No parece JSON válido:', trimmed);
        return defaultValue;
      }

      const parsed = JSON.parse(jsonString) as T;
      console.log('✅ JSONUtils.safeParse: Éxito');
      return parsed;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ JSONUtils.safeParse: Error al parsear JSON:', errorMessage);
      console.error('📄 Contenido problemático:', jsonString);
      return defaultValue;
    }
  },

  /**
   * Stringify seguro de JSON con validación
   * @param data - Datos a convertir a JSON
   * @param fallback - String de fallback si falla
   * @returns JSON string o fallback
   */
  safeStringify(data: any, fallback: string = '{}'): string {
    try {
      // Validar que los datos no sean undefined
      if (data === undefined) {
        console.warn('🚨 JSONUtils.safeStringify: Datos undefined');
        return fallback;
      }

      // Validar que no sean funciones
      if (typeof data === 'function') {
        console.warn('🚨 JSONUtils.safeStringify: No se puede stringify función');
        return fallback;
      }

      // Detectar referencias circulares
      const seen = new WeakSet<object>();
      const result = JSON.stringify(data, (key: string, value: any) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            console.warn('🚨 JSONUtils.safeStringify: Referencia circular detectada');
            return '[Circular Reference]';
          }
          seen.add(value);
        }
        return value;
      });

      console.log('✅ JSONUtils.safeStringify: Éxito');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ JSONUtils.safeStringify: Error al convertir a JSON:', errorMessage);
      console.error('📄 Datos problemáticos:', data);
      return fallback;
    }
  },

  /**
   * Validar si un string es JSON válido
   * @param jsonString - String a validar
   * @returns true si es JSON válido
   */
  isValidJSON(jsonString: string): boolean {
    try {
      if (typeof jsonString !== 'string') return false;
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Manejo seguro de localStorage con JSON
   * @param key - Clave del localStorage
   * @param defaultValue - Valor por defecto
   * @returns Valor parseado o por defecto
   */
  getFromStorage<T = any>(key: string, defaultValue: T = null as T): T {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        console.log(`📦 JSONUtils.getFromStorage: No hay datos para '${key}'`);
        return defaultValue;
      }

      return this.safeParse<T>(stored, defaultValue);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ JSONUtils.getFromStorage: Error accediendo a localStorage['${key}']:`, errorMessage);
      return defaultValue;
    }
  },

  /**
   * Guardar en localStorage con JSON seguro
   * @param key - Clave del localStorage
   * @param data - Datos a guardar
   * @returns true si se guardó exitosamente
   */
  setToStorage(key: string, data: any): boolean {
    try {
      const jsonString = this.safeStringify(data);
      localStorage.setItem(key, jsonString);
      console.log(`✅ JSONUtils.setToStorage: Guardado '${key}'`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ JSONUtils.setToStorage: Error guardando en localStorage['${key}']:`, errorMessage);
      return false;
    }
  },

  /**
   * Manejo seguro de sessionStorage con JSON
   * @param key - Clave del sessionStorage
   * @param defaultValue - Valor por defecto
   * @returns Valor parseado o por defecto
   */
  getFromSession<T = any>(key: string, defaultValue: T = null as T): T {
    try {
      const stored = sessionStorage.getItem(key);
      if (!stored) {
        console.log(`📦 JSONUtils.getFromSession: No hay datos para '${key}'`);
        return defaultValue;
      }

      return this.safeParse<T>(stored, defaultValue);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ JSONUtils.getFromSession: Error accediendo a sessionStorage['${key}']:`, errorMessage);
      return defaultValue;
    }
  },

  /**
   * Guardar en sessionStorage con JSON seguro
   * @param key - Clave del sessionStorage
   * @param data - Datos a guardar
   * @returns true si se guardó exitosamente
   */
  setToSession(key: string, data: any): boolean {
    try {
      const jsonString = this.safeStringify(data);
      sessionStorage.setItem(key, jsonString);
      console.log(`✅ JSONUtils.setToSession: Guardado '${key}'`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ JSONUtils.setToSession: Error guardando en sessionStorage['${key}']:`, errorMessage);
      return false;
    }
  },

  /**
   * Limpiar datos corruptos del storage
   * @param key - Clave a limpiar
   * @param storageType - Tipo de storage
   */
  cleanCorruptedData(key: string, storageType: 'local' | 'session' = 'local'): boolean {
    try {
      const storage = storageType === 'local' ? localStorage : sessionStorage;
      const data = storage.getItem(key);
      
      if (data && !this.isValidJSON(data)) {
        console.warn(`🧹 JSONUtils.cleanCorruptedData: Limpiando datos corruptos de '${key}'`);
        storage.removeItem(key);
        return true;
      }
      
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ JSONUtils.cleanCorruptedData: Error limpiando '${key}':`, errorMessage);
      return false;
    }
  }
};

// Mantener compatibilidad con código existente
export default JSONUtils;

// Tipos exportados para uso en otros módulos
export type { JSONParseOptions, JSONStringifyOptions, StorageOptions, JSONUtilsInterface };