// backend/domain/entities/Reporte.js
// Entidad de dominio para Reportes - Data pura sin lógica de estados

class Reporte {
  constructor({ nombre_capitan, fecha, barrio, manzanas, estado = null, observaciones = null, salida_id = null }) {
    this.validateRequired({ nombre_capitan, fecha, barrio, manzanas });
    this.validateTypes({ nombre_capitan, fecha, barrio, manzanas, estado });
    
    this.nombre_capitan = nombre_capitan.trim();
    this.fecha = fecha;
    this.barrio = barrio.trim();
    this.manzanas = this.normalizeManzanas(manzanas);
    this.estado = estado ? estado.trim() : null;
    this.observaciones = observaciones ? observaciones.trim() : null;
    this.salida_id = salida_id;
  }
  
  /**
   * Validar campos requeridos
   * @param {Object} fields - Campos a validar
   */
  validateRequired(fields) {
    const requiredFields = ['nombre_capitan', 'fecha', 'barrio', 'manzanas'];
    
    requiredFields.forEach(field => {
      if (!fields[field] || fields[field] === '') {
        throw new Error(`El campo '${field}' es requerido`);
      }
    });
  }
  
  /**
   * Validar tipos de datos
   * @param {Object} fields - Campos a validar
   */
  validateTypes(fields) {
    // Validar nombre_capitan
    if (typeof fields.nombre_capitan !== 'string' || fields.nombre_capitan.length < 2) {
      throw new Error('El nombre del capitán debe ser un texto de al menos 2 caracteres');
    }
    
    // Validar fecha
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fields.fecha)) {
      throw new Error('La fecha debe tener el formato YYYY-MM-DD');
    }
    
    // Validar barrio
    if (typeof fields.barrio !== 'string' || fields.barrio.length < 2) {
      throw new Error('El barrio debe ser un texto de al menos 2 caracteres');
    }
    
    // Validar estado (opcional)
    if (fields.estado !== null && fields.estado !== undefined) {
      if (typeof fields.estado !== 'string') {
        throw new Error('El estado debe ser un texto');
      }
      
      const estadosValidos = ['iniciado', 'en_progreso', 'finalizado'];
      if (!estadosValidos.includes(fields.estado.toLowerCase())) {
        throw new Error(`Estado inválido: ${fields.estado}. Estados válidos: ${estadosValidos.join(', ')}`);
      }
    }
  }
  
  /**
   * Normalizar manzanas a array
   * @param {string|Array} manzanas - Manzanas como string o array
   * @returns {Array} Array de manzanas normalizadas
   */
  normalizeManzanas(manzanas) {
    if (Array.isArray(manzanas)) {
      return manzanas.map(m => m.toString().trim()).filter(m => m.length > 0);
    }
    
    if (typeof manzanas === 'string') {
      return manzanas.split(',').map(m => m.trim()).filter(m => m.length > 0);
    }
    
    throw new Error('Las manzanas deben ser un string separado por comas o un array');
  }
  
  /**
   * Obtener manzanas como string para base de datos
   * @returns {string} Manzanas separadas por comas
   */
  getManzanasAsString() {
    return this.manzanas.join(',');
  }
  
  /**
   * Validar que la fecha no sea futura
   * @returns {boolean} True si la fecha es válida
   */
  isValidDate() {
    const reporteDate = new Date(this.fecha);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Permitir hasta el final del día actual
    
    return reporteDate <= today;
  }
  
  /**
   * Obtener datos para persistencia
   * @returns {Object} Datos listos para base de datos
   */
  toDatabase() {
    return {
      nombre_capitan: this.nombre_capitan,
      fecha: this.fecha,
      barrio: this.barrio,
      manzanas: this.getManzanasAsString(),
      estado: this.estado,
      observaciones: this.observaciones,
      salida_id: this.salida_id
    };
  }
  
  /**
   * Crear desde datos de base de datos
   * @param {Object} dbData - Datos de base de datos
   * @returns {Reporte} Nueva instancia de Reporte
   */
  static fromDatabase(dbData) {
    return new Reporte({
      nombre_capitan: dbData.nombre_capitan,
      fecha: dbData.fecha,
      barrio: dbData.barrio,
      manzanas: dbData.manzanas, // Se normalizará automáticamente
      estado: dbData.estado,
      observaciones: dbData.observaciones,
      salida_id: dbData.salida_id
    });
  }
}

export default Reporte;