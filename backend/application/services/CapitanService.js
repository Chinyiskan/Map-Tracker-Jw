// backend/application/services/CapitanService.js
// Servicio de aplicación para lógica de negocio de Capitanes

import { Capitan } from '../../domain/entities/Capitan.js';

/**
 * Servicio de Capitanes - Contiene la lógica de negocio
 * Orquesta las operaciones entre repositorios y aplica reglas de negocio
 */
/**
 * @implements {import('../../domain/types').ICapitanService}
 */
export class CapitanService {
  /**
   * Constructor del servicio
   * @param {CapitanRepository} capitanRepository - Repositorio de capitanes
   */
  constructor(capitanRepository) {
    this.capitanRepository = capitanRepository;
  }

  /**
   * Obtener todos los capitanes con filtros
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Object>} Resultado con capitanes y metadatos
   */
  async getAllCapitanes(filters = {}) {
    try {
      console.log('🔍 CapitanService: Obteniendo todos los capitanes con filtros:', filters);
      
      // Limpiar filtros
      const cleanFilters = this._cleanFilters(filters);
      
      // Obtener capitanes del repositorio
      const capitanes = await this.capitanRepository.findAll(cleanFilters);
      
      // Calcular metadatos
      const metadata = {
        total: capitanes.length,
        filters: cleanFilters,
        distribution: this._calculateDistribution(capitanes)
      };
      
      console.log(`✅ CapitanService: ${capitanes.length} capitanes obtenidos`);
      
      return {
        success: true,
        data: capitanes.map(capitan => capitan.toApiResponse()),
        metadata
      };
      
    } catch (error) {
      console.error('❌ Error en CapitanService.getAllCapitanes:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Obtener un capitán por ID
   * @param {string} id - ID del capitán
   * @returns {Promise<Object>} Resultado con el capitán
   */
  async getCapitanById(id) {
    try {
      console.log('🔍 CapitanService: Obteniendo capitán por ID:', id);
      
      if (!id) {
        throw new Error('El ID del capitán es requerido');
      }
      
      const capitan = await this.capitanRepository.findById(id);
      
      if (!capitan) {
        return {
          success: false,
          error: 'Capitán no encontrado',
          data: null
        };
      }
      
      console.log('✅ CapitanService: Capitán encontrado:', capitan.getSummary());
      
      return {
        success: true,
        data: capitan.toApiResponse()
      };
      
    } catch (error) {
      console.error('❌ Error en CapitanService.getCapitanById:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Crear un nuevo capitán
   * @param {Object} capitanData - Datos del capitán
   * @returns {Promise<Object>} Resultado con el capitán creado
   */
  async createCapitan(capitanData) {
    try {
      console.log('📝 CapitanService: Creando nuevo capitán:', capitanData);
      
      // Validar datos de entrada
      const validation = this._validateCapitanData(capitanData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos de capitán inválidos',
          details: validation.errors,
          data: null
        };
      }
      
      // Crear entidad Capitán
      const capitan = Capitan.fromFormData(capitanData);
      
      // Validar reglas de negocio
      await this._validateBusinessRules(capitan);
      
      // Crear en repositorio
      const capitanCreado = await this.capitanRepository.create(capitan);
      
      console.log('✅ CapitanService: Capitán creado exitosamente:', capitanCreado.getSummary());
      
      return {
        success: true,
        data: capitanCreado.toApiResponse(),
        message: 'Capitán creado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error en CapitanService.createCapitan:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Actualizar un capitán existente
   * @param {string} id - ID del capitán
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} Resultado con el capitán actualizado
   */
  async updateCapitan(id, updateData) {
    try {
      console.log('📝 CapitanService: Actualizando capitán:', id, updateData);
      
      if (!id) {
        throw new Error('El ID del capitán es requerido');
      }
      
      // Validar datos de actualización
      const validation = this._validateUpdateData(updateData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos de actualización inválidos',
          details: validation.errors,
          data: null
        };
      }
      
      // Verificar que el capitán existe
      const existingCapitan = await this.capitanRepository.findById(id);
      if (!existingCapitan) {
        return {
          success: false,
          error: 'Capitán no encontrado',
          data: null
        };
      }
      
      // Validar reglas de negocio para actualización
      const updatedCapitan = existingCapitan.update(updateData);
      await this._validateBusinessRules(updatedCapitan, id);
      
      // Actualizar en repositorio
      const capitanActualizado = await this.capitanRepository.update(id, updateData);
      
      console.log('✅ CapitanService: Capitán actualizado exitosamente:', capitanActualizado.getSummary());
      
      return {
        success: true,
        data: capitanActualizado.toApiResponse(),
        message: 'Capitán actualizado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error en CapitanService.updateCapitan:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Eliminar un capitán
   * @param {string} id - ID del capitán
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  async deleteCapitan(id) {
    try {
      console.log('🗑️ CapitanService: Eliminando capitán:', id);
      
      if (!id) {
        throw new Error('El ID del capitán es requerido');
      }
      
      // Verificar que el capitán existe
      const capitan = await this.capitanRepository.findById(id);
      if (!capitan) {
        return {
          success: false,
          error: 'Capitán no encontrado',
          data: null
        };
      }
      
      // Validar que se puede eliminar
      await this._validateCanDelete(id);
      
      // Eliminar del repositorio
      await this.capitanRepository.delete(id);
      
      console.log('✅ CapitanService: Capitán eliminado exitosamente');
      
      return {
        success: true,
        message: 'Capitán eliminado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error en CapitanService.deleteCapitan:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Buscar capitanes por nombre
   * @param {string} searchTerm - Término de búsqueda
   * @returns {Promise<Object>} Resultado con capitanes encontrados
   */
  async searchCapitanes(searchTerm) {
    try {
      console.log('🔍 CapitanService: Buscando capitanes por término:', searchTerm);
      
      if (!searchTerm || searchTerm.trim().length < 2) {
        return {
          success: false,
          error: 'El término de búsqueda debe tener al menos 2 caracteres',
          data: []
        };
      }
      
      const filters = { search: searchTerm.trim() };
      const capitanes = await this.capitanRepository.findAll(filters);
      
      console.log(`✅ CapitanService: ${capitanes.length} capitanes encontrados`);
      
      return {
        success: true,
        data: capitanes.map(capitan => capitan.toApiResponse()),
        metadata: {
          total: capitanes.length,
          searchTerm: searchTerm.trim()
        }
      };
      
    } catch (error) {
      console.error('❌ Error en CapitanService.searchCapitanes:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Obtener estadísticas de capitanes
   * @returns {Promise<Object>} Estadísticas de capitanes
   */
  async getStats() {
    try {
      console.log('📊 CapitanService: Calculando estadísticas...');
      
      const stats = await this.capitanRepository.getStats();
      
      // Agregar análisis adicional
      const analysis = this._calculateAnalysis(stats);
      
      console.log('✅ CapitanService: Estadísticas calculadas');
      
      return {
        success: true,
        data: {
          ...stats,
          analysis
        }
      };
      
    } catch (error) {
      console.error('❌ Error en CapitanService.getStats:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Validar datos de capitán
   * @param {Object} capitanData - Datos a validar
   * @returns {Promise<Object>} Resultado de validación
   */
  async validateCapitanData(capitanData) {
    try {
      console.log('✅ CapitanService: Validando datos de capitán');
      
      const validation = this._validateCapitanData(capitanData);
      
      // Validaciones adicionales de negocio
      if (validation.isValid) {
        const capitan = Capitan.fromFormData(capitanData);
        await this._validateBusinessRules(capitan);
      }
      
      return {
        success: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings
      };
      
    } catch (error) {
      console.error('❌ Error en CapitanService.validateCapitanData:', error);
      return {
        success: false,
        errors: [error.message],
        warnings: []
      };
    }
  }

  /**
   * Limpiar filtros de entrada
   * @param {Object} filters - Filtros a limpiar
   * @returns {Object} Filtros limpiados
   * @private
   */
  _cleanFilters(filters) {
    const cleanFilters = {};
    
    if (filters.nombre && typeof filters.nombre === 'string') {
      cleanFilters.nombre = filters.nombre.trim();
    }
    
    if (filters.apellido && typeof filters.apellido === 'string') {
      cleanFilters.apellido = filters.apellido.trim();
    }
    
    if (filters.search && typeof filters.search === 'string') {
      cleanFilters.search = filters.search.trim();
    }
    
    return cleanFilters;
  }

  /**
   * Validar datos de capitán
   * @param {Object} data - Datos a validar
   * @returns {Object} Resultado de validación
   * @private
   */
  _validateCapitanData(data) {
    const errors = [];
    const warnings = [];
    
    // Validar campos requeridos
    if (!data.nombre || typeof data.nombre !== 'string' || data.nombre.trim() === '') {
      errors.push('El nombre es requerido');
    }
    
    if (!data.apellido || typeof data.apellido !== 'string' || data.apellido.trim() === '') {
      errors.push('El apellido es requerido');
    }
    
    // Validar formato de teléfono si está presente
    if (data.telefono && data.telefono.trim() !== '') {
      const telefonoRegex = /^[+]?[0-9\s\-()]{7,20}$/;
      if (!telefonoRegex.test(data.telefono.trim())) {
        errors.push('El formato del teléfono no es válido');
      }
    }
    
    // Validar formato de email si está presente
    if (data.email && data.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        errors.push('El formato del email no es válido');
      }
    }
    
    // Advertencias
    if (!data.telefono || data.telefono.trim() === '') {
      warnings.push('Se recomienda agregar un teléfono de contacto');
    }
    
    if (!data.email || data.email.trim() === '') {
      warnings.push('Se recomienda agregar un email de contacto');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validar datos de actualización
   * @param {Object} updateData - Datos de actualización
   * @returns {Object} Resultado de validación
   * @private
   */
  _validateUpdateData(updateData) {
    const errors = [];
    const warnings = [];
    
    // Validar que al menos un campo esté presente
    const hasValidFields = ['nombre', 'apellido', 'telefono', 'email'].some(
      field => updateData[field] !== undefined
    );
    
    if (!hasValidFields) {
      errors.push('Debe proporcionar al menos un campo para actualizar');
    }
    
    // Validar campos individuales si están presentes
    if (updateData.nombre !== undefined) {
      if (!updateData.nombre || typeof updateData.nombre !== 'string' || updateData.nombre.trim() === '') {
        errors.push('El nombre no puede estar vacío');
      }
    }
    
    if (updateData.apellido !== undefined) {
      if (!updateData.apellido || typeof updateData.apellido !== 'string' || updateData.apellido.trim() === '') {
        errors.push('El apellido no puede estar vacío');
      }
    }
    
    if (updateData.telefono !== undefined && updateData.telefono !== null && updateData.telefono.trim() !== '') {
      const telefonoRegex = /^[+]?[0-9\s\-()]{7,20}$/;
      if (!telefonoRegex.test(updateData.telefono.trim())) {
        errors.push('El formato del teléfono no es válido');
      }
    }
    
    if (updateData.email !== undefined && updateData.email !== null && updateData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email.trim())) {
        errors.push('El formato del email no es válido');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validar reglas de negocio
   * @param {Capitan} capitan - Entidad capitán
   * @param {string} excludeId - ID a excluir en validaciones de duplicados
   * @returns {Promise<void>}
   * @private
   */
  async _validateBusinessRules(capitan, excludeId = null) {
    // Validar duplicados por nombre completo
    const existingCapitan = await this.capitanRepository.findByNombreCompleto(
      capitan.nombre,
      capitan.apellido
    );
    
    if (existingCapitan && existingCapitan.id !== excludeId) {
      throw new Error(`Ya existe un capitán con el nombre ${capitan.getNombreCompleto()}`);
    }
  }

  /**
   * Validar que un capitán se puede eliminar
   * @param {string} id - ID del capitán
   * @returns {Promise<void>}
   * @private
   */
  async _validateCanDelete(id) {
    // Esta validación se realiza en el repositorio
    // Aquí se pueden agregar validaciones adicionales de negocio
  }

  /**
   * Calcular distribución de capitanes
   * @param {Array<Capitan>} capitanes - Lista de capitanes
   * @returns {Object} Distribución calculada
   * @private
   */
  _calculateDistribution(capitanes) {
    return {
      por_contacto: {
        con_telefono: capitanes.filter(c => c.telefono).length,
        con_email: capitanes.filter(c => c.email).length,
        contacto_completo: capitanes.filter(c => c.telefono && c.email).length,
        sin_contacto: capitanes.filter(c => !c.telefono && !c.email).length
      },
      por_inicial: this._groupBy(capitanes, c => c.getIniciales())
    };
  }

  /**
   * Calcular análisis de estadísticas
   * @param {Object} stats - Estadísticas base
   * @returns {Object} Análisis calculado
   * @private
   */
  _calculateAnalysis(stats) {
    return {
      calidad_contacto: stats.total_capitanes > 0 
        ? Math.round((stats.capitanes_contacto_completo / stats.total_capitanes) * 100)
        : 0,
      recomendaciones: this._generateRecommendations(stats)
    };
  }

  /**
   * Generar recomendaciones basadas en estadísticas
   * @param {Object} stats - Estadísticas
   * @returns {Array<string>} Lista de recomendaciones
   * @private
   */
  _generateRecommendations(stats) {
    const recommendations = [];
    
    if (stats.porcentaje_contacto_completo < 50) {
      recommendations.push('Se recomienda completar la información de contacto de los capitanes');
    }
    
    if (stats.capitanes_con_telefono < stats.total_capitanes * 0.8) {
      recommendations.push('Agregar números de teléfono a más capitanes para mejor comunicación');
    }
    
    if (stats.capitanes_con_email < stats.total_capitanes * 0.6) {
      recommendations.push('Recopilar direcciones de email para comunicación digital');
    }
    
    return recommendations;
  }

  /**
   * Agrupar elementos por una función
   * @param {Array} array - Array a agrupar
   * @param {Function} keyFn - Función para obtener la clave
   * @returns {Object} Objeto agrupado
   * @private
   */
  _groupBy(array, keyFn) {
    return array.reduce((groups, item) => {
      const key = typeof keyFn === 'function' ? keyFn(item) : item[keyFn];
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }
}

export default CapitanService;