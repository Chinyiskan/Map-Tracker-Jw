// backend/application/services/CicloService.js
// Servicio de aplicación para ciclos - Orquesta gestión de ciclos

import GestionarCiclo from '../../domain/usecases/GestionarCiclo.js';
import CalcularProgreso from '../../domain/usecases/CalcularProgreso.js';
import cacheService from '../../infrastructure/cache/CacheService.js';

/**
 * @implements {import('../../domain/types').ICicloService}
 */
class CicloService {
  constructor(cicloRepository, progresoRepository, manzanasRepository) {
    this.cicloRepository = cicloRepository;
    this.progresoRepository = progresoRepository;
    this.manzanasRepository = manzanasRepository;
    
    this.gestionarCicloUseCase = new GestionarCiclo(
      this.cicloRepository,
      this.progresoRepository
    );
    
    this.calcularProgresoUseCase = new CalcularProgreso(
      this.cicloRepository,
      this.progresoRepository,
      this.manzanasRepository
    );
  }
  
  /**
   * Procesar reporte y actualizar ciclo
   * @param {Object} params - Parámetros del reporte
   * @returns {Object} Resultado del procesamiento
   */
  async procesarReporte(params) {
    try {
      console.log('🔄 CicloService: Procesando reporte para ciclo');
      
      const { barrio, manzanas, reporteId } = params;
      
      // Validar parámetros
      if (!barrio || !manzanas || !reporteId) {
        throw new Error('Barrio, manzanas y reporteId son requeridos');
      }
      
      if (!Array.isArray(manzanas) || manzanas.length === 0) {
        throw new Error('Las manzanas deben ser un array no vacío');
      }
      
      // Ejecutar caso de uso
      const resultado = await this.gestionarCicloUseCase.procesarReporte(params);
      
      console.log('✅ CicloService: Reporte procesado exitosamente');
      
      return {
        success: true,
        data: resultado,
        message: 'Ciclo actualizado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error en CicloService.procesarReporte:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * Obtener ciclo activo de un barrio
   * @param {string} barrio - Nombre del barrio
   * @returns {Object} Resultado con ciclo activo
   */
  async obtenerCicloActivo(barrio) {
    try {
      console.log('🔍 CicloService: Obteniendo ciclo activo de', barrio);
      
      if (!barrio) {
        throw new Error('El barrio es requerido');
      }
      
      const ciclo = await this.cicloRepository.obtenerCicloActivo(barrio);
      
      if (!ciclo) {
        return {
          success: false,
          error: 'No hay ciclo activo para este barrio',
          data: null
        };
      }
      
      return {
        success: true,
        data: ciclo
      };
      
    } catch (error) {
      console.error('❌ Error en CicloService.obtenerCicloActivo:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * Crear nuevo ciclo para un barrio
   * @param {string} barrio - Nombre del barrio
   * @param {Object} opciones - Opciones adicionales
   * @returns {Object} Resultado de la creación
   */
  async crearNuevoCiclo(barrio, opciones = {}) {
    try {
      console.log('🆕 CicloService: Creando nuevo ciclo para', barrio);
      
      if (!barrio) {
        throw new Error('El barrio es requerido');
      }
      
      const { numeroCiclo = null } = opciones;
      
      const ciclo = await this.gestionarCicloUseCase.crearNuevoCiclo(barrio, numeroCiclo);
      
      return {
        success: true,
        data: ciclo,
        message: 'Ciclo creado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error en CicloService.crearNuevoCiclo:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * Obtener progreso detallado de un ciclo
   * @param {string} cicloId - ID del ciclo
   * @returns {Object} Resultado con progreso detallado
   */
  async obtenerProgresoCiclo(cicloId) {
    try {
      console.log('📊 CicloService: Obteniendo progreso del ciclo', cicloId);
      
      if (!cicloId) {
        throw new Error('El ID del ciclo es requerido');
      }
      
      const progreso = await this.calcularProgresoUseCase.calcularProgresoCiclo(cicloId);
      
      return {
        success: true,
        data: progreso
      };
      
    } catch (error) {
      console.error('❌ Error en CicloService.obtenerProgresoCiclo:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * Obtener progreso de un barrio específico
   * @param {string} barrio - Nombre del barrio
   * @returns {Object} Resultado con progreso del barrio
   */
  async obtenerProgresoBarrio(barrio) {
    try {
      console.log('📊 CicloService: Obteniendo progreso del barrio', barrio);
      
      if (!barrio) {
        throw new Error('El barrio es requerido');
      }
      
      const progreso = await this.calcularProgresoUseCase.calcularProgresoBarrio(barrio);
      
      return {
        success: true,
        data: progreso
      };
      
    } catch (error) {
      console.error('❌ Error en CicloService.obtenerProgresoBarrio:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * Obtener progreso de todos los barrios con optimizaciones SQL y cache
   * @param {Object} opciones - Opciones de filtro (fechaInicio, fechaFin)
   * @returns {Object} Resultado con progreso de todos los barrios
   */
  async obtenerProgresoTodosBarrios(opciones = {}) {
    try {
      console.log('📊 CicloService: Obteniendo progreso optimizado de todos los barrios');
      
      // Usar rango de fechas si se proporciona, sino usar últimos 30 días
      const ahora = new Date();
      const fechaFin = opciones.fechaFin || ahora.toISOString().slice(0, 10);
      const fechaInicio = opciones.fechaInicio || new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      
      // OPTIMIZACIÓN SPRINT 1: Usar caché diferenciado
      const cacheKey = `progreso_barrios_${fechaInicio}_${fechaFin}`;
      
      // Usar caché dinámico (5 minutos) para datos de progreso
      const progresoOptimizado = await cacheService.getOrSetDynamic(
        cacheKey,
        async () => {
          console.log('🔄 Cargando progreso desde base de datos...');
          return await this.progresoRepository.obtenerProgresoPorBarrioOptimizado(
            fechaInicio,
            fechaFin
          );
        }
      );
      
      // Si el método optimizado falla, usar el método legacy
      if (!progresoOptimizado || progresoOptimizado.length === 0) {
        console.log('⚠️ Fallback a método legacy para progreso de barrios');
        const progreso = await this.calcularProgresoUseCase.calcularProgresoTodosBarrios();
        
        return {
          success: true,
          data: progreso,
          total: progreso.length,
          metodo: 'legacy',
          rango: { fechaInicio, fechaFin }
        };
      }
      
      // Enriquecer datos con información adicional
      const progresoEnriquecido = progresoOptimizado.map(barrio => ({
        ...barrio,
        velocidad_promedio: this._calcularVelocidadPromedio(barrio),
        dias_restantes: this._calcularDiasRestantes(barrio),
        eficiencia: this._calcularEficiencia(barrio)
      }));
      
      console.log(`✅ Progreso optimizado calculado para ${progresoEnriquecido.length} barrios`);
      
      return {
        success: true,
        data: progresoEnriquecido,
        total: progresoEnriquecido.length,
        metodo: 'optimizado',
        rango: { fechaInicio, fechaFin }
      };
      
    } catch (error) {
      console.error('❌ Error en CicloService.obtenerProgresoTodosBarrios:', error.message);
      
      // Fallback a método legacy en caso de error
      try {
        console.log('⚠️ Fallback a método legacy por error');
        const progreso = await this.calcularProgresoUseCase.calcularProgresoTodosBarrios();
        
        return {
          success: true,
          data: progreso,
          total: progreso.length,
          metodo: 'legacy_fallback',
          warning: 'Método optimizado falló, usando legacy'
        };
      } catch (fallbackError) {
        console.error('❌ Error también en método legacy:', fallbackError.message);
        
        return {
          success: false,
          error: error.message,
          data: []
        };
      }
    }
  }
  
  /**
   * Calcular velocidad promedio de trabajo
   * @param {Object} barrio - Datos del barrio
   * @returns {number} Velocidad promedio (territorios por día)
   * @private
   */
  _calcularVelocidadPromedio(barrio) {
    if (!barrio.fecha_inicio_trabajo || !barrio.fecha_ultimo_trabajo || barrio.territorios_trabajados === 0) {
      return 0;
    }
    
    const fechaInicio = new Date(barrio.fecha_inicio_trabajo);
    const fechaUltimo = new Date(barrio.fecha_ultimo_trabajo);
    const diasTrabajados = Math.max(1, Math.ceil((fechaUltimo - fechaInicio) / (1000 * 60 * 60 * 24)));
    
    return Math.round((barrio.territorios_trabajados / diasTrabajados) * 100) / 100;
  }
  
  /**
   * Calcular días restantes estimados
   * @param {Object} barrio - Datos del barrio
   * @returns {number} Días restantes estimados
   * @private
   */
  _calcularDiasRestantes(barrio) {
    if (barrio.estado === 'completado' || barrio.progreso_porcentaje >= 100) {
      return 0;
    }
    
    const velocidad = this._calcularVelocidadPromedio(barrio);
    if (velocidad === 0) {
      return null; // No se puede estimar
    }
    
    const territoriosRestantes = barrio.total_territorios - barrio.territorios_trabajados;
    return Math.ceil(territoriosRestantes / velocidad);
  }
  
  /**
   * Calcular eficiencia del barrio
   * @param {Object} barrio - Datos del barrio
   * @returns {string} Nivel de eficiencia
   * @private
   */
  _calcularEficiencia(barrio) {
    const velocidad = this._calcularVelocidadPromedio(barrio);
    
    if (velocidad === 0) return 'sin_datos';
    if (velocidad >= 2) return 'alta';
    if (velocidad >= 1) return 'media';
    if (velocidad >= 0.5) return 'baja';
    return 'muy_baja';
  }
  
  /**
   * Invalidar cache relacionado con progreso
   * @param {string} barrio - Barrio específico (opcional)
   */
  invalidarCacheProgreso(barrio = null) {
    try {
      if (barrio) {
        // Invalidar cache específico del barrio
        const pattern = new RegExp(`progreso.*${barrio}`);
        const invalidated = cacheService.invalidatePattern(pattern);
        console.log(`🗑️ Cache invalidado para barrio ${barrio}: ${invalidated} entradas`);
      } else {
        // Invalidar todo el cache de progreso
        const invalidated = cacheService.invalidatePattern(/^progreso/);
        console.log(`🗑️ Cache de progreso invalidado: ${invalidated} entradas`);
      }
    } catch (error) {
      console.error('❌ Error invalidando cache de progreso:', error.message);
    }
  }
  
  /**
   * Obtener estadísticas del cache
   * @returns {Object} Estadísticas del cache
   */
  obtenerEstadisticasCache() {
    return cacheService.getStats();
  }
  
  /**
   * Completar ciclo manualmente
   * @param {string} cicloId - ID del ciclo
   * @param {Object} opciones - Opciones adicionales
   * @returns {Object} Resultado de la completación
   */
  async completarCiclo(cicloId, opciones = {}) {
    try {
      console.log('🎉 CicloService: Completando ciclo', cicloId);
      
      if (!cicloId) {
        throw new Error('El ID del ciclo es requerido');
      }
      
      // Obtener información del ciclo
      const ciclo = await this.cicloRepository.obtenerPorId(cicloId);
      if (!ciclo) {
        throw new Error('Ciclo no encontrado');
      }
      
      if (ciclo.estado === 'completado') {
        throw new Error('El ciclo ya está completado');
      }
      
      const { fechaFin = null } = opciones;
      
      // Completar ciclo
      const cicloCompletado = await this.cicloRepository.completar(cicloId, fechaFin);
      
      // Crear siguiente ciclo
      const siguienteCiclo = await this.gestionarCicloUseCase.crearNuevoCiclo(ciclo.barrio);
      
      return {
        success: true,
        data: {
          ciclo_completado: cicloCompletado,
          siguiente_ciclo: siguienteCiclo
        },
        message: 'Ciclo completado y siguiente ciclo creado'
      };
      
    } catch (error) {
      console.error('❌ Error en CicloService.completarCiclo:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * Pausar ciclo
   * @param {string} cicloId - ID del ciclo
   * @returns {Object} Resultado de la pausa
   */
  async pausarCiclo(cicloId) {
    try {
      console.log('⏸️ CicloService: Pausando ciclo', cicloId);
      
      if (!cicloId) {
        throw new Error('El ID del ciclo es requerido');
      }
      
      const ciclo = await this.cicloRepository.pausar(cicloId);
      
      return {
        success: true,
        data: ciclo,
        message: 'Ciclo pausado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error en CicloService.pausarCiclo:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * Reactivar ciclo pausado
   * @param {string} cicloId - ID del ciclo
   * @returns {Object} Resultado de la reactivación
   */
  async reactivarCiclo(cicloId) {
    try {
      console.log('▶️ CicloService: Reactivando ciclo', cicloId);
      
      if (!cicloId) {
        throw new Error('El ID del ciclo es requerido');
      }
      
      const ciclo = await this.cicloRepository.reactivar(cicloId);
      
      return {
        success: true,
        data: ciclo,
        message: 'Ciclo reactivado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error en CicloService.reactivarCiclo:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * Obtener historial de ciclos de un barrio
   * @param {string} barrio - Nombre del barrio
   * @param {Object} opciones - Opciones de consulta
   * @returns {Object} Resultado con historial
   */
  async obtenerHistorialCiclos(barrio, opciones = {}) {
    try {
      console.log('📚 CicloService: Obteniendo historial de ciclos de', barrio);
      
      if (!barrio) {
        throw new Error('El barrio es requerido');
      }
      
      const ciclos = await this.cicloRepository.obtenerPorBarrio(barrio, opciones);
      
      return {
        success: true,
        data: ciclos,
        total: ciclos.length,
        barrio: barrio
      };
      
    } catch (error) {
      console.error('❌ Error en CicloService.obtenerHistorialCiclos:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
  
  /**
   * Obtener todos los ciclos activos
   * @returns {Object} Resultado con ciclos activos
   */
  async obtenerCiclosActivos() {
    try {
      console.log('🔄 CicloService: Obteniendo todos los ciclos activos');
      
      const ciclos = await this.cicloRepository.obtenerCiclosActivos();
      
      return {
        success: true,
        data: ciclos,
        total: ciclos.length
      };
      
    } catch (error) {
      console.error('❌ Error en CicloService.obtenerCiclosActivos:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
  
  /**
   * Obtener estadísticas generales del sistema
   * @returns {Object} Resultado con estadísticas
   */
  async obtenerEstadisticasGenerales() {
    try {
      console.log('📊 CicloService: Obteniendo estadísticas generales');
      
      const estadisticas = await this.calcularProgresoUseCase.obtenerEstadisticasGenerales();
      
      return {
        success: true,
        data: estadisticas
      };
      
    } catch (error) {
      console.error('❌ Error en CicloService.obtenerEstadisticasGenerales:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * Obtener estadísticas de ciclos
   * @param {Object} opciones - Opciones de consulta
   * @returns {Object} Resultado con estadísticas
   */
  async obtenerEstadisticasCiclos(opciones = {}) {
    try {
      console.log('📊 CicloService: Obteniendo estadísticas de ciclos');
      
      const estadisticas = await this.cicloRepository.obtenerEstadisticas(opciones);
      
      return {
        success: true,
        data: estadisticas
      };
      
    } catch (error) {
      console.error('❌ Error en CicloService.obtenerEstadisticasCiclos:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
}

export default CicloService;