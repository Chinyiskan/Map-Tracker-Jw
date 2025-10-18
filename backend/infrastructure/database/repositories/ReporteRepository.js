// backend/infrastructure/database/repositories/ReporteRepository.js
// Repositorio para gestión de reportes en Supabase

import Reporte from '../../../domain/entities/Reporte.js';
import ErrorHandlingService from '../ErrorHandlingService.js';
import MockDataService from '../MockDataService.js';

/**
 * @implements {import('../../../domain/types/repositories').IReporteRepository}
 */
class ReporteRepository {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.tableName = 'reportes';
  }
  
  /**
   * Crear nuevo reporte en base de datos
   * @param {Reporte} reporte - Entidad de reporte
   * @returns {Object} Reporte creado con ID
   */
  async crear(reporte) {
    try {
      console.log('📝 Creando reporte en BD:', reporte.barrio);
      
      const datosReporte = reporte.toDatabase();
      
      const { data, error } = await this.db
        .from(this.tableName)
        .insert(datosReporte)
        .select()
        .single();
        
      if (error) {
        // Si la tabla no existe, simular creación exitosa
        if (ErrorHandlingService.isTableNotExistError(error)) {
          console.log('⚠️ Tabla reportes no existe, simulando creación');
          return ErrorHandlingService.createMockWriteResult('create', datosReporte);
        }
        
        console.error('❌ Error en crear:', error);
        throw new Error(`Error creando reporte: ${error.message}`);
      }
      
      console.log('✅ Reporte creado exitosamente:', data.id);
      return data;
      
    } catch (error) {
      console.error('❌ Error en ReporteRepository.crear:', error);
      
      // Si hay cualquier error de tabla no existente, simular creación
      if (ErrorHandlingService.isTableNotExistError(error)) {
        console.log('⚠️ Tabla reportes no existe, simulando creación');
        const datosReporte = reporte.toDatabase();
        return ErrorHandlingService.createMockWriteResult('create', datosReporte);
      }
      
      throw error;
    }
  }
  
  /**
   * Obtener reportes por barrio
   * @param {string} barrio - Nombre del barrio
   * @param {Object} opciones - Opciones de consulta
   * @returns {Array} Array de reportes
   */
  async obtenerPorBarrio(barrio, opciones = {}) {
    const operation = async () => {
      const {
        limite = 100,
        orden = 'desc',
        fechaDesde = null,
        fechaHasta = null
      } = opciones;
      
      let query = this.db
        .from(this.tableName)
        .select('*')
        .eq('barrio', barrio)
        .order('fecha', { ascending: orden === 'asc' })
        .limit(limite);
      
      // Filtros de fecha
      if (fechaDesde) {
        query = query.gte('fecha', fechaDesde);
      }
      if (fechaHasta) {
        query = query.lte('fecha', fechaHasta);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data || [];
    };
    
    const mockDataProvider = (filters) => {
      const mockFilters = { barrio, ...filters, ...opciones };
      return MockDataService.getMockReportes(mockFilters);
    };
    
    return await ErrorHandlingService.executeWithFallback(
      operation,
      'obtenerPorBarrio',
      this.tableName,
      mockDataProvider,
      { barrio, ...opciones }
    );
  }
  
  /**
   * Obtener reporte por ID
   * @param {string} id - ID del reporte
   * @returns {Object|null} Reporte encontrado
   */
  async obtenerPorId(id) {
    try {
      console.log('🔍 Buscando reporte por ID:', id);
      
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        // Si la tabla no existe, devolver null
        if (ErrorHandlingService.isTableNotExistError(error)) {
          console.log('⚠️ Tabla reportes no existe, devolviendo null');
          return null;
        }
        
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Reporte no encontrado:', id);
          return null;
        }
        
        console.error('❌ Error en obtenerPorId:', error);
        throw new Error(`Error obteniendo reporte: ${error.message}`);
      }
      
      console.log('✅ Reporte encontrado:', id);
      return data;
      
    } catch (error) {
      console.error('❌ Error en ReporteRepository.obtenerPorId:', error);
      
      // Si hay cualquier error de tabla no existente, devolver null
      if (ErrorHandlingService.isTableNotExistError(error)) {
        console.log('⚠️ Tabla reportes no existe, devolviendo null');
        return null;
      }
      
      throw error;
    }
  }
  
  /**
   * Obtener reportes por capitán
   * @param {string} nombreCapitan - Nombre del capitán
   * @param {Object} opciones - Opciones de consulta
   * @returns {Array} Array de reportes
   */
  async obtenerPorCapitan(nombreCapitan, opciones = {}) {
    try {
      const {
        limite = 50,
        fechaDesde = null,
        fechaHasta = null
      } = opciones;
      
      let query = this.db
        .from(this.tableName)
        .select('*')
        .eq('nombre_capitan', nombreCapitan)
        .order('fecha', { ascending: false })
        .limit(limite);
      
      if (fechaDesde) {
        query = query.gte('fecha', fechaDesde);
      }
      if (fechaHasta) {
        query = query.lte('fecha', fechaHasta);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Error en ReporteRepository.obtenerPorCapitan:', error);
        throw new Error(`Error obteniendo reportes por capitán: ${error.message}`);
      }
      
      return data || [];
      
    } catch (error) {
      console.error('❌ Error en ReporteRepository.obtenerPorCapitan:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener reportes por rango de fechas
   * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
   * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
   * @param {Object} opciones - Opciones adicionales
   * @returns {Array} Array de reportes
   */
  async obtenerPorRangoFechas(fechaInicio, fechaFin, opciones = {}) {
    try {
      const { barrio = null, limite = 200 } = opciones;
      
      let query = this.db
        .from(this.tableName)
        .select('*')
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .order('fecha', { ascending: false })
        .limit(limite);
      
      if (barrio) {
        query = query.eq('barrio', barrio);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Error en ReporteRepository.obtenerPorRangoFechas:', error);
        throw new Error(`Error obteniendo reportes por rango: ${error.message}`);
      }
      
      return data || [];
      
    } catch (error) {
      console.error('❌ Error en ReporteRepository.obtenerPorRangoFechas:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener estadísticas mensuales con agregaciones SQL optimizadas
   * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
   * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
   * @param {Object} opciones - Opciones adicionales
   * @returns {Array} Estadísticas agrupadas por mes
   */
  async obtenerEstadisticasMensuales(fechaInicio, fechaFin, opciones = {}) {
    try {
      console.log('📊 Calculando estadísticas mensuales con SQL:', fechaInicio, 'al', fechaFin);
      
      const { barrio = null } = opciones;
      
      // Construir filtros WHERE
      let whereClause = 'WHERE fecha >= $1 AND fecha <= $2';
      const params = [fechaInicio, fechaFin];
      
      if (barrio) {
        whereClause += ' AND barrio = $3';
        params.push(barrio);
      }
      
      // Consulta SQL optimizada con agregaciones por mes
      const sqlQuery = `
        SELECT 
          DATE_TRUNC('month', fecha) as mes,
          COUNT(*) as total_reportes,
          COUNT(DISTINCT barrio) as barrios_activos,
          COUNT(DISTINCT nombre_capitan) as capitanes_activos,
          COUNT(DISTINCT territorio) as territorios_trabajados,
          ARRAY_AGG(DISTINCT barrio ORDER BY barrio) as lista_barrios
        FROM ${this.tableName}
        ${whereClause}
        GROUP BY DATE_TRUNC('month', fecha)
        ORDER BY mes DESC
      `;
      
      const { data, error } = await this.db.rpc('execute_sql', {
        query: sqlQuery,
        params: params
      });
      
      if (error) {
        console.error('❌ Error en consulta SQL mensual:', error);
        // Fallback a método legacy
        return await this._obtenerEstadisticasMensualesLegacy(fechaInicio, fechaFin, opciones);
      }
      
      const estadisticas = (data || []).map(row => ({
        mes: row.mes,
        total_reportes: parseInt(row.total_reportes) || 0,
        barrios_activos: parseInt(row.barrios_activos) || 0,
        capitanes_activos: parseInt(row.capitanes_activos) || 0,
        territorios_trabajados: parseInt(row.territorios_trabajados) || 0,
        lista_barrios: row.lista_barrios || []
      }));
      
      console.log(`✅ Estadísticas mensuales calculadas: ${estadisticas.length} meses`);
      return estadisticas;
      
    } catch (error) {
      console.error('❌ Error en ReporteRepository.obtenerEstadisticasMensuales:', error.message);
      // Fallback a método legacy
      return await this._obtenerEstadisticasMensualesLegacy(fechaInicio, fechaFin, opciones);
    }
  }
  
  /**
   * Método legacy para estadísticas mensuales (fallback)
   * @param {string} fechaInicio - Fecha de inicio
   * @param {string} fechaFin - Fecha de fin
   * @param {Object} opciones - Opciones adicionales
   * @returns {Array} Estadísticas agrupadas por mes
   * @private
   */
  async _obtenerEstadisticasMensualesLegacy(fechaInicio, fechaFin, opciones = {}) {
    try {
      console.log('⚠️ Usando método legacy para estadísticas mensuales');
      
      const reportes = await this.obtenerPorRangoFechas(fechaInicio, fechaFin, opciones);
      
      // Agrupar por mes en memoria
      const agrupados = {};
      
      reportes.forEach(reporte => {
        const fecha = new Date(reporte.fecha);
        const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-01`;
        
        if (!agrupados[mesKey]) {
          agrupados[mesKey] = {
            mes: mesKey,
            reportes: [],
            barrios: new Set(),
            capitanes: new Set(),
            territorios: new Set()
          };
        }
        
        agrupados[mesKey].reportes.push(reporte);
        agrupados[mesKey].barrios.add(reporte.barrio);
        agrupados[mesKey].capitanes.add(reporte.nombre_capitan);
        if (reporte.territorio) {
          agrupados[mesKey].territorios.add(reporte.territorio);
        }
      });
      
      // Convertir a formato final
      const estadisticas = Object.values(agrupados)
        .map(grupo => ({
          mes: grupo.mes,
          total_reportes: grupo.reportes.length,
          barrios_activos: grupo.barrios.size,
          capitanes_activos: grupo.capitanes.size,
          territorios_trabajados: grupo.territorios.size,
          lista_barrios: Array.from(grupo.barrios).sort()
        }))
        .sort((a, b) => new Date(b.mes) - new Date(a.mes));
      
      return estadisticas;
      
    } catch (error) {
      console.error('❌ Error en método legacy mensual:', error.message);
      throw error;
    }
  }
  
  /**
   * Actualizar reporte existente
   * @param {string} id - ID del reporte
   * @param {Object} datosActualizacion - Datos a actualizar
   * @returns {Object} Reporte actualizado
   */
  async actualizar(id, datosActualizacion) {
    try {
      console.log('📝 Actualizando reporte:', id);
      
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
        console.error('❌ Error en ReporteRepository.actualizar:', error);
        throw new Error(`Error actualizando reporte: ${error.message}`);
      }
      
      console.log('✅ Reporte actualizado exitosamente');
      return data;
      
    } catch (error) {
      console.error('❌ Error en ReporteRepository.actualizar:', error.message);
      throw error;
    }
  }
  
  /**
   * Eliminar reporte
   * @param {string} id - ID del reporte
   * @returns {boolean} True si se eliminó exitosamente
   */
  async eliminar(id) {
    try {
      console.log('🗑️ Eliminando reporte:', id);
      
      const { error } = await this.db
        .from(this.tableName)
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('❌ Error en ReporteRepository.eliminar:', error);
        throw new Error(`Error eliminando reporte: ${error.message}`);
      }
      
      console.log('✅ Reporte eliminado exitosamente');
      return true;
      
    } catch (error) {
      console.error('❌ Error en ReporteRepository.eliminar:', error.message);
      throw error;
    }
  }
  
  /**
   * Contar reportes por barrio
   * @param {string} barrio - Nombre del barrio
   * @param {Object} opciones - Opciones de filtro
   * @returns {number} Número de reportes
   */
  async contarPorBarrio(barrio, opciones = {}) {
    try {
      const {
        fechaDesde = null,
        fechaHasta = null
      } = opciones;
      
      let query = this.db
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('barrio', barrio);
      
      if (fechaDesde) {
        query = query.gte('fecha', fechaDesde);
      }
      if (fechaHasta) {
        query = query.lte('fecha', fechaHasta);
      }
      
      const { count, error } = await query;
      
      if (error) {
        console.error('❌ Error en ReporteRepository.contarPorBarrio:', error);
        throw new Error(`Error contando reportes: ${error.message}`);
      }
      
      return count || 0;
      
    } catch (error) {
      console.error('❌ Error en ReporteRepository.contarPorBarrio:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener estadísticas de reportes con agregaciones SQL optimizadas
   * @param {Object} opciones - Opciones de consulta
   * @returns {Object} Estadísticas calculadas
   */
  async obtenerEstadisticas(opciones = {}) {
    try {
      const {
        fechaDesde = null,
        fechaHasta = null,
        barrio = null
      } = opciones;
      
      console.log('📊 Calculando estadísticas con agregaciones SQL optimizadas');
      
      // Construir filtros WHERE para la consulta SQL
      let whereClause = '';
      const params = [];
      
      if (fechaDesde || fechaHasta || barrio) {
        const conditions = [];
        
        if (fechaDesde) {
          conditions.push('fecha >= $' + (params.length + 1));
          params.push(fechaDesde);
        }
        if (fechaHasta) {
          conditions.push('fecha <= $' + (params.length + 1));
          params.push(fechaHasta);
        }
        if (barrio) {
          conditions.push('barrio = $' + (params.length + 1));
          params.push(barrio);
        }
        
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }
      
      // Consulta SQL optimizada con agregaciones nativas
      const sqlQuery = `
        SELECT 
          COUNT(*) as total_reportes,
          COUNT(DISTINCT barrio) as barrios_unicos,
          COUNT(DISTINCT nombre_capitan) as capitanes_unicos,
          MIN(fecha) as fecha_primer_reporte,
          MAX(fecha) as fecha_ultimo_reporte,
          COUNT(CASE WHEN fecha >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as reportes_ultima_semana,
          COUNT(CASE WHEN fecha >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as reportes_ultimo_mes
        FROM ${this.tableName}
        ${whereClause}
      `;
      
      const { data, error } = await this.db.rpc('execute_sql', {
        query: sqlQuery,
        params: params
      });
      
      if (error) {
        console.error('❌ Error en consulta SQL optimizada:', error);
        // Fallback a método anterior si RPC no está disponible
        return await this._obtenerEstadisticasLegacy(opciones);
      }
      
      const resultado = data && data.length > 0 ? data[0] : {};
      
      const estadisticas = {
        total_reportes: parseInt(resultado.total_reportes) || 0,
        barrios_unicos: parseInt(resultado.barrios_unicos) || 0,
        capitanes_unicos: parseInt(resultado.capitanes_unicos) || 0,
        fecha_primer_reporte: resultado.fecha_primer_reporte || null,
        fecha_ultimo_reporte: resultado.fecha_ultimo_reporte || null,
        reportes_ultima_semana: parseInt(resultado.reportes_ultima_semana) || 0,
        reportes_ultimo_mes: parseInt(resultado.reportes_ultimo_mes) || 0
      };
      
      console.log('✅ Estadísticas calculadas con SQL:', estadisticas);
      return estadisticas;
      
    } catch (error) {
      console.error('❌ Error en ReporteRepository.obtenerEstadisticas:', error.message);
      // Fallback a método legacy
      return await this._obtenerEstadisticasLegacy(opciones);
    }
  }
  
  /**
   * Método legacy para estadísticas (fallback)
   * @param {Object} opciones - Opciones de consulta
   * @returns {Object} Estadísticas calculadas
   * @private
   */
  async _obtenerEstadisticasLegacy(opciones = {}) {
    try {
      console.log('⚠️ Usando método legacy para estadísticas');
      
      const {
        fechaDesde = null,
        fechaHasta = null,
        barrio = null
      } = opciones;
      
      let query = this.db
        .from(this.tableName)
        .select('barrio, nombre_capitan, fecha');
      
      if (fechaDesde) {
        query = query.gte('fecha', fechaDesde);
      }
      if (fechaHasta) {
        query = query.lte('fecha', fechaHasta);
      }
      if (barrio) {
        query = query.eq('barrio', barrio);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Error en método legacy:', error);
        throw new Error(`Error obteniendo estadísticas: ${error.message}`);
      }
      
      // Procesar estadísticas en memoria
      const reportes = data || [];
      const ahora = new Date();
      const unaSemanaAtras = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
      const unMesAtras = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const estadisticas = {
        total_reportes: reportes.length,
        barrios_unicos: new Set(reportes.map(r => r.barrio)).size,
        capitanes_unicos: new Set(reportes.map(r => r.nombre_capitan)).size,
        fecha_primer_reporte: reportes.length > 0 
          ? Math.min(...reportes.map(r => new Date(r.fecha))) 
          : null,
        fecha_ultimo_reporte: reportes.length > 0 
          ? Math.max(...reportes.map(r => new Date(r.fecha))) 
          : null,
        reportes_ultima_semana: reportes.filter(r => new Date(r.fecha) >= unaSemanaAtras).length,
        reportes_ultimo_mes: reportes.filter(r => new Date(r.fecha) >= unMesAtras).length
      };
      
      return estadisticas;
      
    } catch (error) {
      console.error('❌ Error en método legacy:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener todos los reportes (para panel de administración)
   * @param {Object} opciones - Opciones de consulta (fechaInicio, fechaFin, limite)
   * @returns {Array} Array de todos los reportes
   */
  async obtenerTodos(opciones = {}) {
    try {
      console.log('📊 Obteniendo todos los reportes de BD');
      console.log('📊 Opciones:', opciones);
      
      let query = this.db
        .from(this.tableName)
        .select('*')
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false });
      
      // Aplicar filtros de fecha si existen
      if (opciones.fechaInicio) {
        query = query.gte('fecha', opciones.fechaInicio);
      }
      
      if (opciones.fechaFin) {
        query = query.lte('fecha', opciones.fechaFin);
      }
      
      // Aplicar límite si se especifica (por defecto 1000 para evitar sobrecarga)
      const limite = opciones.limite || 1000;
      query = query.limit(limite);
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Error en ReporteRepository.obtenerTodos:', error);
        throw new Error(`Error obteniendo reportes: ${error.message}`);
      }
      
      console.log(`✅ ${data.length} reportes obtenidos de BD`);
      return data || [];
      
    } catch (error) {
      console.error('❌ Error en ReporteRepository.obtenerTodos:', error.message);
      throw error;
    }
  }
  
  /**
   * Verificar si existe un reporte
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
        console.error('❌ Error en ReporteRepository.existe:', error);
        throw new Error(`Error verificando existencia: ${error.message}`);
      }
      
      return count > 0;
      
    } catch (error) {
      console.error('❌ Error en ReporteRepository.existe:', error.message);
      throw error;
    }
  }
}

export default ReporteRepository;