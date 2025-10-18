// @ts-check
// backend/infrastructure/web/controllers/ManzanasController.js
// Controlador para gestión de manzanas y auto-detección

class ManzanasController {
  constructor(manzanasRepository) {
    this.manzanasRepository = manzanasRepository;
    
    // Bind methods para mantener contexto
    this.obtenerResumen = this.obtenerResumen.bind(this);
    this.obtenerEstadisticas = this.obtenerEstadisticas.bind(this);
    this.inicializarAutoDescubrimiento = this.inicializarAutoDescubrimiento.bind(this);
    this.obtenerManzanasBarrio = this.obtenerManzanasBarrio.bind(this);
    this.healthCheck = this.healthCheck.bind(this);
  }
  
  /**
   * Obtener resumen de manzanas por barrio
   * GET /api/manzanas/resumen
   */
  async obtenerResumen(req, res) {
    try {
      console.log('📊 ManzanasController: GET /api/manzanas/resumen');
      
      const resumen = await this.manzanasRepository.obtenerResumenTodosBarrios();
      
      res.json({
        success: true,
        data: resumen,
        total_barrios: Object.keys(resumen).length
      });
      
    } catch (error) {
      console.error('❌ Error en ManzanasController.obtenerResumen:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Obtener estadísticas de auto-detección
   * GET /api/manzanas/estadisticas
   */
  async obtenerEstadisticas(req, res) {
    try {
      console.log('📈 ManzanasController: GET /api/manzanas/estadisticas');
      
      const estadisticas = await this.manzanasRepository.obtenerEstadisticasAutoDescubrimiento();
      const tieneTabla = await this.manzanasRepository.verificarTablaReferencia();
      
      res.json({
        success: true,
        data: {
          ...estadisticas,
          tabla_inicializada: tieneTabla,
          estado_sistema: tieneTabla ? 'activo' : 'requiere_inicializacion'
        }
      });
      
    } catch (error) {
      console.error('❌ Error en ManzanasController.obtenerEstadisticas:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Inicializar auto-descubrimiento masivo
   * POST /api/manzanas/inicializar
   */
  async inicializarAutoDescubrimiento(req, res) {
    try {
      console.log('🚀 ManzanasController: POST /api/manzanas/inicializar');
      
      const exito = await this.manzanasRepository.inicializarAutoDescubrimientoMasivo();
      
      if (exito) {
        // Obtener estadísticas después de la inicialización
        const estadisticas = await this.manzanasRepository.obtenerEstadisticasAutoDescubrimiento();
        
        res.json({
          success: true,
          message: 'Auto-descubrimiento masivo completado exitosamente',
          data: estadisticas
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Error durante el auto-descubrimiento masivo'
        });
      }
      
    } catch (error) {
      console.error('❌ Error en ManzanasController.inicializarAutoDescubrimiento:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Obtener manzanas específicas de un barrio
   * GET /api/manzanas/barrio/:barrio
   */
  async obtenerManzanasBarrio(req, res) {
    try {
      const { barrio } = req.params;
      console.log(`🔍 ManzanasController: GET /api/manzanas/barrio/${barrio}`);
      
      const manzanas = await this.manzanasRepository.obtenerManzanasDeBarrio(barrio);
      const total = await this.manzanasRepository.obtenerTotalManzanasPorBarrio(barrio);
      
      res.json({
        success: true,
        data: {
          barrio: barrio,
          total_manzanas: total,
          manzanas: manzanas
        }
      });
      
    } catch (error) {
      console.error('❌ Error en ManzanasController.obtenerManzanasBarrio:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Health check del servicio de manzanas
   * GET /api/manzanas/health
   */
  async healthCheck(req, res) {
    try {
      const tieneTabla = await this.manzanasRepository.verificarTablaReferencia();
      const estadisticas = await this.manzanasRepository.obtenerEstadisticasAutoDescubrimiento();
      
      res.json({
        success: true,
        service: 'ManzanasService',
        status: tieneTabla ? 'healthy' : 'needs_initialization',
        data: {
          tabla_inicializada: tieneTabla,
          total_manzanas: estadisticas.total_manzanas,
          total_barrios: estadisticas.total_barrios,
          porcentaje_auto_descubiertas: estadisticas.porcentaje_auto
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error en ManzanasController.healthCheck:', error);
      res.status(503).json({
        success: false,
        service: 'ManzanasService',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

export default ManzanasController;