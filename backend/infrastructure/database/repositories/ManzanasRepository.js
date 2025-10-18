// backend/infrastructure/database/repositories/ManzanasRepository.js
// Repositorio para gestión de manzanas de barrios con auto-detección

/**
 * @implements {import('../../../domain/types/repositories').IManzanasRepository}
 */
class ManzanasRepository {
  constructor(dbService) {
    this.db = dbService;
  }

  /**
   * Obtener total de manzanas por barrio desde la tabla de referencia
   * @param {string} barrio - Nombre del barrio
   * @returns {Promise<number>} Total de manzanas
   */
  async obtenerTotalManzanasPorBarrio(barrio) {
    try {
      const query = `
        SELECT COUNT(*) as total
        FROM manzanas_barrio_referencia 
        WHERE barrio = $1 AND es_valida = true
      `;
      
      const result = await this.db.query(query, [barrio]);
      const total = parseInt(result.rows[0]?.total || 0);
      
      console.log(`📍 ManzanasRepository: ${barrio} tiene ${total} manzanas en BD`);
      return total;
    } catch (error) {
      console.error(`❌ Error obteniendo manzanas de ${barrio}:`, error.message);
      return 0;
    }
  }

  /**
   * Obtener resumen de todos los barrios
   * @returns {Promise<Object>} Resumen por barrio
   */
  async obtenerResumenTodosBarrios() {
    try {
      const query = `SELECT * FROM resumen_manzanas_por_barrio`;
      const result = await this.db.query(query);
      
      // Convertir a objeto para fácil acceso
      const resumen = {};
      result.rows.forEach(row => {
        resumen[row.barrio] = {
          total: parseInt(row.total_manzanas_descubiertas),
          auto_descubiertas: parseInt(row.manzanas_auto_descubiertas),
          manuales: parseInt(row.manzanas_manuales),
          primera_manzana: row.primera_manzana,
          ultima_manzana: row.ultima_manzana
        };
      });
      
      console.log(`📊 ManzanasRepository: Resumen cargado para ${Object.keys(resumen).length} barrios`);
      return resumen;
    } catch (error) {
      console.error('❌ Error obteniendo resumen de manzanas:', error.message);
      return {};
    }
  }

  /**
   * Obtener manzanas específicas de un barrio
   * @param {string} barrio - Nombre del barrio
   * @returns {Promise<Array>} Lista de manzanas
   */
  async obtenerManzanasDeBarrio(barrio) {
    try {
      const query = `
        SELECT manzana, auto_descubierta, created_at
        FROM manzanas_barrio_referencia 
        WHERE barrio = $1 AND es_valida = true
        ORDER BY manzana
      `;
      
      const result = await this.db.query(query, [barrio]);
      return result.rows;
    } catch (error) {
      console.error(`❌ Error obteniendo manzanas específicas de ${barrio}:`, error.message);
      return [];
    }
  }

  /**
   * Inicializar auto-descubrimiento masivo (solo para setup inicial)
   * @returns {Promise<boolean>} Éxito de la operación
   */
  async inicializarAutoDescubrimientoMasivo() {
    try {
      console.log('🔄 Iniciando auto-descubrimiento masivo de manzanas...');
      
      const query = `SELECT auto_descubrir_manzanas_barrio_masivo()`;
      await this.db.query(query);
      
      console.log('✅ Auto-descubrimiento masivo completado');
      return true;
    } catch (error) {
      console.error('❌ Error en auto-descubrimiento masivo:', error.message);
      return false;
    }
  }

  /**
   * Verificar si existe la tabla de referencia y tiene datos
   * @returns {Promise<boolean>} True si la tabla existe y tiene datos
   */
  async verificarTablaReferencia() {
    try {
      const query = `
        SELECT COUNT(*) as total
        FROM manzanas_barrio_referencia
        WHERE es_valida = true
      `;
      
      const result = await this.db.query(query);
      const total = parseInt(result.rows[0]?.total || 0);
      
      console.log(`🔍 Tabla manzanas_barrio_referencia tiene ${total} registros válidos`);
      return total > 0;
    } catch (error) {
      console.error('❌ Error verificando tabla de referencia:', error.message);
      return false;
    }
  }

  /**
   * Obtener estadísticas de auto-descubrimiento
   * @returns {Promise<Object>} Estadísticas generales
   */
  async obtenerEstadisticasAutoDescubrimiento() {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT barrio) as total_barrios,
          COUNT(*) as total_manzanas,
          COUNT(*) FILTER (WHERE auto_descubierta = true) as auto_descubiertas,
          COUNT(*) FILTER (WHERE auto_descubierta = false) as manuales,
          MIN(created_at) as primera_deteccion,
          MAX(created_at) as ultima_deteccion
        FROM manzanas_barrio_referencia
        WHERE es_valida = true
      `;
      
      const result = await this.db.query(query);
      const stats = result.rows[0];
      
      return {
        total_barrios: parseInt(stats.total_barrios || 0),
        total_manzanas: parseInt(stats.total_manzanas || 0),
        auto_descubiertas: parseInt(stats.auto_descubiertas || 0),
        manuales: parseInt(stats.manuales || 0),
        primera_deteccion: stats.primera_deteccion,
        ultima_deteccion: stats.ultima_deteccion,
        porcentaje_auto: stats.total_manzanas > 0 
          ? Math.round((stats.auto_descubiertas / stats.total_manzanas) * 100) 
          : 0
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error.message);
      return {
        total_barrios: 0,
        total_manzanas: 0,
        auto_descubiertas: 0,
        manuales: 0,
        porcentaje_auto: 0
      };
    }
  }
}

export default ManzanasRepository;