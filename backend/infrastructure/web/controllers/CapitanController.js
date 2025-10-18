// @ts-check
// backend/infrastructure/web/controllers/CapitanController.js
// Controlador HTTP para Capitanes - Clean Architecture

/**
 * Controlador de Capitanes - Adaptador HTTP
 * Maneja las peticiones HTTP y delega la lógica de negocio al servicio
 */
export class CapitanController {
  /**
   * Constructor del controlador
   * @param {any} capitanService - Servicio de capitanes
   */
  constructor(capitanService) {
    this.capitanService = capitanService;
    
    // Bind methods para mantener contexto
    this.getAllCapitanes = this.getAllCapitanes.bind(this);
    this.getCapitanById = this.getCapitanById.bind(this);
    this.createCapitan = this.createCapitan.bind(this);
    this.updateCapitan = this.updateCapitan.bind(this);
    this.deleteCapitan = this.deleteCapitan.bind(this);
    this.searchCapitanes = this.searchCapitanes.bind(this);
    this.getStats = this.getStats.bind(this);
    this.validateCapitanData = this.validateCapitanData.bind(this);
  }

  /**
   * Obtener todos los capitanes
   * GET /api/capitanes
   * @param {import('express').Request<{}, import('../../../domain/types').HttpResponse<import('../../../domain/types').CapitanDTO[]>>} req
   * @param {import('express').Response<import('../../../domain/types').HttpResponse<import('../../../domain/types').CapitanDTO[]>>} res
   */
  async getAllCapitanes(req, res) {
    try {
      console.log('🌐 CapitanController: GET /api/capitanes');
      
      // Extraer filtros de query parameters
      const filters = {
        nombre: req.query.nombre,
        apellido: req.query.apellido,
        search: req.query.search
      };
      
      console.log('📋 Query params:', filters);
      
      // Delegar al servicio
      const resultado = await this.capitanService.getAllCapitanes(filters);
      
      if (resultado.success) {
        res.status(200).json({
          success: true,
          data: resultado.data,
          metadata: resultado.metadata,
          count: resultado.data.length
        });
      } else {
        res.status(400).json({
          success: false,
          error: resultado.error,
          data: []
        });
      }
      
    } catch (error) {
      console.error('❌ Error en CapitanController.getAllCapitanes:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  /**
   * Obtener capitán por ID
   * GET /api/capitanes/:id
   */
  async getCapitanById(req, res) {
    try {
      console.log('🌐 CapitanController: GET /api/capitanes/:id');
      
      const { id } = req.params;
      console.log('📋 ID del capitán:', id);
      
      // Validar parámetros
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID del capitán es requerido'
        });
      }
      
      // Delegar al servicio
      const resultado = await this.capitanService.getCapitanById(id);
      
      if (resultado.success) {
        res.status(200).json({
          success: true,
          data: resultado.data
        });
      } else {
        const statusCode = resultado.error === 'Capitán no encontrado' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en CapitanController.getCapitanById:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  /**
   * Crear nuevo capitán
   * POST /api/capitanes
   * @param {import('express').Request<{}, import('../../../domain/types').HttpResponse<import('../../../domain/types').CapitanDTO>, import('../../../domain/types').CrearCapitanBody>} req
   * @param {import('express').Response<import('../../../domain/types').HttpResponse<import('../../../domain/types').CapitanDTO>>} res
   */
  async createCapitan(req, res) {
    try {
      console.log('🌐 CapitanController: POST /api/capitanes');
      console.log('📋 Body:', req.body);
      
      const capitanData = req.body;
      
      // Validar que se envió data
      if (!capitanData || Object.keys(capitanData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Datos del capitán son requeridos'
        });
      }
      
      // Delegar al servicio
      const resultado = await this.capitanService.createCapitan(capitanData);
      
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
          details: resultado.details
        });
      }
      
    } catch (error) {
      console.error('❌ Error en CapitanController.createCapitan:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  /**
   * Actualizar capitán existente
   * PUT /api/capitanes/:id
   */
  async updateCapitan(req, res) {
    try {
      console.log('🌐 CapitanController: PUT /api/capitanes/:id');
      
      const { id } = req.params;
      const updateData = req.body;
      
      console.log('📋 ID del capitán:', id);
      console.log('📋 Datos de actualización:', updateData);
      
      // Validar parámetros
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID del capitán es requerido'
        });
      }
      
      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Datos de actualización son requeridos'
        });
      }
      
      // Delegar al servicio
      const resultado = await this.capitanService.updateCapitan(id, updateData);
      
      if (resultado.success) {
        res.status(200).json({
          success: true,
          data: resultado.data,
          message: resultado.message
        });
      } else {
        const statusCode = resultado.error === 'Capitán no encontrado' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: resultado.error,
          details: resultado.details
        });
      }
      
    } catch (error) {
      console.error('❌ Error en CapitanController.updateCapitan:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  /**
   * Eliminar capitán
   * DELETE /api/capitanes/:id
   */
  async deleteCapitan(req, res) {
    try {
      console.log('🌐 CapitanController: DELETE /api/capitanes/:id');
      
      const { id } = req.params;
      console.log('📋 ID del capitán a eliminar:', id);
      
      // Validar parámetros
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID del capitán es requerido'
        });
      }
      
      // Delegar al servicio
      const resultado = await this.capitanService.deleteCapitan(id);
      
      if (resultado.success) {
        res.status(200).json({
          success: true,
          message: resultado.message
        });
      } else {
        const statusCode = resultado.error === 'Capitán no encontrado' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: resultado.error
        });
      }
      
    } catch (error) {
      console.error('❌ Error en CapitanController.deleteCapitan:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  /**
   * Buscar capitanes
   * GET /api/capitanes/search
   */
  async searchCapitanes(req, res) {
    try {
      console.log('🌐 CapitanController: GET /api/capitanes/search');
      
      const { q: searchTerm } = req.query;
      console.log('📋 Término de búsqueda:', searchTerm);
      
      // Validar parámetros
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          error: 'Término de búsqueda es requerido (parámetro q)'
        });
      }
      
      // Delegar al servicio
      const resultado = await this.capitanService.searchCapitanes(searchTerm);
      
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
      console.error('❌ Error en CapitanController.searchCapitanes:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de capitanes
   * GET /api/capitanes/stats
   */
  async getStats(req, res) {
    try {
      console.log('🌐 CapitanController: GET /api/capitanes/stats');
      
      // Delegar al servicio
      const resultado = await this.capitanService.getStats();
      
      if (resultado.success) {
        res.status(200).json({
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
      console.error('❌ Error en CapitanController.getStats:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  /**
   * Validar datos de capitán
   * POST /api/capitanes/validate
   */
  async validateCapitanData(req, res) {
    try {
      console.log('🌐 CapitanController: POST /api/capitanes/validate');
      console.log('📋 Datos a validar:', req.body);
      
      const capitanData = req.body;
      
      // Validar que se envió data
      if (!capitanData || Object.keys(capitanData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Datos del capitán son requeridos para validación'
        });
      }
      
      // Delegar al servicio
      const resultado = await this.capitanService.validateCapitanData(capitanData);
      
      res.status(200).json({
        success: resultado.success,
        valid: resultado.success,
        errors: resultado.errors || [],
        warnings: resultado.warnings || []
      });
      
    } catch (error) {
      console.error('❌ Error en CapitanController.validateCapitanData:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  /**
   * Health check del controlador
   * GET /api/capitanes/health
   */
  async healthCheck(req, res) {
    try {
      console.log('🌐 CapitanController: GET /api/capitanes/health');
      
      // Verificar que el servicio esté disponible
      const isServiceHealthy = this.capitanService && typeof this.capitanService.getAllCapitanes === 'function';
      
      if (isServiceHealthy) {
        res.status(200).json({
          status: 'OK',
          service: 'CapitanController',
          timestamp: new Date().toISOString(),
          dependencies: {
            capitanService: 'healthy'
          }
        });
      } else {
        res.status(503).json({
          status: 'ERROR',
          service: 'CapitanController',
          timestamp: new Date().toISOString(),
          error: 'CapitanService no disponible'
        });
      }
      
    } catch (error) {
      console.error('❌ Error en CapitanController.healthCheck:', error);
      res.status(503).json({
        status: 'ERROR',
        service: 'CapitanController',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  /**
   * Obtener configuración válida para capitanes
   * GET /api/capitanes/config
   */
  async getConfig(req, res) {
    try {
      console.log('🌐 CapitanController: GET /api/capitanes/config');
      
      const config = {
        campos_requeridos: ['nombre', 'apellido'],
        campos_opcionales: ['telefono', 'email'],
        validaciones: {
          nombre: {
            min_length: 2,
            max_length: 50,
            pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$'
          },
          apellido: {
            min_length: 2,
            max_length: 50,
            pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$'
          },
          telefono: {
            pattern: '^[+]?[0-9\\s\\-()]{7,20}$',
            opcional: true
          },
          email: {
            pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
            opcional: true
          }
        },
        mensajes: {
          nombre_requerido: 'El nombre es requerido',
          apellido_requerido: 'El apellido es requerido',
          telefono_invalido: 'El formato del teléfono no es válido',
          email_invalido: 'El formato del email no es válido',
          duplicado: 'Ya existe un capitán con ese nombre'
        }
      };
      
      res.status(200).json({
        success: true,
        data: config
      });
      
    } catch (error) {
      console.error('❌ Error en CapitanController.getConfig:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }
}

export default CapitanController;