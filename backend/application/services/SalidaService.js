// backend/application/services/SalidaService.js
// Servicio de aplicación para lógica de negocio de Salidas

import { Salida } from '../../domain/entities/Salida.js';

/**
 * Servicio de Salidas - Contiene la lógica de negocio
 * Orquesta las operaciones entre repositorios y aplica reglas de negocio
 */
/**
 * @implements {import('../../domain/types').ISalidaService}
 */
export class SalidaService {
  /**
   * Constructor del servicio
   * @param {SalidaRepository} salidaRepository - Repositorio de salidas
   * @param {Object} capitanRepository - Repositorio de capitanes (opcional)
   */
  constructor(salidaRepository, capitanRepository = null) {
    this.salidaRepository = salidaRepository;
    this.capitanRepository = capitanRepository;
  }

  /**
   * Obtener todas las salidas con filtros
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Object>} Resultado con salidas y metadatos
   */
  async getAllSalidas(filters = {}) {
    try {
      console.log('🔍 SalidaService: Obteniendo todas las salidas con filtros:', filters);
      
      // Limpiar filtros vacíos
      const cleanFilters = this._cleanFilters(filters);
      
      // Obtener salidas del repositorio
      const salidas = await this.salidaRepository.findAll(cleanFilters);
      
      // Calcular metadatos
      const metadata = {
        total: salidas.length,
        filters: cleanFilters,
        distribution: this._calculateDistribution(salidas)
      };
      
      console.log(`✅ SalidaService: ${salidas.length} salidas obtenidas`);
      
      return {
        success: true,
        data: salidas.map(salida => salida.toPlainObject()),
        metadata
      };
      
    } catch (error) {
      console.error('❌ Error en SalidaService.getAllSalidas:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Obtener una salida por ID
   * @param {string} id - ID de la salida
   * @returns {Promise<Object>} Resultado con la salida encontrada
   */
  async getSalidaById(id) {
    try {
      console.log('🔍 SalidaService: Obteniendo salida por ID:', id);
      
      if (!id) {
        throw new Error('ID de salida es requerido');
      }
      
      const salida = await this.salidaRepository.findById(id);
      
      if (!salida) {
        return {
          success: false,
          error: 'Salida no encontrada',
          data: null
        };
      }
      
      console.log('✅ SalidaService: Salida encontrada:', salida.getSummary());
      
      return {
        success: true,
        data: salida.toPlainObject()
      };
      
    } catch (error) {
      console.error('❌ Error en SalidaService.getSalidaById:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Crear una nueva salida
   * @param {Object} salidaData - Datos de la nueva salida
   * @returns {Promise<Object>} Resultado de la creación
   */
  async createSalida(salidaData) {
    try {
      console.log('📝 SalidaService: Creando nueva salida:', salidaData);
      
      // Crear entidad Salida
      const salida = new Salida(salidaData);
      
      // Validar la entidad
      salida.validate();
      
      // Verificar que el capitán existe (si tenemos repositorio de capitanes)
      if (this.capitanRepository) {
        await this._validateCapitanExists(salida.capitan_id);
      }
      
      // Verificar conflictos de horario
      await this._validateNoTimeConflict(salida.capitan_id, salida.dia_semana, salida.hora);
      
      // Crear en el repositorio
      const salidaCreada = await this.salidaRepository.create(salida);
      
      console.log('✅ SalidaService: Salida creada exitosamente:', salidaCreada.getSummary());
      
      return {
        success: true,
        data: salidaCreada.toPlainObject(),
        message: 'Salida creada exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error en SalidaService.createSalida:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Actualizar una salida existente
   * @param {string} id - ID de la salida a actualizar
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} Resultado de la actualización
   */
  async updateSalida(id, updateData) {
    try {
      console.log('📝 SalidaService: Actualizando salida:', id, updateData);
      
      if (!id) {
        throw new Error('ID de salida es requerido');
      }
      
      // Verificar que la salida existe
      const salidaExistente = await this.salidaRepository.findById(id);
      if (!salidaExistente) {
        throw new Error('Salida no encontrada');
      }
      
      // Si se está actualizando el horario, verificar conflictos
      if (updateData.dia_semana || updateData.hora) {
        const diaSemana = updateData.dia_semana || salidaExistente.dia_semana;
        const hora = updateData.hora || salidaExistente.hora;
        const capitanId = updateData.capitan_id || salidaExistente.capitan_id;
        
        await this._validateNoTimeConflict(capitanId, diaSemana, hora, id);
      }
      
      // Si se está cambiando el capitán, verificar que existe
      if (updateData.capitan_id && this.capitanRepository) {
        await this._validateCapitanExists(updateData.capitan_id);
      }
      
      // Actualizar en el repositorio
      const salidaActualizada = await this.salidaRepository.update(id, updateData);
      
      console.log('✅ SalidaService: Salida actualizada exitosamente:', salidaActualizada.getSummary());
      
      return {
        success: true,
        data: salidaActualizada.toPlainObject(),
        message: 'Salida actualizada exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error en SalidaService.updateSalida:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Eliminar una salida
   * @param {string} id - ID de la salida a eliminar
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  async deleteSalida(id) {
    try {
      console.log('🗑️ SalidaService: Eliminando salida:', id);
      
      if (!id) {
        throw new Error('ID de salida es requerido');
      }
      
      // Verificar que la salida existe
      const salidaExistente = await this.salidaRepository.findById(id);
      if (!salidaExistente) {
        throw new Error('Salida no encontrada');
      }
      
      // Eliminar del repositorio
      await this.salidaRepository.delete(id);
      
      console.log('✅ SalidaService: Salida eliminada exitosamente');
      
      return {
        success: true,
        message: 'Salida eliminada exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error en SalidaService.deleteSalida:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener salidas por capitán
   * @param {string} capitanId - ID del capitán
   * @returns {Promise<Object>} Resultado con las salidas del capitán
   */
  async getSalidasByCapitan(capitanId) {
    try {
      console.log('🔍 SalidaService: Obteniendo salidas por capitán:', capitanId);
      
      if (!capitanId) {
        throw new Error('ID de capitán es requerido');
      }
      
      const salidas = await this.salidaRepository.findByCapitan(capitanId);
      
      console.log(`✅ SalidaService: ${salidas.length} salidas encontradas para el capitán`);
      
      return {
        success: true,
        data: salidas.map(salida => salida.toPlainObject()),
        metadata: {
          capitan_id: capitanId,
          total: salidas.length
        }
      };
      
    } catch (error) {
      console.error('❌ Error en SalidaService.getSalidasByCapitan:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Obtener estadísticas de salidas
   * @returns {Promise<Object>} Estadísticas completas
   */
  async getStats() {
    try {
      console.log('📊 SalidaService: Calculando estadísticas...');
      
      const stats = await this.salidaRepository.getStats();
      
      // Añadir análisis adicionales
      const analysis = {
        cobertura_barrios: this._calculateCoberturaBarrios(stats),
        eficiencia_capitanes: this._calculateEficienciaCapitanes(stats),
        distribucion_semanal: this._analyzeDistribucionSemanal(stats.distribucion_por_dia)
      };
      
      console.log('✅ SalidaService: Estadísticas calculadas');
      
      return {
        success: true,
        data: {
          ...stats,
          analysis
        }
      };
      
    } catch (error) {
      console.error('❌ Error en SalidaService.getStats:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Cambiar estado de una salida
   * @param {string} id - ID de la salida
   * @param {string} nuevoEstado - Nuevo estado
   * @returns {Promise<Object>} Resultado del cambio de estado
   */
  async changeStatus(id, nuevoEstado) {
    try {
      console.log('🔄 SalidaService: Cambiando estado de salida:', id, '→', nuevoEstado);
      
      if (!id || !nuevoEstado) {
        throw new Error('ID de salida y nuevo estado son requeridos');
      }
      
      // Validar que el estado es válido
      const estadosValidos = Salida.getValidEstados();
      if (!estadosValidos.includes(nuevoEstado.toLowerCase())) {
        throw new Error(`Estado inválido: ${nuevoEstado}. Estados válidos: ${estadosValidos.join(', ')}`);
      }
      
      // Actualizar el estado
      const resultado = await this.updateSalida(id, { estado: nuevoEstado.toLowerCase() });
      
      if (resultado.success) {
        console.log('✅ SalidaService: Estado cambiado exitosamente');
      }
      
      return resultado;
      
    } catch (error) {
      console.error('❌ Error en SalidaService.changeStatus:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Métodos privados de validación y utilidad

  /**
   * Limpiar filtros vacíos
   * @param {Object} filters - Filtros originales
   * @returns {Object} Filtros limpios
   * @private
   */
  _cleanFilters(filters) {
    const cleanFilters = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanFilters[key] = value;
      }
    });
    
    return cleanFilters;
  }

  /**
   * Calcular distribución de salidas
   * @param {Array<Salida>} salidas - Lista de salidas
   * @returns {Object} Distribución calculada
   * @private
   */
  _calculateDistribution(salidas) {
    return {
      por_estado: this._groupBy(salidas, 'estado'),
      por_dia: this._groupBy(salidas, 'dia_semana'),
      por_barrio: this._groupBy(salidas, 'barrio_asignado')
    };
  }

  /**
   * Agrupar elementos por una propiedad
   * @param {Array} items - Lista de elementos
   * @param {string} property - Propiedad para agrupar
   * @returns {Object} Elementos agrupados
   * @private
   */
  _groupBy(items, property) {
    return items.reduce((groups, item) => {
      const key = item[property];
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }

  /**
   * Validar que el capitán existe
   * @param {string} capitanId - ID del capitán
   * @throws {Error} Si el capitán no existe
   * @private
   */
  async _validateCapitanExists(capitanId) {
    if (!this.capitanRepository) {
      console.log('⚠️ Repositorio de capitanes no disponible, omitiendo validación');
      return;
    }
    
    try {
      const capitan = await this.capitanRepository.findById(capitanId);
      if (!capitan) {
        throw new Error(`El capitán con ID ${capitanId} no existe`);
      }
    } catch (error) {
      console.error('❌ Error validando capitán:', error);
      throw new Error(`Error validando capitán: ${error.message}`);
    }
  }

  /**
   * Validar que no hay conflicto de horario
   * @param {string} capitanId - ID del capitán
   * @param {string} diaSemana - Día de la semana
   * @param {string} hora - Hora de la salida
   * @param {string} excludeId - ID a excluir (para actualizaciones)
   * @throws {Error} Si hay conflicto de horario
   * @private
   */
  async _validateNoTimeConflict(capitanId, diaSemana, hora, excludeId = null) {
    const hasConflict = await this.salidaRepository.hasTimeConflict(
      capitanId, 
      diaSemana, 
      hora, 
      excludeId
    );
    
    if (hasConflict) {
      throw new Error(`El capitán ya tiene una salida programada para ${diaSemana} a las ${hora}`);
    }
  }

  /**
   * Calcular cobertura de barrios
   * @param {Object} stats - Estadísticas base
   * @returns {Object} Análisis de cobertura
   * @private
   */
  _calculateCoberturaBarrios(stats) {
    const totalBarrios = Salida.getValidBarrios().length;
    const barriosCubiertos = stats.barrios_cubiertos;
    
    return {
      total_barrios: totalBarrios,
      barrios_cubiertos: barriosCubiertos,
      porcentaje_cobertura: Math.round((barriosCubiertos / totalBarrios) * 100),
      barrios_sin_cobertura: totalBarrios - barriosCubiertos
    };
  }

  /**
   * Calcular eficiencia de capitanes
   * @param {Object} stats - Estadísticas base
   * @returns {Object} Análisis de eficiencia
   * @private
   */
  _calculateEficienciaCapitanes(stats) {
    const promedioSalidasPorCapitan = stats.total_salidas / (stats.capitanes_unicos || 1);
    
    return {
      capitanes_activos: stats.capitanes_unicos,
      promedio_salidas_por_capitan: Math.round(promedioSalidasPorCapitan * 100) / 100,
      total_salidas: stats.total_salidas
    };
  }

  /**
   * Analizar distribución semanal
   * @param {Object} distribucionPorDia - Distribución por día
   * @returns {Object} Análisis semanal
   * @private
   */
  _analyzeDistribucionSemanal(distribucionPorDia) {
    const dias = Object.keys(distribucionPorDia);
    const valores = Object.values(distribucionPorDia);
    
    const total = valores.reduce((sum, val) => sum + val, 0);
    const promedio = total / dias.length;
    
    const diaMasActivo = dias.reduce((max, dia) => 
      distribucionPorDia[dia] > distribucionPorDia[max] ? dia : max
    );
    
    const diaMenosActivo = dias.reduce((min, dia) => 
      distribucionPorDia[dia] < distribucionPorDia[min] ? dia : min
    );
    
    return {
      promedio_por_dia: Math.round(promedio * 100) / 100,
      dia_mas_activo: diaMasActivo,
      dia_menos_activo: diaMenosActivo,
      total_semanal: total
    };
  }
}

export default SalidaService;