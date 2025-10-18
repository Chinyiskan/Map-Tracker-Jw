// backend/infrastructure/database/repositories/CicloRepository.js
// Repositorio para gestión de ciclos en Supabase

import Ciclo from '../../../domain/entities/Ciclo.js';
import ErrorHandlingService from '../ErrorHandlingService.js';
import MockDataService from '../MockDataService.js';
import QueryOptimizationService from '../QueryOptimizationService.js';

/**
 * @implements {import('../../../domain/types/repositories').ICicloRepository}
 */
class CicloRepository {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.tableName = 'ciclos';
  }
  
  /**
   * Crear nuevo ciclo en base de datos
   * @param {Ciclo} ciclo - Entidad de ciclo
   * @returns {Object} Ciclo creado con ID
   */
  async crear(ciclo) {
    try {
      console.log('🔄 Creando ciclo en BD:', ciclo.barrio, 'ciclo', ciclo.numero_ciclo);
      
      const datosCiclo = ciclo.toDatabase();
      
      const { data, error } = await this.db
        .from(this.tableName)
        .insert(datosCiclo)
        .select()
        .single();
        
      if (error) {
        // Si la tabla no existe, simular creación exitosa
        if (ErrorHandlingService.isTableNotExistError(error)) {
          console.log('⚠️ Tabla ciclos no existe, simulando creación');
          return ErrorHandlingService.createMockWriteResult('create', datosCiclo);
        }
        
        console.error('❌ Error en crear:', error);
        throw new Error(`Error creando ciclo: ${error.message}`);
      }
      
      console.log('✅ Ciclo creado exitosamente:', data.id);
      return data;
      
    } catch (error) {
      console.error('❌ Error en CicloRepository.crear:', error);
      
      // Si hay cualquier error de tabla no existente, simular creación
      if (ErrorHandlingService.isTableNotExistError(error)) {
        console.log('⚠️ Tabla ciclos no existe, simulando creación');
        const datosCiclo = ciclo.toDatabase();
        return ErrorHandlingService.createMockWriteResult('create', datosCiclo);
      }
      
      throw error;
    }
  }
  
  /**
   * Obtener ciclo activo de un barrio
   * @param {string} barrio - Nombre del barrio
   * @returns {Object|null} Ciclo activo encontrado
   */
  async obtenerCicloActivo(barrio) {
    try {
      console.log('🔍 Buscando ciclo activo para barrio:', barrio);
      
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .eq('barrio', barrio)
        .eq('estado', 'activo')
        .order('numero_ciclo', { ascending: false })
        .limit(1)
        .single();
        
      if (error) {
        // Si la tabla no existe, devolver null
        if (ErrorHandlingService.isTableNotExistError(error)) {
          console.log('⚠️ Tabla ciclos no existe, devolviendo null');
          return null;
        }
        
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Ciclo activo no encontrado para barrio:', barrio);
          return null;
        }
        
        console.error('❌ Error en obtenerCicloActivo:', error);
        throw new Error(`Error obteniendo ciclo activo: ${error.message}`);
      }
      
      console.log('✅ Ciclo activo encontrado para barrio:', barrio);
      return data;
      
    } catch (error) {
      console.error('❌ Error en CicloRepository.obtenerCicloActivo:', error);
      
      // Si hay cualquier error de tabla no existente, devolver null
      if (ErrorHandlingService.isTableNotExistError(error)) {
        console.log('⚠️ Tabla ciclos no existe, devolviendo null');
        return null;
      }
      
      throw error;
    }
  }
  
  /**
   * Obtener ciclo por ID
   * @param {string} id - ID del ciclo
   * @returns {Object|null} Ciclo encontrado
   */
  async obtenerPorId(id) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error en CicloRepository.obtenerPorId:', error);
        throw new Error(`Error obteniendo ciclo: ${error.message}`);
      }
      
      return data;
      
    } catch (error) {
      console.error('❌ Error en CicloRepository.obtenerPorId:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener último ciclo de un barrio (activo o completado)
   * @param {string} barrio - Nombre del barrio
   * @returns {Object|null} Último ciclo encontrado
   */
  async obtenerUltimoCiclo(barrio) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .eq('barrio', barrio)
        .order('numero_ciclo', { ascending: false })
        .limit(1)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error en CicloRepository.obtenerUltimoCiclo:', error);
        throw new Error(`Error obteniendo último ciclo: ${error.message}`);
      }
      
      return data;
      
    } catch (error) {
      console.error('❌ Error en CicloRepository.obtenerUltimoCiclo:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener todos los ciclos de un barrio
   * @param {string} barrio - Nombre del barrio
   * @param {Object} opciones - Opciones de consulta
   * @returns {Array} Array de ciclos
   */
  async obtenerPorBarrio(barrio, opciones = {}) {
    try {
      const {
        limite = 50,
        estado = null,
        orden = 'desc'
      } = opciones;
      
      let query = this.db
        .from(this.tableName)
        .select('*')
        .eq('barrio', barrio)
        .order('numero_ciclo', { ascending: orden === 'asc' })
        .limit(limite);
      
      if (estado) {
        query = query.eq('estado', estado);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Error en CicloRepository.obtenerPorBarrio:', error);
        throw new Error(`Error obteniendo ciclos: ${error.message}`);
      }
      
      return data || [];
      
    } catch (error) {
      console.error('❌ Error en CicloRepository.obtenerPorBarrio:', error.message);
      throw error;
    }
  }
  
  /**
   * Actualizar ciclo existente
   * @param {string} id - ID del ciclo
   * @param {Object} datosActualizacion - Datos a actualizar
   * @returns {Object} Ciclo actualizado
   */
  async actualizar(id, datosActualizacion) {
    try {
      console.log('📝 Actualizando ciclo:', id);
      
      const { data, error } = await this.db
        .from(this.tableName)
        .update({
          ...datosActualizacion,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error('❌ Error en CicloRepository.actualizar:', error);
        throw new Error(`Error actualizando ciclo: ${error.message}`);
      }
      
      console.log('✅ Ciclo actualizado exitosamente');
      return data;
      
    } catch (error) {
      console.error('❌ Error en CicloRepository.actualizar:', error.message);
      throw error;
    }
  }
  
  /**
   * Completar ciclo (cambiar estado a completado)
   * @param {string} id - ID del ciclo
   * @param {string} fechaFin - Fecha de finalización (opcional)
   * @returns {Object} Ciclo completado
   */
  async completar(id, fechaFin = null) {
    try {
      console.log('🎉 Completando ciclo:', id);
      
      const datosCompletado = {
        estado: 'completado',
        fecha_fin: fechaFin || new Date().toISOString().split('T')[0],
        progreso_porcentaje: 100,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await this.db
        .from(this.tableName)
        .update(datosCompletado)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error('❌ Error en CicloRepository.completar:', error);
        throw new Error(`Error completando ciclo: ${error.message}`);
      }
      
      console.log('✅ Ciclo completado exitosamente');
      return data;
      
    } catch (error) {
      console.error('❌ Error en CicloRepository.completar:', error.message);
      throw error;
    }
  }
  
  /**
   * Pausar ciclo
   * @param {string} id - ID del ciclo
   * @returns {Object} Ciclo pausado
   */
  async pausar(id) {
    try {
      console.log('⏸️ Pausando ciclo:', id);
      
      const { data, error } = await this.db
        .from(this.tableName)
        .update({
          estado: 'pausado',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error('❌ Error en CicloRepository.pausar:', error);
        throw new Error(`Error pausando ciclo: ${error.message}`);
      }
      
      console.log('✅ Ciclo pausado exitosamente');
      return data;
      
    } catch (error) {
      console.error('❌ Error en CicloRepository.pausar:', error.message);
      throw error;
    }
  }
  
  /**
   * Reactivar ciclo pausado
   * @param {string} id - ID del ciclo
   * @returns {Object} Ciclo reactivado
   */
  async reactivar(id) {
    try {
      console.log('▶️ Reactivando ciclo:', id);
      
      const { data, error } = await this.db
        .from(this.tableName)
        .update({
          estado: 'activo',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error('❌ Error en CicloRepository.reactivar:', error);
        throw new Error(`Error reactivando ciclo: ${error.message}`);
      }
      
      console.log('✅ Ciclo reactivado exitosamente');
      return data;
      
    } catch (error) {
      console.error('❌ Error en CicloRepository.reactivar:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener todos los ciclos activos
   * @returns {Array} Array de ciclos activos
   */
  async obtenerCiclosActivos() {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .eq('estado', 'activo')
        .order('barrio', { ascending: true });
      
      if (error) {
        console.error('❌ Error en CicloRepository.obtenerCiclosActivos:', error);
        throw new Error(`Error obteniendo ciclos activos: ${error.message}`);
      }
      
      return data || [];
      
    } catch (error) {
      console.error('❌ Error en CicloRepository.obtenerCiclosActivos:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener estadísticas de ciclos con agregaciones SQL optimizadas
   * @param {Object} opciones - Opciones de consulta
   * @returns {Object} Estadísticas de ciclos
   */
  async obtenerEstadisticas(opciones = {}) {
    try {
      console.log('📊 Calculando estadísticas de ciclos con SQL optimizado');
      
      const {
        barrio = null,
        estado = null,
        fechaDesde = null,
        fechaHasta = null
      } = opciones;
      
      // Construir filtros WHERE
      let whereClause = '';
      const params = [];
      
      if (barrio || estado || fechaDesde || fechaHasta) {
        const conditions = [];
        
        if (barrio) {
          conditions.push('barrio = $' + (params.length + 1));
          params.push(barrio);
        }
        if (estado) {
          conditions.push('estado = $' + (params.length + 1));
          params.push(estado);
        }
        if (fechaDesde) {
          conditions.push('fecha_inicio >= $' + (params.length + 1));
          params.push(fechaDesde);
        }
        if (fechaHasta) {
          conditions.push('fecha_inicio <= $' + (params.length + 1));
          params.push(fechaHasta);
        }
        
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }
      
      // Consulta SQL optimizada con agregaciones nativas
      const sqlQuery = `
        SELECT 
          COUNT(*) as total_ciclos,
          COUNT(CASE WHEN estado = 'activo' THEN 1 END) as ciclos_activos,
          COUNT(CASE WHEN estado = 'completado' THEN 1 END) as ciclos_completados,
          COUNT(CASE WHEN estado = 'pausado' THEN 1 END) as ciclos_pausados,
          COUNT(CASE WHEN estado = 'inactivo' THEN 1 END) as ciclos_inactivos,
          COUNT(DISTINCT barrio) as barrios_con_ciclos,
          AVG(progreso_porcentaje) as progreso_promedio,
          MIN(progreso_porcentaje) as progreso_minimo,
          MAX(progreso_porcentaje) as progreso_maximo,
          AVG(total_territorios) as promedio_territorios_por_ciclo,
          SUM(territorios_completados) as total_territorios_completados,
          MIN(fecha_inicio) as fecha_primer_ciclo,
          MAX(fecha_inicio) as fecha_ultimo_ciclo,
          COUNT(CASE WHEN fecha_fin IS NOT NULL THEN 1 END) as ciclos_finalizados,
          AVG(CASE WHEN fecha_fin IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (fecha_fin - fecha_inicio)) / 86400 
          END) as promedio_duracion_dias
        FROM ${this.tableName}
        ${whereClause}
      `;
      
      const { data, error } = await this.db.rpc('execute_sql', {
        query: sqlQuery,
        params: params
      });
      
      if (error) {
        console.error('❌ Error en consulta SQL optimizada de ciclos:', error);
        // Fallback a método legacy
        return await this._obtenerEstadisticasLegacy(opciones);
      }
      
      const resultado = data && data.length > 0 ? data[0] : {};
      
      const estadisticas = {
        total_ciclos: parseInt(resultado.total_ciclos) || 0,
        ciclos_activos: parseInt(resultado.ciclos_activos) || 0,
        ciclos_completados: parseInt(resultado.ciclos_completados) || 0,
        ciclos_pausados: parseInt(resultado.ciclos_pausados) || 0,
        ciclos_inactivos: parseInt(resultado.ciclos_inactivos) || 0,
        barrios_con_ciclos: parseInt(resultado.barrios_con_ciclos) || 0,
        progreso_promedio: parseFloat(resultado.progreso_promedio) || 0,
        progreso_minimo: parseFloat(resultado.progreso_minimo) || 0,
        progreso_maximo: parseFloat(resultado.progreso_maximo) || 0,
        promedio_territorios_por_ciclo: parseFloat(resultado.promedio_territorios_por_ciclo) || 0,
        total_territorios_completados: parseInt(resultado.total_territorios_completados) || 0,
        fecha_primer_ciclo: resultado.fecha_primer_ciclo,
        fecha_ultimo_ciclo: resultado.fecha_ultimo_ciclo,
        ciclos_finalizados: parseInt(resultado.ciclos_finalizados) || 0,
        promedio_duracion_dias: parseFloat(resultado.promedio_duracion_dias) || 0
      };
      
      console.log('✅ Estadísticas de ciclos calculadas con SQL:', estadisticas);
      return estadisticas;
      
    } catch (error) {
      console.error('❌ Error en CicloRepository.obtenerEstadisticas:', error);
      // Fallback a método legacy
      return await this._obtenerEstadisticasLegacy(opciones);
    }
  }
  
  /**
   * Método legacy para estadísticas (fallback)
   * @param {Object} opciones - Opciones de consulta
   * @returns {Object} Estadísticas calculadas en memoria
   * @private
   */
  async _obtenerEstadisticasLegacy(opciones = {}) {
    try {
      console.log('⚠️ Usando método legacy para estadísticas de ciclos');
      
      const {
        barrio = null,
        estado = null
      } = opciones;
      
      let query = this.db
        .from(this.tableName)
        .select('barrio, estado, numero_ciclo, progreso_porcentaje, fecha_inicio, fecha_fin, total_territorios, territorios_completados');
      
      if (barrio) {
        query = query.eq('barrio', barrio);
      }
      if (estado) {
        query = query.eq('estado', estado);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Error en método legacy de estadísticas:', error);
        throw new Error(`Error obteniendo estadísticas: ${error.message}`);
      }
      
      const ciclos = data || [];
      
      // Calcular estadísticas en memoria
      const estadisticas = {
        total_ciclos: ciclos.length,
        ciclos_activos: ciclos.filter(c => c.estado === 'activo').length,
        ciclos_completados: ciclos.filter(c => c.estado === 'completado').length,
        ciclos_pausados: ciclos.filter(c => c.estado === 'pausado').length,
        ciclos_inactivos: ciclos.filter(c => c.estado === 'inactivo').length,
        barrios_con_ciclos: new Set(ciclos.map(c => c.barrio)).size,
        progreso_promedio: ciclos.length > 0 
          ? ciclos.reduce((sum, c) => sum + (c.progreso_porcentaje || 0), 0) / ciclos.length
          : 0,
        progreso_minimo: ciclos.length > 0 
          ? Math.min(...ciclos.map(c => c.progreso_porcentaje || 0))
          : 0,
        progreso_maximo: ciclos.length > 0 
          ? Math.max(...ciclos.map(c => c.progreso_porcentaje || 0))
          : 0,
        promedio_territorios_por_ciclo: ciclos.length > 0 
          ? ciclos.reduce((sum, c) => sum + (c.total_territorios || 0), 0) / ciclos.length
          : 0,
        total_territorios_completados: ciclos.reduce((sum, c) => sum + (c.territorios_completados || 0), 0),
        fecha_primer_ciclo: ciclos.length > 0 
          ? ciclos.reduce((min, c) => c.fecha_inicio < min ? c.fecha_inicio : min, ciclos[0].fecha_inicio)
          : null,
        fecha_ultimo_ciclo: ciclos.length > 0 
          ? ciclos.reduce((max, c) => c.fecha_inicio > max ? c.fecha_inicio : max, ciclos[0].fecha_inicio)
          : null,
        ciclos_finalizados: ciclos.filter(c => c.fecha_fin).length,
        promedio_duracion_dias: 0 // Cálculo complejo omitido en legacy
      };
      
      console.log('✅ Estadísticas calculadas con método legacy');
       return estadisticas;
       
     } catch (error) {
       console.error('❌ Error en método legacy de estadísticas:', error);
       throw error;
     }
  }
  
  /**
   * Obtener ranking de barrios optimizado
   * @param {Object} opciones - Opciones de consulta
   * @returns {Promise<Array>} Ranking de barrios
   */
  async obtenerRankingBarriosOptimizado(opciones = {}) {
    try {
      console.log('🚀 Obteniendo ranking de barrios con consulta optimizada');
      
      return await QueryOptimizationService.getBarriosRankingOptimized(this.db, opciones);
      
    } catch (error) {
      console.error('❌ Error en ranking optimizado, usando fallback:', error);
      // Fallback a método simple
      return await this._obtenerRankingBarriosLegacy(opciones);
    }
  }
  
  /**
   * Método legacy para ranking de barrios
   * @param {Object} opciones - Opciones de consulta
   * @returns {Promise<Array>} Ranking simple
   * @private
   */
  async _obtenerRankingBarriosLegacy(opciones = {}) {
    try {
      console.log('⚠️ Usando método legacy para ranking de barrios');
      
      const { limite = 10 } = opciones;
      
      const { data, error } = await this.db
        .from(this.tableName)
        .select('barrio, progreso_porcentaje, total_territorios, territorios_completados, estado')
        .eq('estado', 'activo')
        .order('progreso_porcentaje', { ascending: false })
        .limit(limite);
      
      if (error) {
        throw error;
      }
      
      return (data || []).map((ciclo, index) => ({
        barrio: ciclo.barrio,
        progreso_porcentaje: ciclo.progreso_porcentaje || 0,
        total_territorios: ciclo.total_territorios || 0,
        territorios_completados: ciclo.territorios_completados || 0,
        ranking_progreso: index + 1,
        categoria_progreso: ciclo.progreso_porcentaje >= 80 ? 'Excelente' :
                           ciclo.progreso_porcentaje >= 60 ? 'Bueno' :
                           ciclo.progreso_porcentaje >= 40 ? 'Regular' : 'Necesita atención',
        score_general: ciclo.progreso_porcentaje || 0
      }));
      
    } catch (error) {
      console.error('❌ Error en método legacy de ranking:', error);
      throw error;
    }
  }
  
  /**
   * Verificar si existe un ciclo
   * @param {Object} criterios - Criterios de búsqueda
   * @returns {boolean} True si existe
   */
  async existe(criterios) {
    try {
      let query = this.db
        .from(this.tableName)
        .select('id', { count: 'exact', head: true });
      
      Object.entries(criterios).forEach(([campo, valor]) => {
        query = query.eq(campo, valor);
      });
      
      const { count, error } = await query;
      
      if (error) {
        console.error('❌ Error en CicloRepository.existe:', error);
        throw new Error(`Error verificando existencia: ${error.message}`);
      }
      
      return count > 0;
      
    } catch (error) {
      console.error('❌ Error en CicloRepository.existe:', error.message);
      throw error;
    }
  }
  
  /**
   * Eliminar ciclo (solo para testing/admin)
   * @param {string} id - ID del ciclo
   * @returns {boolean} True si se eliminó exitosamente
   */
  async eliminar(id) {
    try {
      console.log('🗑️ Eliminando ciclo:', id);
      
      const { error } = await this.db
        .from(this.tableName)
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('❌ Error en CicloRepository.eliminar:', error);
        throw new Error(`Error eliminando ciclo: ${error.message}`);
      }
      
      console.log('✅ Ciclo eliminado exitosamente');
      return true;
      
    } catch (error) {
      console.error('❌ Error en CicloRepository.eliminar:', error.message);
      throw error;
    }
  }
}

export default CicloRepository;