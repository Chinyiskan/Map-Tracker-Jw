// backend/domain/entities/ProgresoTerritorio.js
// Entidad de dominio para Progreso de Territorios - Tracking detallado

class ProgresoTerritorio {
  constructor({ ciclo_id, territorio, fecha_trabajado = null, reporte_id }) {
    this.validateRequired({ ciclo_id, territorio, reporte_id });
    this.validateTypes({ ciclo_id, territorio, reporte_id });
    
    this.ciclo_id = ciclo_id;
    this.territorio = territorio.trim().toUpperCase(); // Normalizar a mayúsculas
    this.fecha_trabajado = fecha_trabajado || new Date().toISOString().split('T')[0];
    this.reporte_id = reporte_id;
  }
  
  /**
   * Validar campos requeridos
   * @param {Object} fields - Campos a validar
   */
  validateRequired(fields) {
    const requiredFields = ['ciclo_id', 'territorio', 'reporte_id'];
    
    requiredFields.forEach(field => {
      if (!fields[field]) {
        throw new Error(`El campo '${field}' es requerido`);
      }
    });
  }
  
  /**
   * Validar tipos de datos
   * @param {Object} fields - Campos a validar
   */
  validateTypes(fields) {
    // Validar ciclo_id (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(fields.ciclo_id)) {
      throw new Error('El ciclo_id debe ser un UUID válido');
    }
    
    // Validar reporte_id (UUID)
    if (!uuidRegex.test(fields.reporte_id)) {
      throw new Error('El reporte_id debe ser un UUID válido');
    }
    
    // Validar territorio
    if (typeof fields.territorio !== 'string' || fields.territorio.length < 2) {
      throw new Error('El territorio debe ser un texto de al menos 2 caracteres');
    }
    
    // Validar formato de territorio (ej: Z-174, A-133)
    const territorioRegex = /^[A-Z]{1,3}-\d{1,4}$/i;
    if (!territorioRegex.test(fields.territorio.trim())) {
      throw new Error('El territorio debe tener el formato correcto (ej: Z-174, MG-172)');
    }
  }
  
  /**
   * Validar que la fecha no sea futura
   * @returns {boolean} True si la fecha es válida
   */
  isValidDate() {
    const trabajadoDate = new Date(this.fecha_trabajado);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Permitir hasta el final del día actual
    
    return trabajadoDate <= today;
  }
  
  /**
   * Obtener el prefijo del territorio (letra del barrio)
   * @returns {string} Prefijo del territorio
   */
  getPrefijoTerritorio() {
    return this.territorio.split('-')[0];
  }
  
  /**
   * Obtener el número del territorio
   * @returns {number} Número del territorio
   */
  getNumeroTerritorio() {
    return parseInt(this.territorio.split('-')[1]);
  }
  
  /**
   * Verificar si pertenece a un barrio específico
   * @param {string} prefijo - Prefijo del barrio (ej: 'Z', 'MG')
   * @returns {boolean} True si pertenece al barrio
   */
  perteneceABarrio(prefijo) {
    return this.getPrefijoTerritorio() === prefijo.toUpperCase();
  }
  
  /**
   * Obtener datos para persistencia
   * @returns {Object} Datos listos para base de datos
   */
  toDatabase() {
    return {
      ciclo_id: this.ciclo_id,
      territorio: this.territorio,
      fecha_trabajado: this.fecha_trabajado,
      reporte_id: this.reporte_id
    };
  }
  
  /**
   * Crear desde datos de base de datos
   * @param {Object} dbData - Datos de base de datos
   * @returns {ProgresoTerritorio} Nueva instancia de ProgresoTerritorio
   */
  static fromDatabase(dbData) {
    return new ProgresoTerritorio({
      ciclo_id: dbData.ciclo_id,
      territorio: dbData.territorio,
      fecha_trabajado: dbData.fecha_trabajado,
      reporte_id: dbData.reporte_id
    });
  }
  
  /**
   * Crear múltiples instancias desde un array de territorios
   * @param {Object} params - Parámetros
   * @param {string} params.ciclo_id - ID del ciclo
   * @param {Array} params.territorios - Array de territorios
   * @param {string} params.reporte_id - ID del reporte
   * @param {string} params.fecha_trabajado - Fecha trabajada (opcional)
   * @returns {Array} Array de instancias ProgresoTerritorio
   */
  static crearMultiples({ ciclo_id, territorios, reporte_id, fecha_trabajado = null }) {
    if (!Array.isArray(territorios) || territorios.length === 0) {
      throw new Error('Los territorios deben ser un array no vacío');
    }
    
    return territorios.map(territorio => {
      return new ProgresoTerritorio({
        ciclo_id,
        territorio,
        fecha_trabajado,
        reporte_id
      });
    });
  }
  
  /**
   * Validar que no exista duplicado en un ciclo
   * @param {Array} progresosExistentes - Array de progresos existentes
   * @returns {boolean} True si no hay duplicados
   */
  isUnicoEnCiclo(progresosExistentes) {
    return !progresosExistentes.some(progreso => 
      progreso.ciclo_id === this.ciclo_id && 
      progreso.territorio === this.territorio
    );
  }
  
  /**
   * Obtener información resumida
   * @returns {Object} Información resumida
   */
  getResumen() {
    return {
      territorio: this.territorio,
      prefijo: this.getPrefijoTerritorio(),
      numero: this.getNumeroTerritorio(),
      fecha_trabajado: this.fecha_trabajado,
      ciclo_id: this.ciclo_id
    };
  }
}

export default ProgresoTerritorio;