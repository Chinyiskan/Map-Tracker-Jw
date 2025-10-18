// backend/application/services/ReporteService.js
// Servicio de aplicación para reportes - Orquesta casos de uso

import CrearReporte from '../../domain/usecases/CrearReporte.js';

/**
 * @implements {import('../../domain/types').IReporteService}
 */
class ReporteService {
  constructor(reporteRepository, cicloService, progresoService) {
    this.reporteRepository = reporteRepository;
    this.cicloService = cicloService;
    this.progresoService = progresoService;
    
    // Inicializar casos de uso
    this.crearReporteUseCase = new CrearReporte(
      this.reporteRepository,
      this.cicloService,
      this.progresoService
    );
  }
  
  /**
   * Crear nuevo reporte
   * @param {Object} datosReporte - Datos del reporte
   * @returns {Object} Resultado de la creación
   */
  async crearReporte(datosReporte) {
    try {
      console.log('📝 ReporteService: Iniciando creación de reporte');
      
      // Validar datos antes de procesar
      const validacion = await this.crearReporteUseCase.validarDatos(datosReporte);
      if (!validacion.valido) {
        throw new Error(`Datos inválidos: ${validacion.error}`);
      }
      
      // Ejecutar caso de uso
      const resultado = await this.crearReporteUseCase.ejecutar(datosReporte);
      
      console.log('✅ ReporteService: Reporte creado exitosamente');
      
      return {
        success: true,
        data: resultado,
        message: 'Reporte creado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error en ReporteService.crearReporte:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * Obtener reportes por barrio
   * @param {string} barrio - Nombre del barrio
   * @param {Object} opciones - Opciones de consulta
   * @returns {Object} Resultado con reportes
   */
  async obtenerReportesPorBarrio(barrio, opciones = {}) {
    try {
      console.log('📊 ReporteService: Obteniendo reportes de', barrio);
      
      if (!barrio || typeof barrio !== 'string') {
        throw new Error('El barrio es requerido y debe ser un string');
      }
      
      const reportes = await this.reporteRepository.obtenerPorBarrio(barrio, opciones);
      
      return {
        success: true,
        data: reportes,
        total: reportes.length,
        barrio: barrio
      };
      
    } catch (error) {
      console.error('❌ Error en ReporteService.obtenerReportesPorBarrio:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
  
  /**
   * Obtener reporte por ID
   * @param {string} id - ID del reporte
   * @returns {Object} Resultado con reporte
   */
  async obtenerReportePorId(id) {
    try {
      console.log('🔍 ReporteService: Obteniendo reporte', id);
      
      if (!id) {
        throw new Error('El ID del reporte es requerido');
      }
      
      const reporte = await this.reporteRepository.obtenerPorId(id);
      
      if (!reporte) {
        return {
          success: false,
          error: 'Reporte no encontrado',
          data: null
        };
      }
      
      return {
        success: true,
        data: reporte
      };
      
    } catch (error) {
      console.error('❌ Error en ReporteService.obtenerReportePorId:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * Obtener reportes por capitán
   * @param {string} nombreCapitan - Nombre del capitán
   * @param {Object} opciones - Opciones de consulta
   * @returns {Object} Resultado con reportes
   */
  async obtenerReportesPorCapitan(nombreCapitan, opciones = {}) {
    try {
      console.log('👤 ReporteService: Obteniendo reportes de capitán', nombreCapitan);
      
      if (!nombreCapitan || typeof nombreCapitan !== 'string') {
        throw new Error('El nombre del capitán es requerido');
      }
      
      const reportes = await this.reporteRepository.obtenerPorCapitan(nombreCapitan, opciones);
      
      return {
        success: true,
        data: reportes,
        total: reportes.length,
        capitan: nombreCapitan
      };
      
    } catch (error) {
      console.error('❌ Error en ReporteService.obtenerReportesPorCapitan:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
  
  /**
   * Obtener reportes por rango de fechas
   * @param {string} fechaInicio - Fecha de inicio
   * @param {string} fechaFin - Fecha de fin
   * @param {Object} opciones - Opciones adicionales
   * @returns {Object} Resultado con reportes
   */
  async obtenerReportesPorRango(fechaInicio, fechaFin, opciones = {}) {
    try {
      console.log('📅 ReporteService: Obteniendo reportes del', fechaInicio, 'al', fechaFin);
      
      // Validar fechas
      if (!fechaInicio || !fechaFin) {
        throw new Error('Las fechas de inicio y fin son requeridas');
      }
      
      const fechaInicioDate = new Date(fechaInicio);
      const fechaFinDate = new Date(fechaFin);
      
      if (fechaInicioDate > fechaFinDate) {
        throw new Error('La fecha de inicio no puede ser mayor que la fecha de fin');
      }
      
      const reportes = await this.reporteRepository.obtenerPorRangoFechas(
        fechaInicio, 
        fechaFin, 
        opciones
      );
      
      return {
        success: true,
        data: reportes,
        total: reportes.length,
        rango: { fechaInicio, fechaFin }
      };
      
    } catch (error) {
      console.error('❌ Error en ReporteService.obtenerReportesPorRango:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
  
  /**
   * Actualizar reporte existente
   * @param {string} id - ID del reporte
   * @param {Object} datosActualizacion - Datos a actualizar
   * @returns {Object} Resultado de la actualización
   */
  async actualizarReporte(id, datosActualizacion) {
    try {
      console.log('📝 ReporteService: Actualizando reporte', id);
      
      if (!id) {
        throw new Error('El ID del reporte es requerido');
      }
      
      // Verificar que el reporte existe
      const reporteExistente = await this.reporteRepository.obtenerPorId(id);
      if (!reporteExistente) {
        throw new Error('Reporte no encontrado');
      }
      
      // Filtrar campos permitidos para actualización
      const camposPermitidos = ['observaciones', 'salida_id'];
      const datosLimpios = {};
      
      Object.keys(datosActualizacion).forEach(campo => {
        if (camposPermitidos.includes(campo)) {
          datosLimpios[campo] = datosActualizacion[campo];
        }
      });
      
      if (Object.keys(datosLimpios).length === 0) {
        throw new Error('No hay campos válidos para actualizar');
      }
      
      const reporteActualizado = await this.reporteRepository.actualizar(id, datosLimpios);
      
      return {
        success: true,
        data: reporteActualizado,
        message: 'Reporte actualizado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error en ReporteService.actualizarReporte:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * Eliminar reporte
   * @param {string} id - ID del reporte
   * @returns {Object} Resultado de la eliminación
   */
  async eliminarReporte(id) {
    try {
      console.log('🗑️ ReporteService: Eliminando reporte', id);
      
      if (!id) {
        throw new Error('El ID del reporte es requerido');
      }
      
      // Verificar que el reporte existe
      const reporteExistente = await this.reporteRepository.obtenerPorId(id);
      if (!reporteExistente) {
        throw new Error('Reporte no encontrado');
      }
      
      // TODO: Verificar si el reporte tiene progreso asociado
      // y manejar la eliminación en cascada si es necesario
      
      const eliminado = await this.reporteRepository.eliminar(id);
      
      return {
        success: true,
        data: { id, eliminado },
        message: 'Reporte eliminado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error en ReporteService.eliminarReporte:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * Obtener estadísticas de reportes con optimizaciones SQL
   * @param {Object} opciones - Opciones de filtro
   * @returns {Object} Resultado con estadísticas
   */
  async obtenerEstadisticas(opciones = {}) {
    try {
      console.log('📊 ReporteService: Calculando estadísticas optimizadas');
      
      const estadisticas = await this.reporteRepository.obtenerEstadisticas(opciones);
      
      // Añadir métricas adicionales calculadas
      const metricas = {
        ...estadisticas,
        eficiencia_semanal: estadisticas.reportes_ultima_semana > 0 
          ? Math.round((estadisticas.reportes_ultima_semana / 7) * 100) / 100 
          : 0,
        eficiencia_mensual: estadisticas.reportes_ultimo_mes > 0 
          ? Math.round((estadisticas.reportes_ultimo_mes / 30) * 100) / 100 
          : 0,
        promedio_reportes_por_barrio: estadisticas.barrios_unicos > 0 
          ? Math.round((estadisticas.total_reportes / estadisticas.barrios_unicos) * 100) / 100 
          : 0,
        promedio_reportes_por_capitan: estadisticas.capitanes_unicos > 0 
          ? Math.round((estadisticas.total_reportes / estadisticas.capitanes_unicos) * 100) / 100 
          : 0
      };
      
      console.log('✅ Estadísticas calculadas con métricas adicionales');
      
      return {
        success: true,
        data: metricas
      };
      
    } catch (error) {
      console.error('❌ Error en ReporteService.obtenerEstadisticas:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: {}
      };
    }
  }
  
  /**
   * Obtener estadísticas mensuales optimizadas
   * @param {string} fechaInicio - Fecha de inicio
   * @param {string} fechaFin - Fecha de fin
   * @param {Object} opciones - Opciones adicionales
   * @returns {Object} Resultado con estadísticas mensuales
   */
  async obtenerEstadisticasMensuales(fechaInicio, fechaFin, opciones = {}) {
    try {
      console.log('📊 ReporteService: Calculando estadísticas mensuales optimizadas');
      
      // Validar fechas
      if (!fechaInicio || !fechaFin) {
        throw new Error('Las fechas de inicio y fin son requeridas');
      }
      
      const fechaInicioDate = new Date(fechaInicio);
      const fechaFinDate = new Date(fechaFin);
      
      if (fechaInicioDate > fechaFinDate) {
        throw new Error('La fecha de inicio no puede ser mayor que la fecha de fin');
      }
      
      const estadisticasMensuales = await this.reporteRepository.obtenerEstadisticasMensuales(
        fechaInicio, 
        fechaFin, 
        opciones
      );
      
      // Calcular tendencias y métricas adicionales
      const metricas = this._calcularTendenciasMensuales(estadisticasMensuales);
      
      return {
        success: true,
        data: {
          estadisticas_por_mes: estadisticasMensuales,
          resumen: metricas,
          rango: { fechaInicio, fechaFin }
        }
      };
      
    } catch (error) {
      console.error('❌ Error en ReporteService.obtenerEstadisticasMensuales:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: { estadisticas_por_mes: [], resumen: {}, rango: { fechaInicio, fechaFin } }
      };
    }
  }
  
  /**
   * Calcular tendencias mensuales
   * @param {Array} estadisticasMensuales - Estadísticas por mes
   * @returns {Object} Métricas de tendencias
   * @private
   */
  _calcularTendenciasMensuales(estadisticasMensuales) {
    if (!estadisticasMensuales || estadisticasMensuales.length === 0) {
      return {
        total_meses: 0,
        promedio_reportes_mes: 0,
        mes_mas_activo: null,
        mes_menos_activo: null,
        tendencia: 'sin_datos'
      };
    }
    
    const totalReportes = estadisticasMensuales.reduce((sum, mes) => sum + mes.total_reportes, 0);
    const promedioReportesMes = Math.round((totalReportes / estadisticasMensuales.length) * 100) / 100;
    
    const mesMasActivo = estadisticasMensuales.reduce((max, mes) => 
      mes.total_reportes > max.total_reportes ? mes : max
    );
    
    const mesMenosActivo = estadisticasMensuales.reduce((min, mes) => 
      mes.total_reportes < min.total_reportes ? mes : min
    );
    
    // Calcular tendencia (comparar primeros 3 meses con últimos 3 meses)
    let tendencia = 'estable';
    if (estadisticasMensuales.length >= 6) {
      const primerosTres = estadisticasMensuales.slice(-3).reduce((sum, mes) => sum + mes.total_reportes, 0) / 3;
      const ultimosTres = estadisticasMensuales.slice(0, 3).reduce((sum, mes) => sum + mes.total_reportes, 0) / 3;
      
      if (ultimosTres > primerosTres * 1.1) {
        tendencia = 'creciente';
      } else if (ultimosTres < primerosTres * 0.9) {
        tendencia = 'decreciente';
      }
    }
    
    return {
      total_meses: estadisticasMensuales.length,
      total_reportes: totalReportes,
      promedio_reportes_mes: promedioReportesMes,
      mes_mas_activo: {
        mes: mesMasActivo.mes,
        reportes: mesMasActivo.total_reportes
      },
      mes_menos_activo: {
        mes: mesMenosActivo.mes,
        reportes: mesMenosActivo.total_reportes
      },
      tendencia
    };
  }
  
  /**
   * Validar datos de reporte
   * @param {Object} datosReporte - Datos a validar
   * @returns {Object} Resultado de la validación
   */
  async validarDatosReporte(datosReporte) {
    try {
      const validacion = await this.crearReporteUseCase.validarDatos(datosReporte);
      
      return {
        success: true,
        data: validacion
      };
      
    } catch (error) {
      console.error('❌ Error en ReporteService.validarDatosReporte:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: { valido: false, error: error.message }
      };
    }
  }
  
  /**
   * Contar reportes por barrio
   * @param {string} barrio - Nombre del barrio
   * @param {Object} opciones - Opciones de filtro
   * @returns {Object} Resultado con conteo
   */
  async contarReportesPorBarrio(barrio, opciones = {}) {
    try {
      console.log('🔢 ReporteService: Contando reportes de', barrio);
      
      if (!barrio) {
        throw new Error('El barrio es requerido');
      }
      
      const count = await this.reporteRepository.contarPorBarrio(barrio, opciones);
      
      return {
        success: true,
        data: { barrio, count }
      };
      
    } catch (error) {
      console.error('❌ Error en ReporteService.contarReportesPorBarrio:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: { barrio, count: 0 }
      };
    }
  }
  
  /**
   * Obtener todos los reportes (para panel de administración)
   * @param {Object} filtros - Filtros opcionales (fecha_inicio, fecha_fin)
   * @returns {Object} Resultado con todos los reportes
   */
  async obtenerTodosLosReportes(filtros = {}) {
    try {
      console.log('📊 ReporteService: Obteniendo todos los reportes');
      console.log('📊 Filtros aplicados:', filtros);
      
      // Preparar opciones para el repositorio
      const opciones = {};
      
      if (filtros.fecha_inicio) {
        opciones.fechaInicio = filtros.fecha_inicio;
      }
      
      if (filtros.fecha_fin) {
        opciones.fechaFin = filtros.fecha_fin;
      }
      
      // Obtener todos los reportes del repositorio
      const reportes = await this.reporteRepository.obtenerTodos(opciones);
      
      console.log(`✅ ReporteService: ${reportes.length} reportes obtenidos`);
      
      return {
        success: true,
        data: reportes
      };
      
    } catch (error) {
      console.error('❌ Error en ReporteService.obtenerTodosLosReportes:', error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default ReporteService;