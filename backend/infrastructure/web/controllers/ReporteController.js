// @ts-check
// backend/infrastructure/web/controllers/ReporteController.js
// Controlador web para reportes - Adaptador HTTP

class ReporteController {
  constructor(reporteService) {
    this.reporteService = reporteService;
    
    // Bind methods para mantener contexto
    this.crear = this.crear.bind(this);
    this.obtenerPorBarrio = this.obtenerPorBarrio.bind(this);
    this.obtenerPorId = this.obtenerPorId.bind(this);
    this.obtenerPorCapitan = this.obtenerPorCapitan.bind(this);
    this.obtenerPorRango = this.obtenerPorRango.bind(this);
    this.actualizar = this.actualizar.bind(this);
    this.eliminar = this.eliminar.bind(this);
    this.obtenerEstadisticas = this.obtenerEstadisticas.bind(this);
    this.validarDatos = this.validarDatos.bind(this);
    this.contarPorBarrio = this.contarPorBarrio.bind(this);
  }
  
  /**
   * Crear nuevo reporte
   * POST /api/reportes
   * @param {import('express').Request<{}, import('../../../domain/types').HttpResponse<import('../../../domain/types').ReporteDTO>, import('../../../domain/types').CrearReporteBody>} req
   * @param {import('express').Response<import('../../../domain/types').HttpResponse<import('../../../domain/types').ReporteDTO>>} res
   */
  async crear(req, res) {
    try {
      console.log('📝 ReporteController: POST /api/reportes');
      console.log('📝 Body recibido:', req.body);
      
      const resultado = await this.reporteService.crearReporte(req.body);
      
      if (resultado.success) {
        res.status(201).json({
          success: true,
          data: resultado.data,
          message: resultado.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: resultado.error,
          message: 'Error creando reporte'
        });
      }
      
    } catch (error) {
      console.error('❌ Error en ReporteController.crear:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'Error procesando la solicitud'
      });
    }
  }
  
  /**
   * Obtener reportes por barrio
   * GET /api/reportes/barrio/:barrio
   * @param {import('express').Request<{barrio: string}, import('../../../domain/types').HttpResponse<import('../../../domain/types').ReporteDTO[]>>} req
   * @param {import('express').Response<import('../../../domain/types').HttpResponse<import('../../../domain/types').ReporteDTO[]>>} res
   */
  async obtenerPorBarrio(req, res) {
    try {
      console.log('📊 ReporteController: GET /api/reportes/barrio/' + req.params.barrio);
      
      const { barrio } = req.params;
      const opciones = {
        limite: parseInt(String(req.query.limite)) || 100,
        orden: req.query.orden || 'desc',
        fechaDesde: req.query.fechaDesde || null,
        fechaHasta: req.query.fechaHasta || null
      };
      
      const resultado = await this.reporteService.obtenerReportesPorBarrio(barrio, opciones);
      
      if (resultado.success) {
        res.json({
          success: true,
          data: resultado.data,
          total: resultado.total,
          barrio: resultado.barrio,
          opciones: opciones
        });
      } else {
        res.status(404).json({
          success: false,
          error: resultado.error,
          message: 'Error obteniendo reportes'
        });
      }
      
    } catch (error) {
      console.error('❌ Error en ReporteController.obtenerPorBarrio:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Obtener reporte por ID
   * GET /api/reportes/:id
   */
  async obtenerPorId(req, res) {
    try {
      console.log('🔍 ReporteController: GET /api/reportes/' + req.params.id);
      
      const { id } = req.params;
      const resultado = await this.reporteService.obtenerReportePorId(id);
      
      if (resultado.success) {
        res.json({
          success: true,
          data: resultado.data
        });
      } else {
        res.status(404).json({
          success: false,
          error: resultado.error,
          message: 'Reporte no encontrado'
        });
      }
      
    } catch (error) {
      console.error('❌ Error en ReporteController.obtenerPorId:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Obtener reportes por capitán
   * GET /api/reportes/capitan/:nombre
   */
  async obtenerPorCapitan(req, res) {
    try {
      console.log('👤 ReporteController: GET /api/reportes/capitan/' + req.params.nombre);
      
      const { nombre } = req.params;
      const opciones = {
        limite: parseInt(req.query.limite) || 50,
        fechaDesde: req.query.fechaDesde || null,
        fechaHasta: req.query.fechaHasta || null
      };
      
      const resultado = await this.reporteService.obtenerReportesPorCapitan(
        decodeURIComponent(nombre),
        opciones
      );
      
      if (resultado.success) {
        res.json({
          success: true,
          data: resultado.data,
          total: resultado.total,
          capitan: resultado.capitan
        });
      } else {
        res.status(404).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en ReporteController.obtenerPorCapitan:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Obtener reportes por rango de fechas
   * GET /api/reportes/rango
   */
  async obtenerPorRango(req, res) {
    try {
      console.log('📅 ReporteController: GET /api/reportes/rango');
      
      const { fechaInicio, fechaFin } = req.query;
      
      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({
          success: false,
          error: 'fechaInicio y fechaFin son requeridos',
          message: 'Parámetros faltantes'
        });
      }
      
      const opciones = {
        barrio: req.query.barrio || null,
        limite: parseInt(req.query.limite) || 200
      };
      
      const resultado = await this.reporteService.obtenerReportesPorRango(
        fechaInicio,
        fechaFin,
        opciones
      );
      
      if (resultado.success) {
        res.json({
          success: true,
          data: resultado.data,
          total: resultado.total,
          rango: resultado.rango
        });
      } else {
        res.status(400).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en ReporteController.obtenerPorRango:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Actualizar reporte existente
   * PUT /api/reportes/:id
   * @param {import('express').Request<{id: string}, import('../../../domain/types').HttpResponse<import('../../../domain/types').ReporteDTO>, Partial<import('../../../domain/types').CrearReporteBody>>} req
   * @param {import('express').Response<import('../../../domain/types').HttpResponse<import('../../../domain/types').ReporteDTO>>} res
   */
  async actualizar(req, res) {
    try {
      console.log('📝 ReporteController: PUT /api/reportes/' + req.params.id);
      
      const { id } = req.params;
      const resultado = await this.reporteService.actualizarReporte(id, req.body);
      
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
      console.error('❌ Error en ReporteController.actualizar:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Eliminar reporte
   * DELETE /api/reportes/:id
   */
  async eliminar(req, res) {
    try {
      console.log('🗑️ ReporteController: DELETE /api/reportes/' + req.params.id);
      
      const { id } = req.params;
      const resultado = await this.reporteService.eliminarReporte(id);
      
      if (resultado.success) {
        res.json({
          success: true,
          data: resultado.data,
          message: resultado.message
        });
      } else {
        res.status(404).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en ReporteController.eliminar:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Obtener estadísticas de reportes
   * GET /api/reportes/estadisticas
   */
  async obtenerEstadisticas(req, res) {
    try {
      console.log('📊 ReporteController: GET /api/reportes/estadisticas');
      
      const opciones = {
        fechaDesde: req.query.fechaDesde || null,
        fechaHasta: req.query.fechaHasta || null,
        barrio: req.query.barrio || null
      };
      
      const resultado = await this.reporteService.obtenerEstadisticas(opciones);
      
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
      console.error('❌ Error en ReporteController.obtenerEstadisticas:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Validar datos de reporte
   * POST /api/reportes/validar
   */
  async validarDatos(req, res) {
    try {
      console.log('✅ ReporteController: POST /api/reportes/validar');
      
      const resultado = await this.reporteService.validarDatosReporte(req.body);
      
      res.json({
        success: true,
        data: resultado.data
      });
      
    } catch (error) {
      console.error('❌ Error en ReporteController.validarDatos:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Contar reportes por barrio
   * GET /api/reportes/barrio/:barrio/count
   */
  async contarPorBarrio(req, res) {
    try {
      console.log('🔢 ReporteController: GET /api/reportes/barrio/' + req.params.barrio + '/count');
      
      const { barrio } = req.params;
      const opciones = {
        fechaDesde: req.query.fechaDesde || null,
        fechaHasta: req.query.fechaHasta || null
      };
      
      const resultado = await this.reporteService.contarReportesPorBarrio(barrio, opciones);
      
      if (resultado.success) {
        res.json({
          success: true,
          data: resultado.data
        });
      } else {
        res.status(400).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en ReporteController.contarPorBarrio:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * Obtener todos los reportes (con paginación)
   * GET /api/reportes
   */
  async obtenerTodos(req, res) {
    try {
      console.log('📋 ReporteController: GET /api/reportes');
      console.log('📋 Query params:', req.query);
      
      // Para compatibilidad con el frontend existente
      const { barrio, fecha_inicio, fecha_fin, start_date, end_date } = req.query;
      
      if (barrio) {
        // Redirigir a obtenerPorBarrio si se especifica barrio
        req.params.barrio = barrio;
        return this.obtenerPorBarrio(req, res);
      }
      
      // Obtener todos los reportes (para panel de administración)
      console.log('📊 ReporteService: Obteniendo todos los reportes');
      
      // Preparar filtros de fecha si existen
      const filtros = {};
      if (fecha_inicio || start_date) {
        filtros.fecha_inicio = fecha_inicio || start_date;
      }
      if (fecha_fin || end_date) {
        filtros.fecha_fin = fecha_fin || end_date;
      }
      
      const resultado = await this.reporteService.obtenerTodosLosReportes(filtros);
      
      if (resultado.success) {
        res.json({
          success: true,
          data: resultado.data,
          total: resultado.data.length
        });
      } else {
        res.status(400).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en ReporteController.obtenerTodos:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
}

export default ReporteController;