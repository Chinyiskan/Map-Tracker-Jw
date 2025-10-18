// @ts-check
// backend/infrastructure/web/controllers/OptimizacionController.js
// Controlador para consultas optimizadas y análisis avanzados

import QueryOptimizationService from '../../database/QueryOptimizationService.js';

/**
 * Controlador de Optimización - Expone consultas SQL optimizadas
 * Proporciona endpoints para análisis avanzados y consultas complejas
 */
export class OptimizacionController {
  /**
   * Constructor del controlador
   * @param {Object} database - Cliente de base de datos
   * @param {Object} cicloRepository - Repositorio de ciclos
   */
  constructor(database, cicloRepository) {
    this.db = database;
    this.cicloRepository = cicloRepository;
    
    // Bind methods para mantener contexto
    this.getEstadisticasGlobales = this.getEstadisticasGlobales.bind(this);
    this.getRankingBarrios = this.getRankingBarrios.bind(this);
    this.getTendenciasTemporales = this.getTendenciasTemporales.bind(this);
    this.getCorrelacionReportesProgreso = this.getCorrelacionReportesProgreso.bind(this);
    this.getAnalisisPerformance = this.getAnalisisPerformance.bind(this);
    this.healthCheck = this.healthCheck.bind(this);
  }

  /**
   * Obtener estadísticas globales optimizadas
   * GET /api/optimizacion/estadisticas-globales
   */
  async getEstadisticasGlobales(req, res) {
    try {
      console.log('🌐 OptimizacionController: GET /api/optimizacion/estadisticas-globales');
      
      const filters = {
        fechaDesde: req.query.fechaDesde,
        fechaHasta: req.query.fechaHasta,
        barrio: req.query.barrio
      };
      
      console.log('📋 Filtros aplicados:', filters);
      
      const startTime = Date.now();
      const estadisticas = await QueryOptimizationService.getGlobalStatsOptimized(this.db, filters);
      const duration = Date.now() - startTime;
      
      res.status(200).json({
        success: true,
        data: estadisticas,
        metadata: {
          filtros: filters,
          tiempo_ejecucion_ms: duration,
          optimizado: true,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('❌ Error en OptimizacionController.getEstadisticasGlobales:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo estadísticas globales',
        message: error.message
      });
    }
  }

  /**
   * Obtener ranking de barrios optimizado
   * GET /api/optimizacion/ranking-barrios
   */
  async getRankingBarrios(req, res) {
    try {
      console.log('🌐 OptimizacionController: GET /api/optimizacion/ranking-barrios');
      
      const options = {
        limite: parseInt(req.query.limite) || 10,
        fechaDesde: req.query.fechaDesde,
        fechaHasta: req.query.fechaHasta
      };
      
      console.log('📋 Opciones de ranking:', options);
      
      const startTime = Date.now();
      const ranking = await this.cicloRepository.obtenerRankingBarriosOptimizado(options);
      const duration = Date.now() - startTime;
      
      res.status(200).json({
        success: true,
        data: ranking,
        metadata: {
          total_barrios: ranking.length,
          limite_aplicado: options.limite,
          tiempo_ejecucion_ms: duration,
          optimizado: true,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('❌ Error en OptimizacionController.getRankingBarrios:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo ranking de barrios',
        message: error.message
      });
    }
  }

  /**
   * Obtener análisis de tendencias temporales
   * GET /api/optimizacion/tendencias-temporales
   */
  async getTendenciasTemporales(req, res) {
    try {
      console.log('🌐 OptimizacionController: GET /api/optimizacion/tendencias-temporales');
      
      const options = {
        fechaDesde: req.query.fechaDesde || '2024-01-01',
        fechaHasta: req.query.fechaHasta || new Date().toISOString().split('T')[0],
        granularidad: req.query.granularidad || 'month'
      };
      
      // Validar granularidad
      if (!['day', 'week', 'month'].includes(options.granularidad)) {
        return res.status(400).json({
          success: false,
          error: 'Granularidad inválida. Debe ser: day, week, o month'
        });
      }
      
      console.log('📋 Opciones de tendencias:', options);
      
      const startTime = Date.now();
      const tendencias = await QueryOptimizationService.getTendenciasTemporalesOptimized(this.db, options);
      const duration = Date.now() - startTime;
      
      res.status(200).json({
        success: true,
        data: tendencias,
        metadata: {
          tiempo_ejecucion_ms: duration,
          optimizado: true,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('❌ Error en OptimizacionController.getTendenciasTemporales:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo tendencias temporales',
        message: error.message
      });
    }
  }

  /**
   * Obtener análisis de correlación entre reportes y progreso
   * GET /api/optimizacion/correlacion-reportes-progreso
   */
  async getCorrelacionReportesProgreso(req, res) {
    try {
      console.log('🌐 OptimizacionController: GET /api/optimizacion/correlacion-reportes-progreso');
      
      const options = {
        fechaDesde: req.query.fechaDesde,
        fechaHasta: req.query.fechaHasta,
        barrio: req.query.barrio
      };
      
      console.log('📋 Opciones de correlación:', options);
      
      const startTime = Date.now();
      const correlacion = await QueryOptimizationService.getCorrelacionReportesProgreso(this.db, options);
      const duration = Date.now() - startTime;
      
      res.status(200).json({
        success: true,
        data: correlacion,
        metadata: {
          tiempo_ejecucion_ms: duration,
          optimizado: true,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('❌ Error en OptimizacionController.getCorrelacionReportesProgreso:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo análisis de correlación',
        message: error.message
      });
    }
  }

  /**
   * Obtener análisis de performance de consultas
   * GET /api/optimizacion/analisis-performance
   */
  async getAnalisisPerformance(req, res) {
    try {
      console.log('🌐 OptimizacionController: GET /api/optimizacion/analisis-performance');
      
      const { query, params } = req.body;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Query SQL es requerido en el body'
        });
      }
      
      console.log('📋 Analizando query:', query.substring(0, 100) + '...');
      
      const startTime = Date.now();
      
      // Optimizar consulta
      const optimizacion = QueryOptimizationService.optimizeExistingQuery(query, params || []);
      
      // Generar plan de ejecución si es posible
      let planEjecucion = null;
      try {
        planEjecucion = await QueryOptimizationService.getExecutionPlan(this.db, query, params || []);
      } catch (planError) {
        console.log('⚠️ No se pudo generar plan de ejecución:', planError.message);
      }
      
      const duration = Date.now() - startTime;
      
      res.status(200).json({
        success: true,
        data: {
          optimizacion,
          plan_ejecucion: planEjecucion,
          recomendaciones: [
            'Considerar agregar índices en columnas de filtro frecuente',
            'Evaluar el uso de CTEs para consultas complejas',
            'Implementar paginación para consultas que devuelven muchos registros',
            'Usar agregaciones SQL nativas en lugar de cálculos en memoria'
          ]
        },
        metadata: {
          tiempo_analisis_ms: duration,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('❌ Error en OptimizacionController.getAnalisisPerformance:', error);
      res.status(500).json({
        success: false,
        error: 'Error analizando performance de consulta',
        message: error.message
      });
    }
  }

  /**
   * Health check del controlador de optimización
   * GET /api/optimizacion/health
   */
  async healthCheck(req, res) {
    try {
      console.log('🌐 OptimizacionController: GET /api/optimizacion/health');
      
      // Verificar que los servicios estén disponibles
      const isServiceHealthy = (
        this.db && 
        this.cicloRepository && 
        typeof QueryOptimizationService.getGlobalStatsOptimized === 'function'
      );
      
      if (isServiceHealthy) {
        res.status(200).json({
          status: 'OK',
          service: 'OptimizacionController',
          timestamp: new Date().toISOString(),
          dependencies: {
            database: 'healthy',
            cicloRepository: 'healthy',
            queryOptimizationService: 'healthy'
          },
          features: {
            estadisticas_globales: 'available',
            ranking_barrios: 'available',
            tendencias_temporales: 'available',
            correlacion_reportes_progreso: 'available',
            analisis_performance: 'available'
          }
        });
      } else {
        res.status(503).json({
          status: 'ERROR',
          service: 'OptimizacionController',
          timestamp: new Date().toISOString(),
          error: 'Dependencias no disponibles'
        });
      }
      
    } catch (error) {
      console.error('❌ Error en OptimizacionController.healthCheck:', error);
      res.status(503).json({
        status: 'ERROR',
        service: 'OptimizacionController',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  /**
   * Obtener información sobre optimizaciones disponibles
   * GET /api/optimizacion/info
   */
  async getInfo(req, res) {
    try {
      console.log('🌐 OptimizacionController: GET /api/optimizacion/info');
      
      const info = {
        version: '1.0.0',
        descripcion: 'Controlador de consultas SQL optimizadas para Map Tracker JW',
        endpoints: {
          '/estadisticas-globales': {
            metodo: 'GET',
            descripcion: 'Estadísticas globales con CTEs optimizados',
            parametros: ['fechaDesde', 'fechaHasta', 'barrio']
          },
          '/ranking-barrios': {
            metodo: 'GET',
            descripcion: 'Ranking de barrios con window functions',
            parametros: ['limite', 'fechaDesde', 'fechaHasta']
          },
          '/tendencias-temporales': {
            metodo: 'GET',
            descripcion: 'Análisis temporal con series de tiempo',
            parametros: ['fechaDesde', 'fechaHasta', 'granularidad']
          },
          '/correlacion-reportes-progreso': {
            metodo: 'GET',
            descripcion: 'Análisis estadístico de correlaciones',
            parametros: ['fechaDesde', 'fechaHasta', 'barrio']
          },
          '/analisis-performance': {
            metodo: 'POST',
            descripcion: 'Análisis y optimización de consultas SQL',
            body: ['query', 'params']
          }
        },
        optimizaciones: {
          ctes: 'Common Table Expressions para consultas complejas',
          window_functions: 'Funciones de ventana para rankings y análisis',
          agregaciones_nativas: 'Agregaciones SQL en lugar de cálculos en memoria',
          joins_optimizados: 'JOINs eficientes con índices apropiados',
          series_temporales: 'Análisis temporal con generate_series',
          correlaciones_estadisticas: 'Funciones estadísticas nativas de PostgreSQL'
        },
        beneficios: {
          performance: 'Reducción significativa en tiempo de ejecución',
          memoria: 'Menor uso de memoria del servidor',
          escalabilidad: 'Mejor rendimiento con datasets grandes',
          precision: 'Cálculos más precisos con funciones nativas'
        }
      };
      
      res.status(200).json({
        success: true,
        data: info
      });
      
    } catch (error) {
      console.error('❌ Error en OptimizacionController.getInfo:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo información del controlador',
        message: error.message
      });
    }
  }
}

export default OptimizacionController;