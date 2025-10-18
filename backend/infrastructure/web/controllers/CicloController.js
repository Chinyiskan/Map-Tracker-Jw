// @ts-check
// backend/infrastructure/web/controllers/CicloController.js
// Controlador web para ciclos - Adaptador HTTP

class CicloController {
  constructor(cicloService) {
    this.cicloService = cicloService;
    
    // Bind methods para mantener contexto
    this.obtenerCicloActivo = this.obtenerCicloActivo.bind(this);
    this.crearNuevoCiclo = this.crearNuevoCiclo.bind(this);
    this.obtenerProgresoCiclo = this.obtenerProgresoCiclo.bind(this);
    this.obtenerProgresoBarrio = this.obtenerProgresoBarrio.bind(this);
    this.obtenerProgresoTodos = this.obtenerProgresoTodos.bind(this);
    this.completarCiclo = this.completarCiclo.bind(this);
    this.pausarCiclo = this.pausarCiclo.bind(this);
    this.reactivarCiclo = this.reactivarCiclo.bind(this);
    this.obtenerHistorial = this.obtenerHistorial.bind(this);
    this.obtenerCiclosActivos = this.obtenerCiclosActivos.bind(this);
    this.obtenerEstadisticasGenerales = this.obtenerEstadisticasGenerales.bind(this);
    this.obtenerEstadisticasCiclos = this.obtenerEstadisticasCiclos.bind(this);
  }
  
  /**
   * Obtener ciclo activo de un barrio
   * GET /api/ciclos/barrio/:barrio/activo
   */
  async obtenerCicloActivo(req, res) {
    try {
      console.log('🔍 CicloController: GET /api/ciclos/barrio/' + req.params.barrio + '/activo');
      
      const { barrio } = req.params;
      const resultado = await this.cicloService.obtenerCicloActivo(barrio);
      
      if (resultado.success) {
        res.json({
          success: true,
          data: resultado.data
        });
      } else {
        res.status(404).json({
          success: false,
          error: resultado.error,
          message: 'Ciclo activo no encontrado'
        });
      }
      
    } catch (error) {
      console.error('❌ Error en CicloController.obtenerCicloActivo:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Crear nuevo ciclo para un barrio
   * POST /api/ciclos/barrio/:barrio
   * @param {import('express').Request<{barrio: string}, import('../../../domain/types').HttpResponse<import('../../../domain/types').CicloResumenDTO>, import('../../../domain/types').CrearCicloBody>} req
   * @param {import('express').Response<import('../../../domain/types').HttpResponse<import('../../../domain/types').CicloResumenDTO>>} res
   */
  async crearNuevoCiclo(req, res) {
    try {
      console.log('🆕 CicloController: POST /api/ciclos/barrio/' + req.params.barrio);
      
      const { barrio } = req.params;
      const opciones = {
        numeroCiclo: req.body.numeroCiclo || null
      };
      
      const resultado = await this.cicloService.crearNuevoCiclo(barrio, opciones);
      
      if (resultado.success) {
        res.status(201).json({
          success: true,
          data: resultado.data,
          message: resultado.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en CicloController.crearNuevoCiclo:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Obtener progreso detallado de un ciclo
   * GET /api/ciclos/:id/progreso
   */
  async obtenerProgresoCiclo(req, res) {
    try {
      console.log('📊 CicloController: GET /api/ciclos/' + req.params.id + '/progreso');
      
      const { id } = req.params;
      const resultado = await this.cicloService.obtenerProgresoCiclo(id);
      
      if (resultado.success) {
        res.json({
          success: true,
          data: resultado.data
        });
      } else {
        res.status(404).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en CicloController.obtenerProgresoCiclo:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Obtener progreso de un barrio específico
   * GET /api/ciclos/barrio/:barrio/progreso
   */
  async obtenerProgresoBarrio(req, res) {
    try {
      console.log('📊 CicloController: GET /api/ciclos/barrio/' + req.params.barrio + '/progreso');
      
      const { barrio } = req.params;
      const resultado = await this.cicloService.obtenerProgresoBarrio(barrio);
      
      if (resultado.success) {
        res.json({
          success: true,
          data: resultado.data
        });
      } else {
        res.status(404).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en CicloController.obtenerProgresoBarrio:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Obtener progreso de todos los barrios
   * GET /api/ciclos/progreso
   */
  async obtenerProgresoTodos(req, res) {
    try {
      console.log('📊 CicloController: GET /api/ciclos/progreso');
      
      const resultado = await this.cicloService.obtenerProgresoTodosBarrios();
      
      if (resultado.success) {
        res.json({
          success: true,
          data: resultado.data,
          total: resultado.total
        });
      } else {
        res.status(500).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en CicloController.obtenerProgresoTodos:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Completar ciclo manualmente
   * PUT /api/ciclos/:id/completar
   */
  async completarCiclo(req, res) {
    try {
      console.log('🎉 CicloController: PUT /api/ciclos/' + req.params.id + '/completar');
      
      const { id } = req.params;
      const opciones = {
        fechaFin: req.body.fechaFin || null
      };
      
      const resultado = await this.cicloService.completarCiclo(id, opciones);
      
      if (resultado.success) {
        res.json({
          success: true,
          data: resultado.data,
          message: resultado.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en CicloController.completarCiclo:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Pausar ciclo
   * PUT /api/ciclos/:id/pausar
   */
  async pausarCiclo(req, res) {
    try {
      console.log('⏸️ CicloController: PUT /api/ciclos/' + req.params.id + '/pausar');
      
      const { id } = req.params;
      const resultado = await this.cicloService.pausarCiclo(id);
      
      if (resultado.success) {
        res.json({
          success: true,
          data: resultado.data,
          message: resultado.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en CicloController.pausarCiclo:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Reactivar ciclo pausado
   * PUT /api/ciclos/:id/reactivar
   */
  async reactivarCiclo(req, res) {
    try {
      console.log('▶️ CicloController: PUT /api/ciclos/' + req.params.id + '/reactivar');
      
      const { id } = req.params;
      const resultado = await this.cicloService.reactivarCiclo(id);
      
      if (resultado.success) {
        res.json({
          success: true,
          data: resultado.data,
          message: resultado.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en CicloController.reactivarCiclo:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Obtener historial de ciclos de un barrio
   * GET /api/ciclos/barrio/:barrio/historial
   */
  async obtenerHistorial(req, res) {
    try {
      console.log('📚 CicloController: GET /api/ciclos/barrio/' + req.params.barrio + '/historial');
      
      const { barrio } = req.params;
      const opciones = {
        limite: parseInt(req.query.limite) || 50,
        estado: req.query.estado || null,
        orden: req.query.orden || 'desc'
      };
      
      const resultado = await this.cicloService.obtenerHistorialCiclos(barrio, opciones);
      
      if (resultado.success) {
        res.json({
          success: true,
          data: resultado.data,
          total: resultado.total,
          barrio: resultado.barrio
        });
      } else {
        res.status(404).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en CicloController.obtenerHistorial:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Obtener todos los ciclos activos
   * GET /api/ciclos/activos
   */
  async obtenerCiclosActivos(req, res) {
    try {
      console.log('🔄 CicloController: GET /api/ciclos/activos');
      
      const resultado = await this.cicloService.obtenerCiclosActivos();
      
      if (resultado.success) {
        res.json({
          success: true,
          data: resultado.data,
          total: resultado.total
        });
      } else {
        res.status(500).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en CicloController.obtenerCiclosActivos:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Obtener estadísticas generales del sistema
   * GET /api/ciclos/estadisticas/generales
   */
  async obtenerEstadisticasGenerales(req, res) {
    try {
      console.log('📊 CicloController: GET /api/ciclos/estadisticas/generales');
      
      const resultado = await this.cicloService.obtenerEstadisticasGenerales();
      
      if (resultado.success) {
        res.json({
          success: true,
          data: resultado.data
        });
      } else {
        res.status(500).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en CicloController.obtenerEstadisticasGenerales:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Obtener estadísticas de ciclos
   * GET /api/ciclos/estadisticas
   */
  async obtenerEstadisticasCiclos(req, res) {
    try {
      console.log('📊 CicloController: GET /api/ciclos/estadisticas');
      
      const opciones = {
        barrio: req.query.barrio || null,
        estado: req.query.estado || null
      };
      
      const resultado = await this.cicloService.obtenerEstadisticasCiclos(opciones);
      
      if (resultado.success) {
        res.json({
          success: true,
          data: resultado.data,
          opciones: opciones
        });
      } else {
        res.status(500).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en CicloController.obtenerEstadisticasCiclos:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Health check para ciclos
   * GET /api/ciclos/health
   */
  async healthCheck(req, res) {
    try {
      console.log('🏥 CicloController: GET /api/ciclos/health');
      
      // Verificar que el servicio esté funcionando
      const resultado = await this.cicloService.obtenerCiclosActivos();
      
      res.json({
        success: true,
        status: 'healthy',
        service: 'CicloService',
        timestamp: new Date().toISOString(),
        data: {
          service_available: resultado.success,
          total_ciclos_activos: resultado.success ? resultado.total : 0
        }
      });
      
    } catch (error) {
      console.error('❌ Error en CicloController.healthCheck:', error);
      res.status(500).json({
        success: false,
        status: 'unhealthy',
        service: 'CicloService',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

export default CicloController;