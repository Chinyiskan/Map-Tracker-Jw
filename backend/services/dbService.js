// backend/services/dbService.js
// Servicio de base de datos con operaciones CRUD

import { supabase } from '../config/db.js';

/**
 * Servicio de base de datos para operaciones CRUD
 * Maneja las tablas: reportes, salidas_predicacion, capitanes
 */
export class DbService {
  
  // ==========================================
  // OPERACIONES PARA REPORTES
  // ==========================================
  
  /**
   * Obtener todos los reportes
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Array>} Lista de reportes
   */
  static async getReportes(filters = {}) {
    try {
      let query = supabase
        .from('reportes')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Aplicar filtros si existen
      if (filters.barrio) {
        query = query.eq('barrio', filters.barrio);
      }
      
      if (filters.fecha_inicio && filters.fecha_fin) {
        query = query
          .gte('fecha', filters.fecha_inicio)
          .lte('fecha', filters.fecha_fin);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Error al obtener reportes: ${error.message}`);
      }
      
      return data || [];
    } catch (err) {
      console.error('❌ DbService.getReportes:', err.message);
      throw err;
    }
  }
  
  /**
   * Crear un nuevo reporte
   * @param {Object} reporteData - Datos del reporte
   * @returns {Promise<Object>} Reporte creado
   */
  static async createReporte(reporteData) {
    try {
      const { data, error } = await supabase
        .from('reportes')
        .insert([reporteData])
        .select()
        .single();
      
      if (error) {
        throw new Error(`Error al crear reporte: ${error.message}`);
      }
      
      return data;
    } catch (err) {
      console.error('❌ DbService.createReporte:', err.message);
      throw err;
    }
  }
  
  /**
   * Actualizar un reporte existente
   * @param {number} id - ID del reporte
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} Reporte actualizado
   */
  static async updateReporte(id, updateData) {
    try {
      const { data, error } = await supabase
        .from('reportes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Error al actualizar reporte: ${error.message}`);
      }
      
      return data;
    } catch (err) {
      console.error('❌ DbService.updateReporte:', err.message);
      throw err;
    }
  }
  
  /**
   * Eliminar un reporte
   * @param {number} id - ID del reporte
   * @returns {Promise<boolean>} Éxito de la operación
   */
  static async deleteReporte(id) {
    try {
      const { error } = await supabase
        .from('reportes')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Error al eliminar reporte: ${error.message}`);
      }
      
      return true;
    } catch (err) {
      console.error('❌ DbService.deleteReporte:', err.message);
      throw err;
    }
  }
  
  // ==========================================
  // OPERACIONES PARA SALIDAS DE PREDICACIÓN
  // ==========================================
  
  /**
   * Obtener todas las salidas de predicación
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Array>} Lista de salidas
   */
  static async getSalidas(filters = {}) {
    try {
      let query = supabase
        .from('salidas_predicacion')
        .select(`
          *,
          capitanes (
            id,
            nombre,
            apellido,
            telefono
          )
        `)
        .order('created_at', { ascending: false });
      
      // Aplicar filtros si existen
      if (filters.capitan_id) {
        query = query.eq('capitan_id', filters.capitan_id);
      }
      
      if (filters.barrio_asignado) {
        query = query.eq('barrio_asignado', filters.barrio_asignado);
      }
      
      if (filters.dia_semana) {
        query = query.eq('dia_semana', filters.dia_semana);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Error al obtener salidas: ${error.message}`);
      }
      
      return data || [];
    } catch (err) {
      console.error('❌ DbService.getSalidas:', err.message);
      throw err;
    }
  }
  
  /**
   * Crear una nueva salida de predicación
   * @param {Object} salidaData - Datos de la salida
   * @returns {Promise<Object>} Salida creada
   */
  static async createSalida(salidaData) {
    try {
      const { data, error } = await supabase
        .from('salidas_predicacion')
        .insert([salidaData])
        .select(`
          *,
          capitanes (
            id,
            nombre,
            apellido,
            telefono
          )
        `)
        .single();
      
      if (error) {
        throw new Error(`Error al crear salida: ${error.message}`);
      }
      
      return data;
    } catch (err) {
      console.error('❌ DbService.createSalida:', err.message);
      throw err;
    }
  }
  
  /**
   * Actualizar una salida existente
   * @param {number} id - ID de la salida
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} Salida actualizada
   */
  static async updateSalida(id, updateData) {
    try {
      const { data, error } = await supabase
        .from('salidas_predicacion')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          capitanes (
            id,
            nombre,
            apellido,
            telefono
          )
        `)
        .single();
      
      if (error) {
        throw new Error(`Error al actualizar salida: ${error.message}`);
      }
      
      return data;
    } catch (err) {
      console.error('❌ DbService.updateSalida:', err.message);
      throw err;
    }
  }
  
  /**
   * Eliminar una salida
   * @param {number} id - ID de la salida
   * @returns {Promise<boolean>} Éxito de la operación
   */
  static async deleteSalida(id) {
    try {
      const { error } = await supabase
        .from('salidas_predicacion')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Error al eliminar salida: ${error.message}`);
      }
      
      return true;
    } catch (err) {
      console.error('❌ DbService.deleteSalida:', err.message);
      throw err;
    }
  }
  
  // ==========================================
  // OPERACIONES PARA CAPITANES
  // ==========================================
  
  /**
   * Obtener todos los capitanes
   * @returns {Promise<Array>} Lista de capitanes
   */
  static async getCapitanes() {
    try {
      const { data, error } = await supabase
        .from('capitanes')
        .select('*')
        .order('nombre', { ascending: true });
      
      if (error) {
        throw new Error(`Error al obtener capitanes: ${error.message}`);
      }
      
      return data || [];
    } catch (err) {
      console.error('❌ DbService.getCapitanes:', err.message);
      throw err;
    }
  }
  
  /**
   * Crear un nuevo capitán
   * @param {Object} capitanData - Datos del capitán
   * @returns {Promise<Object>} Capitán creado
   */
  static async createCapitan(capitanData) {
    try {
      const { data, error } = await supabase
        .from('capitanes')
        .insert([capitanData])
        .select()
        .single();
      
      if (error) {
        throw new Error(`Error al crear capitán: ${error.message}`);
      }
      
      return data;
    } catch (err) {
      console.error('❌ DbService.createCapitan:', err.message);
      throw err;
    }
  }
  
  // ==========================================
  // OPERACIONES GENERALES
  // ==========================================
  
  /**
   * Obtener estadísticas generales
   * @returns {Promise<Object>} Estadísticas
   */
  static async getEstadisticas() {
    try {
      const [reportes, salidas, capitanes] = await Promise.all([
        supabase.from('reportes').select('count', { count: 'exact', head: true }),
        supabase.from('salidas_predicacion').select('count', { count: 'exact', head: true }),
        supabase.from('capitanes').select('count', { count: 'exact', head: true })
      ]);
      
      return {
        totalReportes: reportes.count || 0,
        totalSalidas: salidas.count || 0,
        totalCapitanes: capitanes.count || 0
      };
    } catch (err) {
      console.error('❌ DbService.getEstadisticas:', err.message);
      throw err;
    }
  }
}

// Exportar por defecto
export default DbService;