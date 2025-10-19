/**
 * Utilidades para manejo seguro de JSON
 * Previene errores de parsing y stringify
 */
export const JSONUtils = {
    /**
     * Parse seguro de JSON con validación
     * @param {string} jsonString - String a parsear
     * @param {*} defaultValue - Valor por defecto si falla el parsing
     * @returns {*} Objeto parseado o valor por defecto
     */
    safeParse(jsonString, defaultValue = null) {
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
            const parsed = JSON.parse(jsonString);
            console.log('✅ JSONUtils.safeParse: Éxito');
            return parsed;
        }
        catch (error) {
            console.error('❌ JSONUtils.safeParse: Error al parsear JSON:', error.message);
            console.error('📄 Contenido problemático:', jsonString);
            return defaultValue;
        }
    },
    /**
     * Stringify seguro de JSON con validación
     * @param {*} data - Datos a convertir a JSON
     * @param {string} fallback - String de fallback si falla
     * @returns {string} JSON string o fallback
     */
    safeStringify(data, fallback = '{}') {
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
            const seen = new WeakSet();
            const result = JSON.stringify(data, (key, value) => {
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
        }
        catch (error) {
            console.error('❌ JSONUtils.safeStringify: Error al convertir a JSON:', error.message);
            console.error('📄 Datos problemáticos:', data);
            return fallback;
        }
    },
    /**
     * Validar si un string es JSON válido
     * @param {string} jsonString - String a validar
     * @returns {boolean} true si es JSON válido
     */
    isValidJSON(jsonString) {
        try {
            if (typeof jsonString !== 'string')
                return false;
            JSON.parse(jsonString);
            return true;
        }
        catch {
            return false;
        }
    },
    /**
     * Manejo seguro de localStorage con JSON
     * @param {string} key - Clave del localStorage
     * @param {*} defaultValue - Valor por defecto
     * @returns {*} Valor parseado o por defecto
     */
    getFromStorage(key, defaultValue = null) {
        try {
            const stored = localStorage.getItem(key);
            if (!stored) {
                console.log(`📦 JSONUtils.getFromStorage: No hay datos para '${key}'`);
                return defaultValue;
            }
            return this.safeParse(stored, defaultValue);
        }
        catch (error) {
            console.error(`❌ JSONUtils.getFromStorage: Error accediendo a localStorage['${key}']:`, error.message);
            return defaultValue;
        }
    },
    /**
     * Guardar en localStorage con JSON seguro
     * @param {string} key - Clave del localStorage
     * @param {*} data - Datos a guardar
     * @returns {boolean} true si se guardó exitosamente
     */
    setToStorage(key, data) {
        try {
            const jsonString = this.safeStringify(data);
            localStorage.setItem(key, jsonString);
            console.log(`✅ JSONUtils.setToStorage: Guardado '${key}'`);
            return true;
        }
        catch (error) {
            console.error(`❌ JSONUtils.setToStorage: Error guardando en localStorage['${key}']:`, error.message);
            return false;
        }
    },
    /**
     * Manejo seguro de sessionStorage con JSON
     * @param {string} key - Clave del sessionStorage
     * @param {*} defaultValue - Valor por defecto
     * @returns {*} Valor parseado o por defecto
     */
    getFromSession(key, defaultValue = null) {
        try {
            const stored = sessionStorage.getItem(key);
            if (!stored) {
                console.log(`📦 JSONUtils.getFromSession: No hay datos para '${key}'`);
                return defaultValue;
            }
            return this.safeParse(stored, defaultValue);
        }
        catch (error) {
            console.error(`❌ JSONUtils.getFromSession: Error accediendo a sessionStorage['${key}']:`, error.message);
            return defaultValue;
        }
    },
    /**
     * Guardar en sessionStorage con JSON seguro
     * @param {string} key - Clave del sessionStorage
     * @param {*} data - Datos a guardar
     * @returns {boolean} true si se guardó exitosamente
     */
    setToSession(key, data) {
        try {
            const jsonString = this.safeStringify(data);
            sessionStorage.setItem(key, jsonString);
            console.log(`✅ JSONUtils.setToSession: Guardado '${key}'`);
            return true;
        }
        catch (error) {
            console.error(`❌ JSONUtils.setToSession: Error guardando en sessionStorage['${key}']:`, error.message);
            return false;
        }
    },
    /**
     * Limpiar datos corruptos del storage
     * @param {string} key - Clave a limpiar
     * @param {'local'|'session'} storageType - Tipo de storage
     */
    cleanCorruptedData(key, storageType = 'local') {
        try {
            const storage = storageType === 'local' ? localStorage : sessionStorage;
            const data = storage.getItem(key);
            if (data && !this.isValidJSON(data)) {
                console.warn(`🧹 JSONUtils.cleanCorruptedData: Limpiando datos corruptos de '${key}'`);
                storage.removeItem(key);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error(`❌ JSONUtils.cleanCorruptedData: Error limpiando '${key}':`, error.message);
            return false;
        }
    }
};
// Función global para migrar código existente gradualmente
window.safeJSONParse = JSONUtils.safeParse;
window.safeJSONStringify = JSONUtils.safeStringify;
export default JSONUtils;
//# sourceMappingURL=json-utils.js.map