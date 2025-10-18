// @ts-check
// backend/infrastructure/web/controllers/SalidaController.js
// Controlador HTTP para Salidas - Clean Architecture

/**
 * Controlador de Salidas - Adaptador HTTP
 * Maneja las peticiones HTTP y delega la lógica de negocio al servicio
 */
export class SalidaController {
  /**
   * Constructor del controlador
   * @param {any} salidaService - Servicio de salidas
   */
  constructor(salidaService) {
    this.salidaService = salidaService;
  }

  /**
   * Obtener todas las salidas
   * GET /api/salidas
   */
  async getAllSalidas(req, res) {
    try {
      console.log('🌐 SalidaController: GET /api/salidas');
      
      // Extraer filtros de query parameters
      const filters = {
        capitan_id: req.query.capitan_id,
        barrio_asignado: req.query.barrio_asignado,
        dia_semana: req.query.dia_semana,
        estado: req.query.estado
      };
      
      // Delegar al servicio
      const resultado = await this.salidaService.getAllSalidas(filters);
      
      if (resultado.success) {
        res.status(200).json({
          success: true,
          data: resultado.data,
          count: resultado.metadata.total,
          filters: resultado.metadata.filters,
          distribution: resultado.metadata.distribution
        });
      } else {
        res.status(500).json({
          success: false,
          error: resultado.error,
          data: []
        });
      }
      
    } catch (error) {
      console.error('❌ Error en SalidaController.getAllSalidas:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  /**
   * Obtener una salida por ID
   * GET /api/salidas/:id
   */
  async getSalidaById(req, res) {
    try {
      console.log('🌐 SalidaController: GET /api/salidas/:id');
      
      const { id } = req.params;
      
      // Delegar al servicio
      const resultado = await this.salidaService.getSalidaById(id);
      
      if (resultado.success) {
        res.status(200).json({
          success: true,
          data: resultado.data
        });
      } else {
        const statusCode = resultado.error === 'Salida no encontrada' ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en SalidaController.getSalidaById:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  /**
   * Crear una nueva salida
   * POST /api/salidas
   * @param {import('express').Request<{}, import('../../../domain/types').HttpResponse<import('../../../domain/types').SalidaDTO>, import('../../../domain/types').CrearSalidaBody>} req
   * @param {import('express').Response<import('../../../domain/types').HttpResponse<import('../../../domain/types').SalidaDTO>>} res
   */
  async createSalida(req, res) {
    try {
      console.log('🌐 SalidaController: POST /api/salidas');
      
      const salidaData = req.body;
      
      // Validar que se envió data
      if (!salidaData || Object.keys(salidaData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Datos de salida son requeridos'
        });
      }
      
      // Delegar al servicio
      const resultado = await this.salidaService.createSalida(salidaData);
      
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
      console.error('❌ Error en SalidaController.createSalida:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  /**
   * Actualizar una salida existente
   * PUT /api/salidas/:id
   */
  async updateSalida(req, res) {
    try {
      console.log('🌐 SalidaController: PUT /api/salidas/:id');
      
      const { id } = req.params;
      const updateData = req.body;
      
      // Validar que se envió data
      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Datos de actualización son requeridos'
        });
      }
      
      // Delegar al servicio
      const resultado = await this.salidaService.updateSalida(id, updateData);
      
      if (resultado.success) {
        res.status(200).json({
          success: true,
          data: resultado.data,
          message: resultado.message
        });
      } else {
        const statusCode = resultado.error.includes('no encontrada') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en SalidaController.updateSalida:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  /**
   * Eliminar una salida
   * DELETE /api/salidas/:id
   */
  async deleteSalida(req, res) {
    try {
      console.log('🌐 SalidaController: DELETE /api/salidas/:id');
      
      const { id } = req.params;
      
      // Delegar al servicio
      const resultado = await this.salidaService.deleteSalida(id);
      
      if (resultado.success) {
        res.status(200).json({
          success: true,
          message: resultado.message
        });
      } else {
        const statusCode = resultado.error.includes('no encontrada') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en SalidaController.deleteSalida:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  /**
   * Obtener salidas por capitán
   * GET /api/salidas/capitan/:capitanId
   */
  async getSalidasByCapitan(req, res) {
    try {
      console.log('🌐 SalidaController: GET /api/salidas/capitan/:capitanId');
      
      const { capitanId } = req.params;
      
      // Delegar al servicio
      const resultado = await this.salidaService.getSalidasByCapitan(capitanId);
      
      if (resultado.success) {
        res.status(200).json({
          success: true,
          data: resultado.data,
          metadata: resultado.metadata
        });
      } else {
        res.status(400).json({
          success: false,
          error: resultado.error,
          data: []
        });
      }
      
    } catch (error) {
      console.error('❌ Error en SalidaController.getSalidasByCapitan:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de salidas
   * GET /api/salidas/stats
   */
  async getStats(req, res) {
    try {
      console.log('🌐 SalidaController: GET /api/salidas/stats');
      
      // Delegar al servicio
      const resultado = await this.salidaService.getStats();
      
      if (resultado.success) {
        res.status(200).json({
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
      console.error('❌ Error en SalidaController.getStats:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  /**
   * Cambiar estado de una salida
   * PATCH /api/salidas/:id/status
   */
  async changeStatus(req, res) {
    try {
      console.log('🌐 SalidaController: PATCH /api/salidas/:id/status');
      
      const { id } = req.params;
      const { estado } = req.body;
      
      if (!estado) {
        return res.status(400).json({
          success: false,
          error: 'El nuevo estado es requerido'
        });
      }
      
      // Delegar al servicio
      const resultado = await this.salidaService.changeStatus(id, estado);
      
      if (resultado.success) {
        res.status(200).json({
          success: true,
          data: resultado.data,
          message: resultado.message
        });
      } else {
        const statusCode = resultado.error.includes('no encontrada') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en SalidaController.changeStatus:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  /**
   * Obtener salidas por barrio
   * GET /api/salidas/barrio/:barrio
   */
  async getSalidasByBarrio(req, res) {
    try {
      console.log('🌐 SalidaController: GET /api/salidas/barrio/:barrio');
      
      const { barrio } = req.params;
      
      // Usar el filtro en getAllSalidas
      const filters = { barrio_asignado: decodeURIComponent(barrio) };
      const resultado = await this.salidaService.getAllSalidas(filters);
      
      if (resultado.success) {
        res.status(200).json({
          success: true,
          data: resultado.data,
          metadata: {
            barrio: filters.barrio_asignado,
            total: resultado.metadata.total
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: resultado.error,
          data: []
        });
      }
      
    } catch (error) {
      console.error('❌ Error en SalidaController.getSalidasByBarrio:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  /**
   * Validar datos de salida (endpoint de utilidad)
   * POST /api/salidas/validate
   */
  async validateSalidaData(req, res) {
    try {
      console.log('🌐 SalidaController: POST /api/salidas/validate');
      
      const salidaData = req.body;
      
      if (!salidaData || Object.keys(salidaData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Datos de salida son requeridos para validación'
        });
      }
      
      try {
        // Crear entidad temporal para validación
        const salida = new (await import('../../../domain/entities/Salida.js')).Salida(salidaData);
        salida.validate();
        
        res.status(200).json({
          success: true,
          message: 'Datos de salida válidos',
          data: salida.toPlainObject()
        });
        
      } catch (validationError) {
        res.status(400).json({
          success: false,
          error: 'Datos de salida inválidos',
          details: validationError.message
        });
      }
      
    } catch (error) {
      console.error('❌ Error en SalidaController.validateSalidaData:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  /**
   * Obtener opciones de configuración (barrios, días, estados válidos)
   * GET /api/salidas/config
   */
  async getConfig(req, res) {
    try {
      console.log('🌐 SalidaController: GET /api/salidas/config');
      
      const { Salida } = await import('../../../domain/entities/Salida.js');
      
      const config = {
        barrios_validos: Salida.getValidBarrios(),
        dias_validos: Salida.getValidDias(),
        estados_validos: Salida.getValidEstados()
      };
      
      res.status(200).json({
        success: true,
        data: config
      });
      
    } catch (error) {
      console.error('❌ Error en SalidaController.getConfig:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }
}

export default SalidaController;