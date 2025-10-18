// backend/domain/entities/Ciclo.js
// Entidad de dominio para Ciclos - Control de ciclos por barrio

class Ciclo {
  constructor({ barrio, total_territorios, numero_ciclo = 1, fecha_inicio = null }) {
    this.validateRequired({ barrio, total_territorios });
    this.validateTypes({ barrio, total_territorios, numero_ciclo });
    
    this.barrio = barrio.trim();
    this.numero_ciclo = numero_ciclo;
    this.total_territorios = total_territorios;
    this.territorios_completados = 0;
    this.progreso_porcentaje = 0.00;
    this.estado = 'activo';
    this.fecha_inicio = fecha_inicio || new Date().toISOString().split('T')[0];
    this.fecha_fin = null;
  }
  
  /**
   * Validar campos requeridos
   * @param {Object} fields - Campos a validar
   */
  validateRequired(fields) {
    if (!fields.barrio || fields.barrio === '') {
      throw new Error('El barrio es requerido');
    }
    
    if (!fields.total_territorios) {
      throw new Error('El total de territorios es requerido');
    }
  }
  
  /**
   * Validar tipos de datos
   * @param {Object} fields - Campos a validar
   */
  validateTypes(fields) {
    // Validar barrio
    if (typeof fields.barrio !== 'string' || fields.barrio.length < 2) {
      throw new Error('El barrio debe ser un texto de al menos 2 caracteres');
    }
    
    // Validar total_territorios
    if (!Number.isInteger(fields.total_territorios) || fields.total_territorios <= 0) {
      throw new Error('El total de territorios debe ser un número entero positivo');
    }
    
    // Validar numero_ciclo
    if (!Number.isInteger(fields.numero_ciclo) || fields.numero_ciclo <= 0) {
      throw new Error('El número de ciclo debe ser un número entero positivo');
    }
  }
  
  /**
   * Calcular progreso basado en territorios completados
   * @param {number} territorios_completados - Número de territorios completados
   * @returns {number} Porcentaje de progreso
   */
  calcularProgreso(territorios_completados) {
    if (territorios_completados < 0) {
      throw new Error('Los territorios completados no pueden ser negativos');
    }
    
    if (territorios_completados > this.total_territorios) {
      throw new Error('Los territorios completados no pueden exceder el total');
    }
    
    this.territorios_completados = territorios_completados;
    this.progreso_porcentaje = this.total_territorios > 0 
      ? (territorios_completados / this.total_territorios) * 100 
      : 0;
    
    return this.progreso_porcentaje;
  }
  
  /**
   * Verificar si el ciclo está completo
   * @returns {boolean} True si el ciclo está completo
   */
  isCompleto() {
    return this.progreso_porcentaje >= 100;
  }
  
  /**
   * Completar el ciclo
   * @param {string} fecha_fin - Fecha de finalización (opcional)
   */
  completar(fecha_fin = null) {
    if (this.estado === 'completado') {
      throw new Error('El ciclo ya está completado');
    }
    
    this.estado = 'completado';
    this.fecha_fin = fecha_fin || new Date().toISOString().split('T')[0];
    
    // Asegurar que el progreso sea 100%
    if (this.progreso_porcentaje < 100) {
      this.progreso_porcentaje = 100;
      this.territorios_completados = this.total_territorios;
    }
  }
  
  /**
   * Pausar el ciclo
   */
  pausar() {
    if (this.estado === 'completado') {
      throw new Error('No se puede pausar un ciclo completado');
    }
    
    this.estado = 'pausado';
  }
  
  /**
   * Reactivar el ciclo
   */
  reactivar() {
    if (this.estado === 'completado') {
      throw new Error('No se puede reactivar un ciclo completado');
    }
    
    this.estado = 'activo';
  }
  
  /**
   * Verificar si el ciclo está activo
   * @returns {boolean} True si el ciclo está activo
   */
  isActivo() {
    return this.estado === 'activo';
  }
  
  /**
   * Obtener información de progreso
   * @returns {Object} Información de progreso
   */
  getProgresoInfo() {
    return {
      territorios_completados: this.territorios_completados,
      total_territorios: this.total_territorios,
      progreso_porcentaje: Math.round(this.progreso_porcentaje * 100) / 100, // 2 decimales
      estado: this.estado,
      is_completo: this.isCompleto()
    };
  }
  
  /**
   * Obtener datos para persistencia
   * @returns {Object} Datos listos para base de datos
   */
  toDatabase() {
    return {
      barrio: this.barrio,
      numero_ciclo: this.numero_ciclo,
      fecha_inicio: this.fecha_inicio,
      fecha_fin: this.fecha_fin,
      total_territorios: this.total_territorios,
      territorios_completados: this.territorios_completados,
      progreso_porcentaje: this.progreso_porcentaje,
      estado: this.estado
    };
  }
  
  /**
   * Crear desde datos de base de datos
   * @param {Object} dbData - Datos de base de datos
   * @returns {Ciclo} Nueva instancia de Ciclo
   */
  static fromDatabase(dbData) {
    const ciclo = new Ciclo({
      barrio: dbData.barrio,
      total_territorios: dbData.total_territorios,
      numero_ciclo: dbData.numero_ciclo,
      fecha_inicio: dbData.fecha_inicio
    });
    
    // Restaurar estado desde base de datos
    ciclo.territorios_completados = dbData.territorios_completados || 0;
    ciclo.progreso_porcentaje = dbData.progreso_porcentaje || 0;
    ciclo.estado = dbData.estado || 'activo';
    ciclo.fecha_fin = dbData.fecha_fin || null;
    
    return ciclo;
  }
  
  /**
   * Crear nuevo ciclo basado en el anterior
   * @param {Ciclo} cicloAnterior - Ciclo anterior completado
   * @returns {Ciclo} Nuevo ciclo
   */
  static crearSiguiente(cicloAnterior) {
    if (!cicloAnterior.isCompleto()) {
      throw new Error('El ciclo anterior debe estar completado');
    }
    
    return new Ciclo({
      barrio: cicloAnterior.barrio,
      total_territorios: cicloAnterior.total_territorios,
      numero_ciclo: cicloAnterior.numero_ciclo + 1
    });
  }
}

export default Ciclo;