// backend/application/services/ProgresoService.js
// Servicio de aplicación para progreso de territorios

/**
 * @implements {import('../../domain/types').IProgresoService}
 */
class ProgresoService {
  constructor(progresoRepository) {
    this.progresoRepository = progresoRepository;
  }
  
  /**
   * Registrar territorios trabajados en un ciclo
   * @param {Object} params - Parámetros
   * @returns {Object} Resultado del registro
   */
  async registrarTerritorios(params) {
    try {
      console.log('📍 ProgresoService: Registrando territorios');
      
      const { cicloId, territorios, reporteId } = params;
      
      // Validar parámetros
      if (!cicloId || !territorios || !reporteId) {
        throw new Error('cicloId, territorios y reporteId son requeridos');
      }
      
      if (!Array.isArray(territorios) || territorios.length === 0) {
        throw new Error('Los territorios deben ser un array no vacío');
      }
      
      const territoriosRegistrados = [];
      const territoriosExistentes = [];
      const errores = [];
      
      // Procesar cada territorio
      for (const territorio of territorios) {
        try {
          // Verificar si ya existe
          const existe = await this.progresoRepository.existeTerritorio(cicloId, territorio);
          
          if (existe) {
            territoriosExistentes.push(territorio);
            console.log(`⚠️ Territorio ${territorio} ya existe en el ciclo`);
            continue;
          }
          
          // Crear progreso
          const progreso = await this.progresoRepository.crear({
            ciclo_id: cicloId,
            territorio: territorio.trim().toUpperCase(),
            reporte_id: reporteId
          });
          
          territoriosRegistrados.push(progreso);
          console.log(`✅ Territorio ${territorio} registrado`);
          
        } catch (error) {
          console.error(`❌ Error registrando territorio ${territorio}:`, error.message);
          errores.push({ territorio, error: error.message });
        }
      }
      
      return {
        success: true,
        data: {
          territorios_registrados: territoriosRegistrados,
          territorios_existentes: territoriosExistentes,
          errores: errores,
          total_procesados: territorios.length,
          total_registrados: territoriosRegistrados.length
        },
        message: `${territoriosRegistrados.length} territorios registrados exitosamente`
      };
      
    } catch (error) {
      console.error('❌ Error en ProgresoService.registrarTerritorios:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * Calcular progreso de un ciclo
   * @param {string} cicloId - ID del ciclo
   * @returns {Object} Resultado con progreso calculado
   */
  async calcularProgreso(cicloId) {
    try {
      console.log('📊 ProgresoService: Calculando progreso del ciclo', cicloId);
      
      if (!cicloId) {
        throw new Error('El ID del ciclo es requerido');
      }
      
      const territoriosCompletados = await this.progresoRepository.contarPorCiclo(cicloId);
      
      return {
        success: true,
        data: {
          territorios_completados: territoriosCompletados,
          ciclo_id: cicloId
        }
      };
      
    } catch (error) {
      console.error('❌ Error en ProgresoService.calcularProgreso:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * Obtener progreso por ciclo
   * @param {string} cicloId - ID del ciclo
   * @param {Object} opciones - Opciones de consulta
   * @returns {Object} Resultado con progreso
   */
  async obtenerProgresoPorCiclo(cicloId, opciones = {}) {
    try {
      console.log('📊 ProgresoService: Obteniendo progreso del ciclo', cicloId);
      
      if (!cicloId) {
        throw new Error('El ID del ciclo es requerido');
      }
      
      const progreso = await this.progresoRepository.obtenerPorCiclo(cicloId, opciones);
      
      return {
        success: true,
        data: progreso,
        total: progreso.length,
        ciclo_id: cicloId
      };
      
    } catch (error) {
      console.error('❌ Error en ProgresoService.obtenerProgresoPorCiclo:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
  
  /**
   * Obtener progreso por reporte
   * @param {string} reporteId - ID del reporte
   * @returns {Object} Resultado con progreso
   */
  async obtenerProgresoPorReporte(reporteId) {
    try {
      console.log('📊 ProgresoService: Obteniendo progreso del reporte', reporteId);
      
      if (!reporteId) {
        throw new Error('El ID del reporte es requerido');
      }
      
      const progreso = await this.progresoRepository.obtenerPorReporte(reporteId);
      
      return {
        success: true,
        data: progreso,
        total: progreso.length,
        reporte_id: reporteId
      };
      
    } catch (error) {
      console.error('❌ Error en ProgresoService.obtenerProgresoPorReporte:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
  
  /**
   * Obtener historial de un territorio
   * @param {string} territorio - Nombre del territorio
   * @param {Object} opciones - Opciones de consulta
   * @returns {Object} Resultado con historial
   */
  async obtenerHistorialTerritorio(territorio, opciones = {}) {
    try {
      console.log('📚 ProgresoService: Obteniendo historial del territorio', territorio);
      
      if (!territorio) {
        throw new Error('El territorio es requerido');
      }
      
      const historial = await this.progresoRepository.obtenerPorTerritorio(territorio, opciones);
      
      return {
        success: true,
        data: historial,
        total: historial.length,
        territorio: territorio.toUpperCase()
      };
      
    } catch (error) {
      console.error('❌ Error en ProgresoService.obtenerHistorialTerritorio:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
  
  /**
   * Obtener progreso por rango de fechas
   * @param {string} fechaInicio - Fecha de inicio
   * @param {string} fechaFin - Fecha de fin
   * @param {Object} opciones - Opciones adicionales
   * @returns {Object} Resultado con progreso
   */
  async obtenerProgresoPorRango(fechaInicio, fechaFin, opciones = {}) {
    try {
      console.log('📅 ProgresoService: Obteniendo progreso del', fechaInicio, 'al', fechaFin);
      
      // Validar fechas
      if (!fechaInicio || !fechaFin) {
        throw new Error('Las fechas de inicio y fin son requeridas');
      }
      
      const fechaInicioDate = new Date(fechaInicio);
      const fechaFinDate = new Date(fechaFin);
      
      if (fechaInicioDate > fechaFinDate) {
        throw new Error('La fecha de inicio no puede ser mayor que la fecha de fin');
      }
      
      const progreso = await this.progresoRepository.obtenerPorRangoFechas(
        fechaInicio,
        fechaFin,
        opciones
      );
      
      return {
        success: true,
        data: progreso,
        total: progreso.length,
        rango: { fechaInicio, fechaFin }
      };
      
    } catch (error) {
      console.error('❌ Error en ProgresoService.obtenerProgresoPorRango:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
  
  /**
   * Verificar si un territorio existe en un ciclo
   * @param {string} cicloId - ID del ciclo
   * @param {string} territorio - Nombre del territorio
   * @returns {Object} Resultado de la verificación
   */
  async verificarTerritorioEnCiclo(cicloId, territorio) {
    try {
      console.log('🔍 ProgresoService: Verificando territorio', territorio, 'en ciclo', cicloId);
      
      if (!cicloId || !territorio) {
        throw new Error('El cicloId y territorio son requeridos');
      }
      
      const existe = await this.progresoRepository.existeTerritorio(cicloId, territorio);
      
      return {
        success: true,
        data: {
          existe,
          ciclo_id: cicloId,
          territorio: territorio.toUpperCase()
        }
      };
      
    } catch (error) {
      console.error('❌ Error en ProgresoService.verificarTerritorioEnCiclo:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * Actualizar progreso existente
   * @param {string} id - ID del progreso
   * @param {Object} datosActualizacion - Datos a actualizar
   * @returns {Object} Resultado de la actualización
   */
  async actualizarProgreso(id, datosActualizacion) {
    try {
      console.log('📝 ProgresoService: Actualizando progreso', id);
      
      if (!id) {
        throw new Error('El ID del progreso es requerido');
      }
      
      // Filtrar campos permitidos
      const camposPermitidos = ['fecha_trabajado'];
      const datosLimpios = {};
      
      Object.keys(datosActualizacion).forEach(campo => {
        if (camposPermitidos.includes(campo)) {
          datosLimpios[campo] = datosActualizacion[campo];
        }
      });
      
      if (Object.keys(datosLimpios).length === 0) {
        throw new Error('No hay campos válidos para actualizar');
      }
      
      const progresoActualizado = await this.progresoRepository.actualizar(id, datosLimpios);
      
      return {
        success: true,
        data: progresoActualizado,
        message: 'Progreso actualizado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error en ProgresoService.actualizarProgreso:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * Eliminar progreso
   * @param {string} id - ID del progreso
   * @returns {Object} Resultado de la eliminación
   */
  async eliminarProgreso(id) {
    try {
      console.log('🗑️ ProgresoService: Eliminando progreso', id);
      
      if (!id) {
        throw new Error('El ID del progreso es requerido');
      }
      
      const eliminado = await this.progresoRepository.eliminar(id);
      
      return {
        success: true,
        data: { id, eliminado },
        message: 'Progreso eliminado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error en ProgresoService.eliminarProgreso:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * Obtener estadísticas de progreso
   * @param {Object} opciones - Opciones de consulta
   * @returns {Object} Resultado con estadísticas
   */
  async obtenerEstadisticas(opciones = {}) {
    try {
      console.log('📊 ProgresoService: Obteniendo estadísticas de progreso');
      
      const estadisticas = await this.progresoRepository.obtenerEstadisticas(opciones);
      
      return {
        success: true,
        data: estadisticas
      };
      
    } catch (error) {
      console.error('❌ Error en ProgresoService.obtenerEstadisticas:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  /**
   * Obtener territorios más trabajados
   * @param {Object} opciones - Opciones de consulta
   * @returns {Object} Resultado con territorios
   */
  async obtenerTerritoriosMasTrabajados(opciones = {}) {
    try {
      console.log('🏆 ProgresoService: Obteniendo territorios más trabajados');
      
      const territorios = await this.progresoRepository.obtenerTerritoriosMasTrabajados(opciones);
      
      return {
        success: true,
        data: territorios,
        total: territorios.length
      };
      
    } catch (error) {
      console.error('❌ Error en ProgresoService.obtenerTerritoriosMasTrabajados:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
  
  /**
   * Contar territorios por ciclo
   * @param {string} cicloId - ID del ciclo
   * @returns {Object} Resultado con conteo
   */
  async contarTerritoriosPorCiclo(cicloId) {
    try {
      console.log('🔢 ProgresoService: Contando territorios del ciclo', cicloId);
      
      if (!cicloId) {
        throw new Error('El ID del ciclo es requerido');
      }
      
      const count = await this.progresoRepository.contarPorCiclo(cicloId);
      
      return {
        success: true,
        data: { ciclo_id: cicloId, count }
      };
      
    } catch (error) {
      console.error('❌ Error en ProgresoService.contarTerritoriosPorCiclo:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: { ciclo_id: cicloId, count: 0 }
      };
    }
  }
}

export default ProgresoService;