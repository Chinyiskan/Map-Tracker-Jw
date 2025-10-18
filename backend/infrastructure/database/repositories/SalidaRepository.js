// backend/infrastructure/database/repositories/SalidaRepository.js
// Repositorio para operaciones de persistencia de Salidas

import { Salida } from '../../../domain/entities/Salida.js';

/**
 * Repositorio de Salidas - Maneja la persistencia de datos
 * Implementa el patrón Repository para abstraer el acceso a datos
 * @implements {import('../../../domain/types/repositories').ISalidaRepository}
 */
export class SalidaRepository {
  /**
   * Constructor del repositorio
   * @param {Object} database - Cliente de base de datos (Supabase)
   */
  constructor(database) {
    this.db = database;
    this.tableName = 'salidas_predicacion';
  }

  /**
   * Obtener todas las salidas con filtros opcionales
   * @param {Object} filters - Filtros de búsqueda
   * @param {string} filters.capitan_id - ID del capitán
   * @param {string} filters.barrio_asignado - Barrio asignado
   * @param {string} filters.dia_semana - Día de la semana
   * @param {string} filters.estado - Estado de la salida
   * @returns {Promise<Array<Salida>>} Lista de salidas
   */
  async findAll(filters = {}) {
    try {
      console.log('🔍 Buscando salidas con filtros:', filters);
      console.log('📊 Usando tabla:', this.tableName);
      
      let query = this.db
        .from(this.tableName)
        .select(`
          *,
          capitanes (
            id,
            nombre,
            apellido,
            telefono
          )
        `);
      
      // Aplicar filtros dinámicamente
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value);
        }
      });
      
      // Ordenar por día de la semana y hora
      query = query.order('dia_semana').order('hora');
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Error de Supabase:', error);
        
        // Si la tabla no existe o cualquier error relacionado con tabla, usar mock
        if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log('⚠️ Tabla no existe o error de BD, usando datos mock');
          return this._getMockSalidas(filters);
        }
        
        // Para otros errores, lanzar excepción para debugging
        throw new Error(`Error en consulta de salidas: ${error.message}`);
      }
      
      // Verificar si los datos incluyen información de capitanes
      if (!data || data.length === 0) {
        console.log('ℹ️ No se encontraron salidas');
        return [];
      }
      
      // Convertir datos a entidades preservando información de capitanes
      const salidas = data.map(item => {
        console.log('📝 Procesando salida:', item.id, 'con capitanes:', !!item.capitanes);
        return Salida.fromPlainObject(item);
      });
      
      console.log(`✅ Encontradas ${salidas.length} salidas reales con información de capitanes`);
      return salidas;
      
    } catch (error) {
      console.error('❌ Error en SalidaRepository.findAll:', error);
      
      // Solo usar mock si es un error de tabla no existente
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('⚠️ Tabla no existe, usando datos mock');
        return this._getMockSalidas(filters);
      }
      
      // Para otros errores, relanzar para debugging
      throw error;
    }
  }

  /**
   * Buscar una salida por ID
   * @param {string} id - ID de la salida
   * @returns {Promise<Salida|null>} Salida encontrada o null
   */
  async findById(id) {
    try {
      console.log('🔍 Buscando salida por ID:', id);
      
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        // Si la tabla no existe, devolver null
        if (error.code === '42P01') {
          console.log('⚠️ Tabla salidas_predicacion no existe, devolviendo null');
          return null;
        }
        
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Salida no encontrada:', id);
          return null;
        }
        console.error('❌ Error en findById:', error);
        throw new Error(`Error obteniendo salida: ${error.message}`);
      }
      
      const salida = Salida.fromPlainObject(data);
      console.log('✅ Salida encontrada:', salida.getSummary());
      return salida;
      
    } catch (error) {
      console.error('❌ Error en SalidaRepository.findById:', error);
      
      // Si hay cualquier error de tabla no existente, devolver null
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('⚠️ Tabla salidas_predicacion no existe, devolviendo null');
        return null;
      }
      
      throw error;
    }
  }

  /**
   * Crear una nueva salida
   * @param {Salida} salida - Entidad salida a crear
   * @returns {Promise<Salida>} Salida creada con ID asignado
   */
  async create(salida) {
    try {
      console.log('📝 Creando nueva salida:', salida.getSummary());
      
      // Validar la entidad antes de persistir
      salida.validate();
      
      // Preparar datos para inserción (sin ID)
      const dataToInsert = salida.toPlainObject();
      delete dataToInsert.id; // El ID se genera automáticamente
      
      const { data, error } = await this.db
        .from(this.tableName)
        .insert([dataToInsert])
        .select()
        .single();
      
      if (error) {
        // Si la tabla no existe, simular creación exitosa
        if (error.code === '42P01') {
          console.log('⚠️ Tabla salidas_predicacion no existe, simulando creación');
          const mockSalida = Salida.fromPlainObject({
            ...dataToInsert,
            id: 'mock-' + Date.now()
          });
          return mockSalida;
        }
        
        console.error('❌ Error en create:', error);
        throw new Error(`Error creando salida: ${error.message}`);
      }
      
      const salidaCreada = Salida.fromPlainObject(data);
      console.log('✅ Salida creada exitosamente:', salidaCreada.getSummary());
      return salidaCreada;
      
    } catch (error) {
      console.error('❌ Error en SalidaRepository.create:', error);
      
      // Si hay cualquier error de tabla no existente, simular creación
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('⚠️ Tabla salidas_predicacion no existe, simulando creación');
        const dataToInsert = salida.toPlainObject();
        delete dataToInsert.id;
        const mockSalida = Salida.fromPlainObject({
          ...dataToInsert,
          id: 'mock-' + Date.now()
        });
        return mockSalida;
      }
      
      throw error;
    }
  }

  /**
   * Actualizar una salida existente
   * @param {string} id - ID de la salida a actualizar
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Salida>} Salida actualizada
   */
  async update(id, updateData) {
    try {
      console.log('📝 Actualizando salida:', id, updateData);
      
      // Buscar la salida existente
      const salidaExistente = await this.findById(id);
      if (!salidaExistente) {
        throw new Error(`Salida con ID ${id} no encontrada`);
      }
      
      // Crear nueva instancia con datos actualizados
      const datosActualizados = {
        ...salidaExistente.toPlainObject(),
        ...updateData,
        id: id, // Mantener el ID original
        fecha_actualizacion: new Date()
      };
      
      const salidaActualizada = Salida.fromPlainObject(datosActualizados);
      
      // Validar la entidad actualizada
      salidaActualizada.validate();
      
      // Actualizar en la base de datos
      const { data, error } = await this.db
        .from(this.tableName)
        .update(salidaActualizada.toPlainObject())
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error en update:', error);
        throw new Error(`Error actualizando salida: ${error.message}`);
      }
      
      const resultado = Salida.fromPlainObject(data);
      console.log('✅ Salida actualizada exitosamente:', resultado.getSummary());
      return resultado;
      
    } catch (error) {
      console.error('❌ Error en SalidaRepository.update:', error);
      throw error;
    }
  }

  /**
   * Eliminar una salida
   * @param {string} id - ID de la salida a eliminar
   * @returns {Promise<boolean>} true si se eliminó exitosamente
   */
  async delete(id) {
    try {
      console.log('🗑️ Eliminando salida:', id);
      
      // Verificar que la salida existe
      const salidaExistente = await this.findById(id);
      if (!salidaExistente) {
        throw new Error(`Salida con ID ${id} no encontrada`);
      }
      
      const { error } = await this.db
        .from(this.tableName)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Error en delete:', error);
        throw new Error(`Error eliminando salida: ${error.message}`);
      }
      
      console.log('✅ Salida eliminada exitosamente:', salidaExistente.getSummary());
      return true;
      
    } catch (error) {
      console.error('❌ Error en SalidaRepository.delete:', error);
      throw error;
    }
  }

  /**
   * Buscar salidas por capitán
   * @param {string} capitanId - ID del capitán
   * @returns {Promise<Array<Salida>>} Lista de salidas del capitán
   */
  async findByCapitan(capitanId) {
    try {
      console.log('🔍 Buscando salidas por capitán:', capitanId);
      
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .eq('capitan_id', capitanId)
        .order('dia_semana')
        .order('hora');
      
      if (error) {
        console.error('❌ Error en findByCapitan:', error);
        throw new Error(`Error obteniendo salidas del capitán: ${error.message}`);
      }
      
      const salidas = (data || []).map(item => Salida.fromPlainObject(item));
      console.log(`✅ Encontradas ${salidas.length} salidas para el capitán ${capitanId}`);
      return salidas;
      
    } catch (error) {
      console.error('❌ Error en SalidaRepository.findByCapitan:', error);
      throw error;
    }
  }

  /**
   * Buscar salidas por barrio
   * @param {string} barrio - Nombre del barrio
   * @returns {Promise<Array<Salida>>} Lista de salidas del barrio
   */
  async findByBarrio(barrio) {
    try {
      console.log('🔍 Buscando salidas por barrio:', barrio);
      
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .eq('barrio_asignado', barrio)
        .order('dia_semana')
        .order('hora');
      
      if (error) {
        console.error('❌ Error en findByBarrio:', error);
        throw new Error(`Error obteniendo salidas del barrio: ${error.message}`);
      }
      
      const salidas = (data || []).map(item => Salida.fromPlainObject(item));
      console.log(`✅ Encontradas ${salidas.length} salidas para el barrio ${barrio}`);
      return salidas;
      
    } catch (error) {
      console.error('❌ Error en SalidaRepository.findByBarrio:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de salidas
   * @returns {Promise<Object>} Estadísticas de salidas
   */
  async getStats() {
    try {
      console.log('📊 Calculando estadísticas de salidas...');
      
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*');
      
      if (error) {
        console.error('❌ Error en getStats:', error);
        throw new Error(`Error obteniendo estadísticas: ${error.message}`);
      }
      
      const salidas = data || [];
      
      const stats = {
        total_salidas: salidas.length,
        salidas_activas: salidas.filter(s => s.estado === 'activo').length,
        salidas_pausadas: salidas.filter(s => s.estado === 'pausado').length,
        salidas_completadas: salidas.filter(s => s.estado === 'completado').length,
        salidas_canceladas: salidas.filter(s => s.estado === 'cancelado').length,
        capitanes_unicos: new Set(salidas.map(s => s.capitan_id)).size,
        barrios_cubiertos: new Set(salidas.map(s => s.barrio_asignado)).size,
        distribucion_por_dia: this._getDistribucionPorDia(salidas),
        distribucion_por_barrio: this._getDistribucionPorBarrio(salidas),
        distribucion_por_estado: this._getDistribucionPorEstado(salidas)
      };
      
      console.log('✅ Estadísticas calculadas:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ Error en SalidaRepository.getStats:', error);
      throw error;
    }
  }

  /**
   * Obtener distribución por día de la semana
   * @param {Array} salidas - Lista de salidas
   * @returns {Object} Distribución por día
   * @private
   */
  _getDistribucionPorDia(salidas) {
    const distribucion = {};
    const dias = Salida.getValidDias();
    
    // Inicializar todos los días en 0
    dias.forEach(dia => {
      distribucion[dia] = 0;
    });
    
    // Contar salidas por día
    salidas.forEach(salida => {
      if (distribucion.hasOwnProperty(salida.dia_semana)) {
        distribucion[salida.dia_semana]++;
      }
    });
    
    return distribucion;
  }

  /**
   * Obtener distribución por barrio
   * @param {Array} salidas - Lista de salidas
   * @returns {Object} Distribución por barrio
   * @private
   */
  _getDistribucionPorBarrio(salidas) {
    const distribucion = {};
    
    salidas.forEach(salida => {
      const barrio = salida.barrio_asignado;
      distribucion[barrio] = (distribucion[barrio] || 0) + 1;
    });
    
    return distribucion;
  }

  /**
   * Obtener distribución por estado
   * @param {Array} salidas - Lista de salidas
   * @returns {Object} Distribución por estado
   * @private
   */
  _getDistribucionPorEstado(salidas) {
    const distribucion = {};
    const estados = Salida.getValidEstados();
    
    // Inicializar todos los estados en 0
    estados.forEach(estado => {
      distribucion[estado] = 0;
    });
    
    // Contar salidas por estado
    salidas.forEach(salida => {
      if (distribucion.hasOwnProperty(salida.estado)) {
        distribucion[salida.estado]++;
      }
    });
    
    return distribucion;
  }

  /**
   * Verificar si existe conflicto de horario
   * @param {string} capitanId - ID del capitán
   * @param {string} diaSemana - Día de la semana
   * @param {string} hora - Hora de la salida
   * @param {string} excludeId - ID a excluir de la búsqueda (para actualizaciones)
   * @returns {Promise<boolean>} true si hay conflicto
   */
  async hasTimeConflict(capitanId, diaSemana, hora, excludeId = null) {
    try {
      console.log('🔍 Verificando conflicto de horario:', { capitanId, diaSemana, hora, excludeId });
      
      let query = this.db
        .from(this.tableName)
        .select('id')
        .eq('capitan_id', capitanId)
        .eq('dia_semana', diaSemana)
        .eq('hora', hora);
      
      // Excluir ID específico (útil para actualizaciones)
      if (excludeId) {
        query = query.neq('id', excludeId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        // Si la tabla no existe, no hay conflictos
        if (error.code === '42P01') {
          console.log('⚠️ Tabla salidas_predicacion no existe, no hay conflictos');
          return false;
        }
        
        console.error('❌ Error verificando conflicto:', error);
        throw new Error(`Error verificando conflicto de horario: ${error.message}`);
      }
      
      const hasConflict = data && data.length > 0;
      console.log(`${hasConflict ? '⚠️' : '✅'} Conflicto de horario: ${hasConflict}`);
      return hasConflict;
      
    } catch (error) {
      console.error('❌ Error en SalidaRepository.hasTimeConflict:', error);
      
      // Si hay cualquier error de tabla no existente, no hay conflictos
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('⚠️ Tabla salidas_predicacion no existe, no hay conflictos');
        return false;
      }
      
      throw error;
    }
  }

  /**
   * Obtener datos mock de salidas cuando la tabla no existe
   * @param {Object} filters - Filtros aplicados
   * @returns {Array<Salida>} Lista de salidas mock
   * @private
   */
  _getMockSalidas(filters = {}) {
    console.log('📝 Generando datos mock de salidas...');
    
    const mockData = [
      {
        id: 'mock-1',
        capitan_id: 'mock-capitan-1',
        barrio_asignado: 'Guaimaral',
        dia_semana: 'Miercoles',
        hora: '08:30:00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        capitanes: {
          id: 'mock-capitan-1',
          nombre: 'Augusto',
          apellido: 'Maldonado',
          telefono: '3002071800'
        }
      },
      {
        id: 'mock-2',
        capitan_id: 'mock-capitan-2',
        barrio_asignado: 'Zulima',
        dia_semana: 'Martes',
        hora: '08:30:00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        capitanes: {
          id: 'mock-capitan-2',
          nombre: 'Oscar',
          apellido: 'Giraldo',
          telefono: '3124826062'
        }
      },
      {
        id: 'mock-3',
        capitan_id: 'mock-capitan-3',
        barrio_asignado: 'Niza',
        dia_semana: 'Jueves',
        hora: '08:30:00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        capitanes: {
          id: 'mock-capitan-3',
          nombre: 'Julian',
          apellido: 'Bayona',
          telefono: '3165709422'
        }
      },
      {
        id: 'mock-4',
        capitan_id: 'mock-capitan-4',
        barrio_asignado: 'La Mar y Gratamira',
        dia_semana: 'Lunes',
        hora: '16:00:00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        capitanes: {
          id: 'mock-capitan-4',
          nombre: 'Juan Carlos',
          apellido: 'Mojica',
          telefono: '3202419509'
        }
      }
    ];
    
    // Aplicar filtros si existen
    let filteredData = mockData;
    
    if (filters.capitan_id) {
      filteredData = filteredData.filter(item => item.capitan_id === filters.capitan_id);
    }
    
    if (filters.barrio_asignado) {
      filteredData = filteredData.filter(item => item.barrio_asignado === filters.barrio_asignado);
    }
    
    if (filters.dia_semana) {
      filteredData = filteredData.filter(item => item.dia_semana === filters.dia_semana);
    }
    
    // Convertir a entidades Salida
    const salidas = filteredData.map(item => Salida.fromPlainObject(item));
    
    console.log(`✅ Generadas ${salidas.length} salidas mock`);
    return salidas;
  }
}

export default SalidaRepository;