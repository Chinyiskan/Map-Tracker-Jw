// backend/domain/entities/Salida.js
// Entidad de dominio para Salidas de Predicación

/**
 * Entidad Salida - Representa una salida de predicación programada
 * Implementa las reglas de negocio y validaciones del dominio
 */
export class Salida {
  /**
   * Constructor de la entidad Salida
   * @param {Object} data - Datos de la salida
   * @param {string} data.id - ID único de la salida
   * @param {string} data.capitan_id - ID del capitán asignado
   * @param {string} data.barrio_asignado - Barrio asignado para la predicación
   * @param {string} data.dia_semana - Día de la semana (lunes-domingo)
   * @param {string} data.hora - Hora de la salida (formato HH:MM)
   * @param {string} data.estado - Estado de la salida (activo, pausado, completado)
   * @param {string} data.observaciones - Observaciones adicionales
   * @param {Date} data.fecha_creacion - Fecha de creación del registro
   * @param {Date} data.fecha_actualizacion - Fecha de última actualización
   */
  constructor({
    id = null,
    capitan_id,
    barrio_asignado,
    dia_semana,
    hora,
    estado = 'activo',
    observaciones = '',
    fecha_creacion = new Date(),
    fecha_actualizacion = new Date(),
    created_at = null,
    updated_at = null
  }) {
    this.id = id;
    this.capitan_id = capitan_id;
    this.barrio_asignado = barrio_asignado;
    this.dia_semana = dia_semana;
    this.hora = hora;
    this.estado = estado;
    this.observaciones = observaciones;
    
    // Mapear campos de base de datos
     this.fecha_creacion = created_at ? new Date(created_at) : fecha_creacion;
     this.fecha_actualizacion = updated_at ? new Date(updated_at) : fecha_actualizacion;
     
     // Validar al crear la instancia
     this.validate();
  }

  /**
   * Valida la entidad Salida según las reglas de negocio
   * @throws {Error} Si la validación falla
   * @returns {boolean} true si la validación es exitosa
   */
  validate() {
    console.log('🔍 Validando entidad Salida...');
    
    // Validar campos requeridos
    this._validateRequiredFields();
    
    // Validar día de la semana
    this._validateDiaSemana();
    
    // Validar formato de hora
    this._validateHora();
    
    // Validar barrio asignado
    this._validateBarrioAsignado();
    
    // Validar estado
    this._validateEstado();
    
    console.log('✅ Validación de entidad Salida exitosa');
    return true;
  }

  /**
   * Valida que los campos requeridos estén presentes
   * @private
   * @throws {Error} Si faltan campos requeridos
   */
  _validateRequiredFields() {
    const requiredFields = ['capitan_id', 'barrio_asignado', 'dia_semana', 'hora'];
    const missingFields = requiredFields.filter(field => {
      const value = this[field];
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    if (missingFields.length > 0) {
      throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Valida el día de la semana
   * @private
   * @throws {Error} Si el día de la semana es inválido
   */
  _validateDiaSemana() {
    const diasValidos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    
    if (!this.dia_semana || typeof this.dia_semana !== 'string') {
      throw new Error('El día de la semana es requerido y debe ser una cadena de texto');
    }

    const diaLowerCase = this.dia_semana.toLowerCase().trim();
    
    if (!diasValidos.includes(diaLowerCase)) {
      throw new Error(`Día de la semana inválido: ${this.dia_semana}. Días válidos: ${diasValidos.join(', ')}`);
    }

    // Normalizar el día de la semana
    this.dia_semana = diaLowerCase;
  }

  /**
   * Valida el formato de hora
   * @private
   * @throws {Error} Si el formato de hora es inválido
   */
  _validateHora() {
    if (!this.hora || typeof this.hora !== 'string') {
      throw new Error('La hora es requerida y debe ser una cadena de texto');
    }

    // Validar formato HH:MM o HH:MM:SS (24 horas)
    const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    
    if (!horaRegex.test(this.hora.trim())) {
      throw new Error(`Formato de hora inválido: ${this.hora}. Use formato HH:MM o HH:MM:SS (24 horas)`);
    }

    // Normalizar la hora (asegurar formato HH:MM)
    const partes = this.hora.split(':');
    const [horas, minutos] = partes;
    this.hora = `${horas.padStart(2, '0')}:${minutos.padStart(2, '0')}`;
  }

  /**
   * Valida el barrio asignado
   * @private
   * @throws {Error} Si el barrio asignado es inválido
   */
  _validateBarrioAsignado() {
    const barriosValidos = [
      'Alcalá', 'Acacios', 'Ciudad Jardín', 'Guaimaral',
      'La Mar y Gratamira', 'Niza', 'Prados Norte', 'Próceres',
      'San Eduardo', 'Santa Elena', 'Tasajero', 'Zulima'
    ];

    if (!this.barrio_asignado || typeof this.barrio_asignado !== 'string') {
      throw new Error('El barrio asignado es requerido y debe ser una cadena de texto');
    }

    const barrioTrimmed = this.barrio_asignado.trim();
    
    if (!barriosValidos.includes(barrioTrimmed)) {
      throw new Error(`Barrio asignado inválido: ${this.barrio_asignado}. Barrios válidos: ${barriosValidos.join(', ')}`);
    }

    // Normalizar el barrio
    this.barrio_asignado = barrioTrimmed;
  }

  /**
   * Valida el estado de la salida
   * @private
   * @throws {Error} Si el estado es inválido
   */
  _validateEstado() {
    const estadosValidos = ['activo', 'pausado', 'completado', 'cancelado'];
    
    if (!this.estado || typeof this.estado !== 'string') {
      throw new Error('El estado es requerido y debe ser una cadena de texto');
    }

    const estadoLowerCase = this.estado.toLowerCase().trim();
    
    if (!estadosValidos.includes(estadoLowerCase)) {
      throw new Error(`Estado inválido: ${this.estado}. Estados válidos: ${estadosValidos.join(', ')}`);
    }

    // Normalizar el estado
    this.estado = estadoLowerCase;
  }

  /**
   * Actualiza la fecha de modificación
   */
  touch() {
    this.fecha_actualizacion = new Date();
  }

  /**
   * Verifica si la salida está activa
   * @returns {boolean} true si la salida está activa
   */
  isActive() {
    return this.estado === 'activo';
  }

  /**
   * Verifica si la salida está completada
   * @returns {boolean} true si la salida está completada
   */
  isCompleted() {
    return this.estado === 'completado';
  }

  /**
   * Verifica si la salida está pausada
   * @returns {boolean} true si la salida está pausada
   */
  isPaused() {
    return this.estado === 'pausado';
  }

  /**
   * Cambia el estado de la salida
   * @param {string} nuevoEstado - Nuevo estado
   * @throws {Error} Si el estado es inválido
   */
  changeStatus(nuevoEstado) {
    const estadoAnterior = this.estado;
    this.estado = nuevoEstado;
    
    try {
      this._validateEstado();
      this.touch();
      console.log(`📝 Estado de salida cambiado: ${estadoAnterior} → ${this.estado}`);
    } catch (error) {
      // Revertir el cambio si la validación falla
      this.estado = estadoAnterior;
      throw error;
    }
  }

  /**
   * Obtiene un resumen de la salida
   * @returns {string} Resumen legible de la salida
   */
  getSummary() {
    return `Salida ${this.dia_semana} ${this.hora} - ${this.barrio_asignado} (${this.estado})`;
  }

  /**
   * Convierte la entidad a objeto plano para persistencia
   * @returns {Object} Objeto plano con los datos de la salida
   */
  toPlainObject() {
    const obj = {
      id: this.id,
      capitan_id: this.capitan_id,
      barrio_asignado: this.barrio_asignado,
      dia_semana: this.dia_semana,
      hora: this.hora,
      estado: this.estado,
      observaciones: this.observaciones,
      fecha_creacion: this.fecha_creacion,
      fecha_actualizacion: this.fecha_actualizacion
    };
    
    // Preservar información de capitanes si existe
    if (this.capitanes) {
      obj.capitanes = this.capitanes;
    }
    
    return obj;
  }

  /**
   * Crea una instancia de Salida desde un objeto plano
   * @param {Object} data - Datos de la salida
   * @returns {Salida} Nueva instancia de Salida
   */
  static fromPlainObject(data) {
    const salida = new Salida({
      id: data.id,
      capitan_id: data.capitan_id,
      barrio_asignado: data.barrio_asignado,
      dia_semana: data.dia_semana,
      hora: data.hora,
      estado: data.estado || 'activo',
      observaciones: data.observaciones || '',
      created_at: data.created_at,
      updated_at: data.updated_at,
      fecha_creacion: data.fecha_creacion,
      fecha_actualizacion: data.fecha_actualizacion
    });
    
    // Preservar información de capitanes si existe
    if (data.capitanes) {
      salida.capitanes = data.capitanes;
    }
    
    return salida;
  }

  /**
   * Obtiene la lista de barrios válidos
   * @returns {Array<string>} Lista de barrios válidos
   */
  static getValidBarrios() {
    return [
      'Alcalá', 'Acacios', 'Ciudad Jardín', 'Guaimaral',
      'La Mar y Gratamira', 'Niza', 'Prados Norte', 'Próceres',
      'San Eduardo', 'Santa Elena', 'Tasajero', 'Zulima'
    ];
  }

  /**
   * Obtiene la lista de días válidos
   * @returns {Array<string>} Lista de días válidos
   */
  static getValidDias() {
    return ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  }

  /**
   * Obtiene la lista de estados válidos
   * @returns {Array<string>} Lista de estados válidos
   */
  static getValidEstados() {
    return ['activo', 'pausado', 'completado', 'cancelado'];
  }
}

export default Salida;