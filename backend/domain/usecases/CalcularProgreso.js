// backend/domain/usecases/CalcularProgreso.js
// Caso de uso para calcular progreso - Lógica de cálculos y métricas

class CalcularProgreso {
  constructor(cicloRepository, progresoRepository, manzanasRepository) {
    this.cicloRepository = cicloRepository;
    this.progresoRepository = progresoRepository;
    this.manzanasRepository = manzanasRepository;
  }
  
  /**
   * Calcular progreso detallado de un ciclo
   * @param {string} cicloId - ID del ciclo
   * @returns {Object} Progreso detallado
   */
  async calcularProgresoCiclo(cicloId) {
    try {
      // Obtener información del ciclo
      const ciclo = await this.cicloRepository.obtenerPorId(cicloId);
      if (!ciclo) {
        throw new Error('Ciclo no encontrado');
      }
      
      // Obtener progreso de territorios
      const progresoTerritorios = await this.progresoRepository.obtenerPorCiclo(cicloId);
      
      // Calcular métricas
      const metricas = await this.calcularMetricas(ciclo, progresoTerritorios);
      
      return {
        ciclo: {
          id: ciclo.id,
          barrio: ciclo.barrio,
          numero_ciclo: ciclo.numero_ciclo,
          estado: ciclo.estado,
          fecha_inicio: ciclo.fecha_inicio,
          fecha_fin: ciclo.fecha_fin
        },
        progreso: metricas,
        territorios: this.agruparTerritoriosPorFecha(progresoTerritorios)
      };
      
    } catch (error) {
      console.error('❌ Error calculando progreso del ciclo:', error.message);
      throw error;
    }
  }
  
  /**
   * Calcular progreso de todos los barrios
   * @returns {Array} Progreso de todos los barrios
   */
  async calcularProgresoTodosBarrios() {
    try {
      const barrios = [
        'Alcalá', 'Acacios', 'Ciudad Jardín', 'Guaimaral',
        'La Mar y Gratamira', 'Niza', 'Prados Norte', 'Próceres',
        'San Eduardo', 'Santa Elena', 'Tasajero', 'Zulima'
      ];
      
      const progresoBarrios = [];
      
      for (const barrio of barrios) {
        try {
          const progreso = await this.calcularProgresoBarrio(barrio);
          progresoBarrios.push(progreso);
        } catch (error) {
          console.error(`❌ Error calculando progreso de ${barrio}:`, error.message);
          // Agregar barrio con error
          progresoBarrios.push({
            barrio,
            error: error.message,
            progreso_porcentaje: 0,
            estado: 'error'
          });
        }
      }
      
      return progresoBarrios;
      
    } catch (error) {
      console.error('❌ Error calculando progreso de todos los barrios:', error.message);
      throw error;
    }
  }
  
  /**
   * Calcular progreso de un barrio específico
   * @param {string} barrio - Nombre del barrio
   * @returns {Object} Progreso del barrio
   */
  async calcularProgresoBarrio(barrio) {
    try {
      // Obtener ciclo activo
      const cicloActivo = await this.cicloRepository.obtenerCicloActivo(barrio);
      
      if (!cicloActivo) {
        // CORREGIDO: Mostrar total real de territorios incluso sin ciclo activo
        const totalTerritoriosReal = await this._obtenerTotalTerritoriosReal(barrio);
        return {
          barrio,
          estado: 'sin_ciclo',
          progreso_porcentaje: 0,
          territorios_completados: 0,
          total_territorios: totalTerritoriosReal, // ✅ MOSTRAR TOTAL REAL
          numero_ciclo: 0,
          fecha_inicio: null
        };
      }
      
      // Calcular progreso del ciclo activo
      const progresoCiclo = await this.calcularProgresoCiclo(cicloActivo.id);
      
      return {
        barrio,
        estado: cicloActivo.estado,
        progreso_porcentaje: progresoCiclo.progreso.progreso_porcentaje,
        territorios_completados: progresoCiclo.progreso.territorios_completados,
        total_territorios: progresoCiclo.progreso.total_territorios,
        numero_ciclo: cicloActivo.numero_ciclo,
        fecha_inicio: cicloActivo.fecha_inicio,
        dias_transcurridos: this.calcularDiasTranscurridos(cicloActivo.fecha_inicio),
        velocidad_promedio: progresoCiclo.progreso.velocidad_promedio
      };
      
    } catch (error) {
      console.error(`❌ Error calculando progreso de ${barrio}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Calcular métricas detalladas
   * @param {Object} ciclo - Datos del ciclo
   * @param {Array} progresoTerritorios - Array de progreso de territorios
   * @returns {Promise<Object>} Métricas calculadas
   */
  async calcularMetricas(ciclo, progresoTerritorios) {
    const territoriosCompletados = progresoTerritorios.length;
    // REUTILIZAR: Usar conteo real desde BD con fallback a valores hardcodeados
    const totalTerritorios = await this._obtenerTotalTerritoriosReal(ciclo.barrio);
    const progresoPorcentaje = totalTerritorios > 0 
      ? (territoriosCompletados / totalTerritorios) * 100 
      : 0;
    
    // Calcular días transcurridos
    const diasTranscurridos = this.calcularDiasTranscurridos(ciclo.fecha_inicio);
    
    // Calcular velocidad promedio (territorios por día)
    const velocidadPromedio = diasTranscurridos > 0 
      ? territoriosCompletados / diasTranscurridos 
      : 0;
    
    // Calcular estimación de finalización
    const territoriosRestantes = totalTerritorios - territoriosCompletados;
    const diasEstimadosRestantes = velocidadPromedio > 0 
      ? Math.ceil(territoriosRestantes / velocidadPromedio) 
      : null;
    
    // Calcular fecha estimada de finalización
    const fechaEstimadaFinalizacion = diasEstimadosRestantes 
      ? this.calcularFechaEstimada(diasEstimadosRestantes)
      : null;
    
    return {
      territorios_completados: territoriosCompletados,
      total_territorios: totalTerritorios,
      territorios_restantes: territoriosRestantes,
      progreso_porcentaje: Math.round(progresoPorcentaje * 100) / 100, // 2 decimales
      dias_transcurridos: diasTranscurridos,
      velocidad_promedio: Math.round(velocidadPromedio * 100) / 100, // 2 decimales
      dias_estimados_restantes: diasEstimadosRestantes,
      fecha_estimada_finalizacion: fechaEstimadaFinalizacion,
      estado_progreso: this.determinarEstadoProgreso(progresoPorcentaje)
    };
  }
  
  /**
   * Agrupar territorios por fecha trabajada
   * @param {Array} progresoTerritorios - Array de progreso
   * @returns {Object} Territorios agrupados por fecha
   */
  agruparTerritoriosPorFecha(progresoTerritorios) {
    const agrupados = {};
    
    progresoTerritorios.forEach(progreso => {
      const fecha = progreso.fecha_trabajado;
      if (!agrupados[fecha]) {
        agrupados[fecha] = [];
      }
      agrupados[fecha].push({
        territorio: progreso.territorio,
        reporte_id: progreso.reporte_id
      });
    });
    
    // Ordenar fechas descendente
    const fechasOrdenadas = Object.keys(agrupados).sort((a, b) => new Date(b) - new Date(a));
    
    const resultado = {};
    fechasOrdenadas.forEach(fecha => {
      resultado[fecha] = {
        territorios: agrupados[fecha],
        cantidad: agrupados[fecha].length
      };
    });
    
    return resultado;
  }
  
  /**
   * Calcular días transcurridos desde una fecha
   * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
   * @returns {number} Días transcurridos
   */
  calcularDiasTranscurridos(fechaInicio) {
    const inicio = new Date(fechaInicio);
    const hoy = new Date();
    const diferencia = hoy - inicio;
    return Math.floor(diferencia / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir el día actual
  }
  
  /**
   * Calcular fecha estimada de finalización
   * @param {number} diasRestantes - Días restantes estimados
   * @returns {string} Fecha estimada (YYYY-MM-DD)
   */
  calcularFechaEstimada(diasRestantes) {
    const hoy = new Date();
    const fechaEstimada = new Date(hoy.getTime() + (diasRestantes * 24 * 60 * 60 * 1000));
    return fechaEstimada.toISOString().split('T')[0];
  }
  
  /**
   * Determinar estado del progreso
   * @param {number} progresoPorcentaje - Porcentaje de progreso
   * @returns {string} Estado del progreso
   */
  determinarEstadoProgreso(progresoPorcentaje) {
    if (progresoPorcentaje === 0) return 'no_iniciado';
    if (progresoPorcentaje < 25) return 'iniciando';
    if (progresoPorcentaje < 50) return 'en_progreso_inicial';
    if (progresoPorcentaje < 75) return 'en_progreso_medio';
    if (progresoPorcentaje < 90) return 'en_progreso_avanzado';
    if (progresoPorcentaje < 100) return 'finalizando';
    return 'completado';
  }
  
  /**
   * Obtener estadísticas generales del sistema
   * @returns {Object} Estadísticas generales
   */
  async obtenerEstadisticasGenerales() {
    try {
      const progresoBarrios = await this.calcularProgresoTodosBarrios();
      
      const estadisticas = {
        total_barrios: progresoBarrios.length,
        barrios_activos: progresoBarrios.filter(b => b.estado === 'activo').length,
        barrios_completados: progresoBarrios.filter(b => b.estado === 'completado').length,
        barrios_sin_ciclo: progresoBarrios.filter(b => b.estado === 'sin_ciclo').length,
        progreso_promedio: this.calcularProgresoPromedio(progresoBarrios),
        territorios_totales: progresoBarrios.reduce((sum, b) => sum + (b.total_territorios || 0), 0),
        territorios_completados: progresoBarrios.reduce((sum, b) => sum + (b.territorios_completados || 0), 0),
        velocidad_promedio_sistema: this.calcularVelocidadPromedioSistema(progresoBarrios)
      };
      
      return {
        estadisticas,
        barrios: progresoBarrios,
        fecha_calculo: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas generales:', error.message);
      throw error;
    }
  }
  
  /**
   * Calcular progreso promedio del sistema
   * @param {Array} progresoBarrios - Array de progreso de barrios
   * @returns {number} Progreso promedio
   */
  calcularProgresoPromedio(progresoBarrios) {
    const barriosConProgreso = progresoBarrios.filter(b => b.estado !== 'error' && b.estado !== 'sin_ciclo');
    if (barriosConProgreso.length === 0) return 0;
    
    const sumaProgreso = barriosConProgreso.reduce((sum, b) => sum + (b.progreso_porcentaje || 0), 0);
    return Math.round((sumaProgreso / barriosConProgreso.length) * 100) / 100;
  }
  
  /**
   * Calcular velocidad promedio del sistema
   * @param {Array} progresoBarrios - Array de progreso de barrios
   * @returns {number} Velocidad promedio
   */
  calcularVelocidadPromedioSistema(progresoBarrios) {
    const barriosConVelocidad = progresoBarrios.filter(b => b.velocidad_promedio && b.velocidad_promedio > 0);
    if (barriosConVelocidad.length === 0) return 0;
    
    const sumaVelocidad = barriosConVelocidad.reduce((sum, b) => sum + b.velocidad_promedio, 0);
    return Math.round((sumaVelocidad / barriosConVelocidad.length) * 100) / 100;
  }
  
  /**
   * Obtener total real de territorios por barrio
   * VERSIÓN DINÁMICA: Consulta la tabla de referencia primero, fallback a valores hardcodeados
   * @param {string} barrio - Nombre del barrio
   * @returns {Promise<number>} Total real de territorios
   * @private
   */
  async _obtenerTotalTerritoriosReal(barrio) {
    try {
      // 1. PRIORIDAD: Consultar tabla de referencia dinámica
      if (this.manzanasRepository) {
        const totalDinamico = await this.manzanasRepository.obtenerTotalManzanasPorBarrio(barrio);
        
        if (totalDinamico > 0) {
          console.log(`📍 Total dinámico para ${barrio}: ${totalDinamico} (desde BD)`);
          return totalDinamico;
        }
      }
      
      // 2. FALLBACK: Valores hardcodeados como respaldo
      const territoriosReales = {
        'Acacios': 19,                    // ✅ Correcto (A-127 a A-145)
        'Alcalá': 12,                     // ✅ Correcto (AL-72 a AL-83)
        'Ciudad Jardín': 17,              // ✅ CORREGIDO: era 35, ahora 17 (CJ-110 a CJ-126)
        'Guaimaral': 12,                  // ✅ CORREGIDO: era 55, ahora 12 (G-146 a G-157)
        'La Mar y Gratamira': 16,         // ✅ Correcto (MG-158 a MG-173)
        'Niza': 36,                       // ✅ CORREGIDO: era 65, ahora 36 (N-37 a N-71 + MG-160)
        'Prados Norte': 47,               // ✅ CORREGIDO: era 30, ahora 47 (PN-223 a PN-269)
        'Próceres': 14,                   // ✅ CORREGIDO: era 25, ahora 14 (P-84 a P-97)
        'San Eduardo': 12,                // ✅ CORREGIDO: era 40, ahora 12 (S-98 a S-109)
        'Santa Elena': 10,                // ✅ CORREGIDO: era 35, ahora 10 (SE-27 a SE-36)
        'Tasajero': 16,                   // ✅ CORREGIDO: era 45, ahora 16 (T-12 a T-27)
        'Zulima': 49                      // ✅ Correcto (Z-174 a Z-222)
      };
      
      const totalFallback = territoriosReales[barrio] || 0;
      console.log(`📍 Total fallback para ${barrio}: ${totalFallback} (hardcodeado)`);
      return totalFallback;
      
    } catch (error) {
      console.error(`❌ Error obteniendo total de ${barrio}:`, error.message);
      return 0;
    }
  }
}

export default CalcularProgreso;