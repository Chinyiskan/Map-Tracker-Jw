// backend/domain/entities/Capitan.js
// Entidad de dominio para Capitanes - Gestión de capitanes de predicación

/**
 * Entidad Capitan - Representa un capitán de predicación
 * Implementa las reglas de negocio y validaciones del dominio
 */
export class Capitan {
  /**
   * Constructor de la entidad Capitan
   * @param {Object} data - Datos del capitán
   * @param {string} data.id - ID único del capitán
   * @param {string} data.nombre - Nombre del capitán
   * @param {string} data.apellido - Apellido del capitán
   * @param {string} data.telefono - Teléfono del capitán (opcional)
   * @param {string} data.email - Email del capitán (opcional)
   * @param {Date} data.created_at - Fecha de creación del registro
   * @param {Date} data.updated_at - Fecha de última actualización
   */
  constructor({
    id = null,
    nombre,
    apellido,
    telefono = null,
    email = null,
    created_at = new Date(),
    updated_at = new Date()
  }) {
    // Validar campos requeridos
    this._validateRequired({ nombre, apellido });
    
    // Validar tipos de datos
    this._validateTypes({ nombre, apellido, telefono, email });
    
    // Asignar propiedades
    this.id = id;
    this.nombre = nombre.trim();
    this.apellido = apellido.trim();
    this.telefono = telefono ? telefono.trim() : null;
    this.email = email ? email.trim().toLowerCase() : null;
    this.created_at = created_at;
    this.updated_at = updated_at;
    
    // Validar reglas de negocio
    this._validateBusinessRules();
  }
  
  /**
   * Validar campos requeridos
   * @param {Object} fields - Campos a validar
   * @private
   */
  _validateRequired(fields) {
    const requiredFields = ['nombre', 'apellido'];
    
    requiredFields.forEach(field => {
      if (!fields[field] || fields[field].trim() === '') {
        throw new Error(`El campo '${field}' es requerido`);
      }
    });
  }
  
  /**
   * Validar tipos de datos
   * @param {Object} fields - Campos a validar
   * @private
   */
  _validateTypes(fields) {
    const { nombre, apellido, telefono, email } = fields;
    
    if (typeof nombre !== 'string') {
      throw new Error('El nombre debe ser una cadena de texto');
    }
    
    if (typeof apellido !== 'string') {
      throw new Error('El apellido debe ser una cadena de texto');
    }
    
    if (telefono !== null && typeof telefono !== 'string') {
      throw new Error('El teléfono debe ser una cadena de texto');
    }
    
    if (email !== null && typeof email !== 'string') {
      throw new Error('El email debe ser una cadena de texto');
    }
  }
  
  /**
   * Validar reglas de negocio
   * @private
   */
  _validateBusinessRules() {
    // Validar longitud del nombre
    if (this.nombre.length < 2 || this.nombre.length > 50) {
      throw new Error('El nombre debe tener entre 2 y 50 caracteres');
    }
    
    // Validar longitud del apellido
    if (this.apellido.length < 2 || this.apellido.length > 50) {
      throw new Error('El apellido debe tener entre 2 y 50 caracteres');
    }
    
    // Validar formato del teléfono si está presente
    if (this.telefono) {
      const telefonoRegex = /^[+]?[0-9\s\-()]{7,20}$/;
      if (!telefonoRegex.test(this.telefono)) {
        throw new Error('El formato del teléfono no es válido');
      }
    }
    
    // Validar formato del email si está presente
    if (this.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email)) {
        throw new Error('El formato del email no es válido');
      }
    }
    
    // Validar que nombre y apellido no contengan números
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!nameRegex.test(this.nombre)) {
      throw new Error('El nombre solo puede contener letras y espacios');
    }
    
    if (!nameRegex.test(this.apellido)) {
      throw new Error('El apellido solo puede contener letras y espacios');
    }
  }
  
  /**
   * Validar la entidad completa
   * @throws {Error} Si la validación falla
   */
  validate() {
    this._validateRequired({ 
      nombre: this.nombre, 
      apellido: this.apellido 
    });
    this._validateTypes({ 
      nombre: this.nombre, 
      apellido: this.apellido, 
      telefono: this.telefono, 
      email: this.email 
    });
    this._validateBusinessRules();
  }
  
  /**
   * Obtener nombre completo del capitán
   * @returns {string} Nombre completo
   */
  getNombreCompleto() {
    return `${this.nombre} ${this.apellido}`;
  }
  
  /**
   * Obtener iniciales del capitán
   * @returns {string} Iniciales
   */
  getIniciales() {
    return `${this.nombre.charAt(0)}${this.apellido.charAt(0)}`.toUpperCase();
  }
  
  /**
   * Verificar si tiene información de contacto completa
   * @returns {boolean} True si tiene teléfono y email
   */
  tieneContactoCompleto() {
    return !!(this.telefono && this.email);
  }
  
  /**
   * Actualizar información del capitán
   * @param {Object} updateData - Datos a actualizar
   * @returns {Capitan} Nueva instancia actualizada
   */
  update(updateData) {
    const updatedData = {
      id: this.id,
      nombre: updateData.nombre || this.nombre,
      apellido: updateData.apellido || this.apellido,
      telefono: updateData.telefono !== undefined ? updateData.telefono : this.telefono,
      email: updateData.email !== undefined ? updateData.email : this.email,
      created_at: this.created_at,
      updated_at: new Date()
    };
    
    return new Capitan(updatedData);
  }
  
  /**
   * Obtener resumen del capitán para logging
   * @returns {string} Resumen del capitán
   */
  getSummary() {
    return `Capitán: ${this.getNombreCompleto()} (ID: ${this.id || 'nuevo'})`;
  }
  
  /**
   * Convertir a objeto plano para persistencia
   * @returns {Object} Objeto plano
   */
  toPlainObject() {
    return {
      id: this.id,
      nombre: this.nombre,
      apellido: this.apellido,
      telefono: this.telefono,
      email: this.email,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
  
  /**
   * Convertir a objeto para respuesta de API
   * @returns {Object} Objeto para API
   */
  toApiResponse() {
    return {
      id: this.id,
      nombre: this.nombre,
      apellido: this.apellido,
      nombre_completo: this.getNombreCompleto(),
      telefono: this.telefono,
      email: this.email,
      iniciales: this.getIniciales(),
      contacto_completo: this.tieneContactoCompleto(),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
  
  /**
   * Crear instancia desde datos de base de datos
   * @param {Object} dbData - Datos de base de datos
   * @returns {Capitan} Nueva instancia de Capitan
   */
  static fromPlainObject(dbData) {
    if (!dbData) {
      throw new Error('Los datos del capitán son requeridos');
    }
    
    return new Capitan({
      id: dbData.id,
      nombre: dbData.nombre,
      apellido: dbData.apellido,
      telefono: dbData.telefono,
      email: dbData.email,
      created_at: dbData.created_at ? new Date(dbData.created_at) : new Date(),
      updated_at: dbData.updated_at ? new Date(dbData.updated_at) : new Date()
    });
  }
  
  /**
   * Crear instancia desde datos de formulario
   * @param {Object} formData - Datos de formulario
   * @returns {Capitan} Nueva instancia de Capitan
   */
  static fromFormData(formData) {
    return new Capitan({
      nombre: formData.nombre,
      apellido: formData.apellido,
      telefono: formData.telefono || null,
      email: formData.email || null
    });
  }
  
  /**
   * Validar datos antes de crear instancia
   * @param {Object} data - Datos a validar
   * @returns {Object} Resultado de validación
   */
  static validateData(data) {
    const errors = [];
    const warnings = [];
    
    try {
      // Intentar crear instancia temporal para validar
      new Capitan(data);
    } catch (error) {
      errors.push(error.message);
    }
    
    // Validaciones adicionales
    if (data.nombre && data.apellido) {
      const nombreCompleto = `${data.nombre.trim()} ${data.apellido.trim()}`;
      if (nombreCompleto.length > 100) {
        warnings.push('El nombre completo es muy largo');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      hasWarnings: warnings.length > 0
    };
  }
}

export default Capitan;