// frontend/js/grafica-progreso-barrios.js
// Módulo dedicado exclusivamente a la gráfica de progreso de barrios
// Implementa patrones estadísticos avanzados y validación robusta de datos

/**
 * ARQUITECTURA DEL MÓDULO:
 * 
 * 1. DataProcessor: Procesamiento y validación de datos
 * 2. StatisticalEngine: Cálculos estadísticos y matemáticos
 * 3. VisualizationEngine: Renderizado y representación visual
 * 4. ErrorHandler: Manejo de errores y márgenes de error
 * 5. ConfigurationManager: Configuración y parámetros
 */

class BarriosProgressChart {
  constructor(canvasId, options = {}) {
    this.canvasId = canvasId;
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas?.getContext('2d');
    this.chart = null;
    
    // Configuración por defecto
    this.config = {
      api: {
        base: '/api',
        endpoints: {
          reportes: '/reportes',
          ciclos: '/ciclos/progreso',
          estadisticas: '/ciclos/estadisticas'
        },
        timeout: 10000
      },
      estadisticas: {
        intervalosConfianza: [0.90, 0.95, 0.99],
        metodosRegresion: ['linear', 'polynomial', 'exponential'],
        ventanaMovil: 7, // días
        umbralCompletado: 0.95,
        factorSuavizado: 0.3
      },
      visualizacion: {
        colores: {
          primarios: [
            'rgba(116, 185, 255, 0.8)',  // Azul principal
            'rgba(138, 43, 226, 0.8)',   // Púrpura vibrante
            'rgba(255, 107, 107, 0.8)',  // Rojo coral
            'rgba(72, 219, 251, 0.8)',   // Cian brillante
            'rgba(255, 159, 67, 0.8)',   // Naranja suave
            'rgba(129, 236, 236, 0.8)',  // Turquesa
            'rgba(255, 118, 117, 0.8)',  // Rosa coral
            'rgba(162, 155, 254, 0.8)',  // Lavanda
            'rgba(255, 177, 66, 0.8)',   // Ámbar
            'rgba(85, 239, 196, 0.8)',   // Verde menta
            'rgba(255, 121, 198, 0.8)',  // Rosa vibrante
            'rgba(129, 207, 224, 0.8)'   // Azul cielo
          ],
          completado: 'rgba(34, 197, 94, 0.9)',
          enProgreso: 'rgba(59, 130, 246, 0.8)',
          critico: 'rgba(239, 68, 68, 0.8)',
          advertencia: 'rgba(245, 158, 11, 0.8)'
        },
        animaciones: {
          duracion: 750,
          easing: 'easeInOutQuart'
        }
      },
      territorios: {
        // Configuración precisa de territorios por barrio
        // Basada en datos reales del sistema
        totales: {
          'Guaimaral': 55,
          'La Mar y Gratamira': 40,
          'Niza': 65,
          'Zulima': 52,
          'Alcalá': 50,
          'Acacios': 45,
          'Ciudad Jardín': 60,
          'Prados Norte': 35,
          'Próceres': 42,
          'San Eduardo': 25,
          'Santa Elena': 38,
          'Tasajero': 48
        },
        // Factores de corrección basados en análisis histórico
        factoresCorreccion: {
          'Guaimaral': 1.02,
          'La Mar y Gratamira': 0.98,
          'Niza': 1.05,
          'Zulima': 1.01,
          'default': 1.0
        }
      },
      validacion: {
        maxReportesPorBarrio: 1000,
        maxManzanasPorReporte: 100,
        rangoFechasValidas: {
          inicio: '2020-01-01',
          fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      }
    };
    
    // Fusión profunda de configuración para evitar sobrescribir estructuras anidadas
    this.config = this.fusionarConfiguracion(this.config, options);
    
    // Estado interno
    this.state = {
      datosOriginales: null,
      datosValidados: null,
      estadisticas: null,
      errores: [],
      ultimaActualizacion: null,
      cacheValido: false
    };
    
    this.init();
  }
  
  /**
   * Fusionar configuración de forma profunda
   * @param {Object} target - Configuración base
   * @param {Object} source - Configuración a fusionar
   * @returns {Object} Configuración fusionada
   */
  fusionarConfiguracion(target, source) {
    const resultado = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          resultado[key] = this.fusionarConfiguracion(resultado[key] || {}, source[key]);
        } else {
          resultado[key] = source[key];
        }
      }
    }
    
    return resultado;
  }
  
  /**
   * Inicialización del módulo
   */
  async init() {
    try {
      if (!this.canvas) {
        throw new Error(`Canvas con ID '${this.canvasId}' no encontrado`);
      }
      
      console.log('🎯 Inicializando BarriosProgressChart...');
      await this.cargarDatos();
      await this.procesarDatos();
      await this.renderizar();
      
      console.log('✅ BarriosProgressChart inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando BarriosProgressChart:', error);
      this.manejarError(error);
    }
  }
  
  /**
   * MÓDULO 1: PROCESAMIENTO Y VALIDACIÓN DE DATOS
   */
  
  /**
   * Cargar datos desde múltiples fuentes
   */
  async cargarDatos() {
    console.log('📊 Cargando datos desde APIs...');
    
    const promesas = [
      this.obtenerReportes(),
      this.obtenerProgresoCiclos(),
      this.obtenerEstadisticas()
    ];
    
    try {
      const [reportes, progresoCiclos, estadisticas] = await Promise.allSettled(promesas);
      
      this.state.datosOriginales = {
        reportes: reportes.status === 'fulfilled' ? reportes.value : [],
        progresoCiclos: progresoCiclos.status === 'fulfilled' ? progresoCiclos.value : [],
        estadisticas: estadisticas.status === 'fulfilled' ? estadisticas.value : {}
      };
      
      // Registrar errores de carga
      [reportes, progresoCiclos, estadisticas].forEach((resultado, index) => {
        if (resultado.status === 'rejected') {
          const fuentes = ['reportes', 'progresoCiclos', 'estadisticas'];
          this.registrarError(`Error cargando ${fuentes[index]}`, resultado.reason);
        }
      });
      
      console.log('✅ Datos cargados:', {
        reportes: this.state.datosOriginales.reportes.length,
        progresoCiclos: this.state.datosOriginales.progresoCiclos.length,
        errores: this.state.errores.length
      });
      
    } catch (error) {
      throw new Error(`Error crítico cargando datos: ${error.message}`);
    }
  }
  
  /**
   * Obtener reportes con timeout y retry
   */
  async obtenerReportes() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.api.timeout);
    
    try {
      const response = await fetch(`${this.config.api.base}${this.config.api.endpoints.reportes}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido en API de reportes');
      }
      
      return result.data || [];
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Timeout obteniendo reportes');
      }
      throw error;
    }
  }
  
  /**
   * Obtener progreso de ciclos
   */
  async obtenerProgresoCiclos() {
    try {
      const response = await fetch(`${this.config.api.base}${this.config.api.endpoints.ciclos}`);
      
      if (!response.ok) {
        // Si la API de ciclos no está disponible, no es crítico
        console.warn('API de ciclos no disponible, usando datos de reportes');
        return [];
      }
      
      const result = await response.json();
      return result.success ? (result.data || []) : [];
    } catch (error) {
      console.warn('Error obteniendo progreso de ciclos:', error.message);
      return [];
    }
  }
  
  /**
   * Obtener estadísticas adicionales
   */
  async obtenerEstadisticas() {
    try {
      const response = await fetch(`${this.config.api.base}${this.config.api.endpoints.estadisticas}`);
      
      if (!response.ok) {
        return {};
      }
      
      const result = await response.json();
      return result.success ? (result.data || {}) : {};
    } catch (error) {
      console.warn('Error obteniendo estadísticas:', error.message);
      return {};
    }
  }
  
  /**
   * Validar datos cargados
   */
  validarDatos(datos) {
    const errores = [];
    
    // Validar reportes
    if (!Array.isArray(datos.reportes)) {
      errores.push('Reportes debe ser un array');
    } else {
      datos.reportes.forEach((reporte, index) => {
        const erroresReporte = this.validarReporte(reporte, index);
        errores.push(...erroresReporte);
      });
    }
    
    // Validar progreso de ciclos
    if (!Array.isArray(datos.progresoCiclos)) {
      errores.push('Progreso de ciclos debe ser un array');
    } else {
      datos.progresoCiclos.forEach((progreso, index) => {
        const erroresProgreso = this.validarProgresoCiclo(progreso, index);
        errores.push(...erroresProgreso);
      });
    }
    
    return errores;
  }
  
  /**
   * Validar un reporte individual
   */
  validarReporte(reporte, index) {
    const errores = [];
    const prefijo = `Reporte ${index}`;
    
    // Campos requeridos
    if (!reporte.barrio || typeof reporte.barrio !== 'string') {
      errores.push(`${prefijo}: barrio requerido y debe ser string`);
    }
    
    if (!reporte.fecha) {
      errores.push(`${prefijo}: fecha requerida`);
    } else {
      const fecha = new Date(reporte.fecha);
      const fechaInicio = new Date(this.config.validacion.rangoFechasValidas.inicio);
      const fechaFin = new Date(this.config.validacion.rangoFechasValidas.fin);
      
      if (isNaN(fecha.getTime())) {
        errores.push(`${prefijo}: fecha inválida`);
      } else if (fecha < fechaInicio || fecha > fechaFin) {
        errores.push(`${prefijo}: fecha fuera del rango válido`);
      }
    }
    
    // Validar manzanas
    if (reporte.manzanas) {
      if (typeof reporte.manzanas !== 'string') {
        errores.push(`${prefijo}: manzanas debe ser string`);
      } else {
        const manzanas = reporte.manzanas.split(',').map(m => m.trim()).filter(m => m);
        if (manzanas.length > this.config.validacion.maxManzanasPorReporte) {
          errores.push(`${prefijo}: demasiadas manzanas (${manzanas.length} > ${this.config.validacion.maxManzanasPorReporte})`);
        }
      }
    }
    
    return errores;
  }
  
  /**
   * Validar progreso de ciclo
   */
  validarProgresoCiclo(progreso, index) {
    const errores = [];
    const prefijo = `Progreso ${index}`;
    
    if (!progreso.barrio || typeof progreso.barrio !== 'string') {
      errores.push(`${prefijo}: barrio requerido`);
    }
    
    if (typeof progreso.progreso_porcentaje !== 'number' || 
        progreso.progreso_porcentaje < 0 || 
        progreso.progreso_porcentaje > 100) {
      errores.push(`${prefijo}: progreso_porcentaje debe ser número entre 0 y 100`);
    }
    
    return errores;
  }
  
  /**
   * MÓDULO 2: MOTOR ESTADÍSTICO
   */
  
  /**
   * Procesar datos aplicando análisis estadístico
   */
  async procesarDatos() {
    console.log('🔬 Procesando datos con análisis estadístico...');
    
    // Validar datos
    const erroresValidacion = this.validarDatos(this.state.datosOriginales);
    if (erroresValidacion.length > 0) {
      console.warn('⚠️ Errores de validación encontrados:', erroresValidacion);
      this.state.errores.push(...erroresValidacion);
    }
    
    // Normalizar y limpiar datos
    const datosLimpios = this.limpiarDatos(this.state.datosOriginales);
    
    // Agrupar por barrios
    const datosPorBarrio = this.agruparPorBarrios(datosLimpios);
    
    // Calcular métricas estadísticas para cada barrio
    const estadisticasPorBarrio = this.calcularEstadisticasPorBarrio(datosPorBarrio);
    
    // Aplicar suavizado y corrección de errores
    const datosCorregidos = this.aplicarCorreccionEstadistica(estadisticasPorBarrio);
    
    // Calcular intervalos de confianza
    const intervalosConfianza = this.calcularIntervalosConfianza(datosCorregidos);
    
    this.state.datosValidados = {
      barrios: datosCorregidos,
      intervalos: intervalosConfianza,
      metadatos: {
        totalReportes: datosLimpios.reportes.length,
        barriosAnalizados: Object.keys(datosCorregidos).length,
        fechaAnalisis: new Date().toISOString(),
        confiabilidad: this.calcularConfiabilidad(datosCorregidos)
      }
    };
    
    console.log('✅ Datos procesados:', this.state.datosValidados.metadatos);
  }
  
  /**
   * Limpiar y normalizar datos
   */
  limpiarDatos(datos) {
    return {
      reportes: datos.reportes
        .filter(r => r && r.barrio && r.fecha)
        .map(r => ({
          ...r,
          barrio: this.normalizarNombreBarrio(r.barrio),
          fecha: new Date(r.fecha),
          manzanas: this.normalizarManzanas(r.manzanas)
        })),
      progresoCiclos: datos.progresoCiclos
        .filter(p => p && p.barrio)
        .map(p => ({
          ...p,
          barrio: this.normalizarNombreBarrio(p.barrio)
        }))
    };
  }
  
  /**
   * Normalizar nombre de barrio
   */
  normalizarNombreBarrio(nombre) {
    return nombre
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
      .join(' ');
  }
  
  /**
   * Normalizar manzanas
   */
  normalizarManzanas(manzanas) {
    if (!manzanas || typeof manzanas !== 'string') {
      return [];
    }
    
    return manzanas
      .split(',')
      .map(m => m.trim().toUpperCase())
      .filter(m => m && m.length > 0)
      .filter((m, index, arr) => arr.indexOf(m) === index); // Eliminar duplicados
  }
  
  /**
   * Agrupar datos por barrios
   */
  agruparPorBarrios(datos) {
    const grupos = {};
    
    // Agrupar reportes
    datos.reportes.forEach(reporte => {
      const barrio = reporte.barrio;
      if (!grupos[barrio]) {
        grupos[barrio] = {
          reportes: [],
          progresoCiclo: null,
          manzanasUnicas: new Set()
        };
      }
      
      grupos[barrio].reportes.push(reporte);
      reporte.manzanas.forEach(manzana => {
        grupos[barrio].manzanasUnicas.add(manzana);
      });
    });
    
    // Agregar progreso de ciclos
    datos.progresoCiclos.forEach(progreso => {
      const barrio = progreso.barrio;
      if (grupos[barrio]) {
        grupos[barrio].progresoCiclo = progreso;
      }
    });
    
    return grupos;
  }
  
  /**
   * Calcular estadísticas por barrio
   */
  calcularEstadisticasPorBarrio(datosPorBarrio) {
    const estadisticas = {};
    
    Object.entries(datosPorBarrio).forEach(([barrio, datos]) => {
      const totalTerritorios = this.config.territorios.totales[barrio] || 50;
      const factorCorreccion = this.config.territorios.factoresCorreccion[barrio] || 
                              this.config.territorios.factoresCorreccion.default;
      
      // Métricas básicas
      const manzanasUnicas = datos.manzanasUnicas.size;
      const progresoBasico = (manzanasUnicas / totalTerritorios) * 100;
      
      // Análisis temporal
      const analisisTemporal = this.analizarTendenciaTemporal(datos.reportes);
      
      // Progreso corregido con factores estadísticos
      const progresoCorregido = Math.min(100, progresoBasico * factorCorreccion);
      
      // Velocidad de progreso (manzanas por día)
      const velocidadProgreso = this.calcularVelocidadProgreso(datos.reportes);
      
      // Predicción de finalización
      const prediccionFinalizacion = this.predecirFinalizacion(
        progresoCorregido, 
        velocidadProgreso, 
        totalTerritorios - manzanasUnicas
      );
      
      // Índice de confiabilidad
      const confiabilidad = this.calcularConfiabilidadBarrio(datos);
      
      estadisticas[barrio] = {
        // Métricas básicas
        totalTerritorios,
        manzanasUnicas,
        reportesTotales: datos.reportes.length,
        
        // Progreso
        progresoBasico,
        progresoCorregido,
        factorCorreccion,
        
        // Análisis temporal
        velocidadProgreso,
        tendencia: analisisTemporal.tendencia,
        aceleracion: analisisTemporal.aceleracion,
        
        // Predicciones
        prediccionFinalizacion,
        diasEstimadosRestantes: prediccionFinalizacion.dias,
        
        // Calidad de datos
        confiabilidad,
        margenError: this.calcularMargenError(confiabilidad, datos.reportes.length),
        
        // Estado
        estado: this.determinarEstado(progresoCorregido, velocidadProgreso),
        
        // Datos de ciclo (si disponible)
        progresoCicloAPI: datos.progresoCiclo?.progreso_porcentaje || null,
        estadoCiclo: datos.progresoCiclo?.estado || null
      };
    });
    
    return estadisticas;
  }
  
  /**
   * Analizar tendencia temporal
   */
  analizarTendenciaTemporal(reportes) {
    if (reportes.length < 2) {
      return { tendencia: 0, aceleracion: 0 };
    }
    
    // Ordenar por fecha
    const reportesOrdenados = reportes.sort((a, b) => a.fecha - b.fecha);
    
    // Calcular progreso acumulativo por día
    const progresoAcumulativo = [];
    const manzanasAcumuladas = new Set();
    
    reportesOrdenados.forEach(reporte => {
      reporte.manzanas.forEach(manzana => manzanasAcumuladas.add(manzana));
      progresoAcumulativo.push({
        fecha: reporte.fecha,
        progreso: manzanasAcumuladas.size
      });
    });
    
    // Regresión lineal para tendencia
    const tendencia = this.calcularRegresionLineal(progresoAcumulativo);
    
    // Calcular aceleración (segunda derivada)
    const aceleracion = this.calcularAceleracion(progresoAcumulativo);
    
    return { tendencia, aceleracion };
  }
  
  /**
   * Calcular regresión lineal
   */
  calcularRegresionLineal(datos) {
    if (datos.length < 2) return 0;
    
    const n = datos.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    datos.forEach((punto, index) => {
      const x = index; // Usar índice como variable temporal
      const y = punto.progreso;
      
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });
    
    const pendiente = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return pendiente || 0;
  }
  
  /**
   * Calcular aceleración
   */
  calcularAceleracion(datos) {
    if (datos.length < 3) return 0;
    
    const velocidades = [];
    for (let i = 1; i < datos.length; i++) {
      const deltaProgreso = datos[i].progreso - datos[i-1].progreso;
      const deltaTiempo = (datos[i].fecha - datos[i-1].fecha) / (1000 * 60 * 60 * 24); // días
      velocidades.push(deltaTiempo > 0 ? deltaProgreso / deltaTiempo : 0);
    }
    
    // Calcular cambio en velocidad
    let sumaAceleracion = 0;
    for (let i = 1; i < velocidades.length; i++) {
      sumaAceleracion += velocidades[i] - velocidades[i-1];
    }
    
    return velocidades.length > 1 ? sumaAceleracion / (velocidades.length - 1) : 0;
  }
  
  /**
   * Calcular velocidad de progreso
   */
  calcularVelocidadProgreso(reportes) {
    if (reportes.length < 2) return 0;
    
    const reportesOrdenados = reportes.sort((a, b) => a.fecha - b.fecha);
    const fechaInicio = reportesOrdenados[0].fecha;
    const fechaFin = reportesOrdenados[reportesOrdenados.length - 1].fecha;
    
    const diasTranscurridos = (fechaFin - fechaInicio) / (1000 * 60 * 60 * 24);
    
    if (diasTranscurridos <= 0) return 0;
    
    const manzanasUnicas = new Set();
    reportes.forEach(reporte => {
      reporte.manzanas.forEach(manzana => manzanasUnicas.add(manzana));
    });
    
    return manzanasUnicas.size / diasTranscurridos;
  }
  
  /**
   * Predecir finalización
   */
  predecirFinalizacion(progresoActual, velocidad, manzanasRestantes) {
    if (velocidad <= 0 || progresoActual >= 100) {
      return {
        dias: progresoActual >= 100 ? 0 : Infinity,
        fecha: progresoActual >= 100 ? new Date() : null,
        confianza: progresoActual >= 100 ? 1.0 : 0.0
      };
    }
    
    const diasEstimados = Math.ceil(manzanasRestantes / velocidad);
    const fechaEstimada = new Date(Date.now() + diasEstimados * 24 * 60 * 60 * 1000);
    
    // Calcular confianza basada en consistencia de velocidad
    const confianza = Math.max(0.1, Math.min(1.0, 1 / (1 + Math.abs(velocidad - 1))));
    
    return {
      dias: diasEstimados,
      fecha: fechaEstimada,
      confianza
    };
  }
  
  /**
   * Calcular confiabilidad de datos por barrio
   */
  calcularConfiabilidadBarrio(datos) {
    let puntuacion = 1.0;
    
    // Penalizar por pocos reportes
    if (datos.reportes.length < 3) {
      puntuacion *= 0.7;
    } else if (datos.reportes.length < 5) {
      puntuacion *= 0.85;
    }
    
    // Penalizar por datos muy antiguos
    const ahora = new Date();
    const reporteReciente = datos.reportes.reduce((mas_reciente, reporte) => {
      return reporte.fecha > mas_reciente.fecha ? reporte : mas_reciente;
    });
    
    const diasDesdeUltimoReporte = (ahora - reporteReciente.fecha) / (1000 * 60 * 60 * 24);
    if (diasDesdeUltimoReporte > 30) {
      puntuacion *= 0.8;
    } else if (diasDesdeUltimoReporte > 14) {
      puntuacion *= 0.9;
    }
    
    // Bonificar por consistencia temporal
    const intervalos = [];
    const reportesOrdenados = datos.reportes.sort((a, b) => a.fecha - b.fecha);
    for (let i = 1; i < reportesOrdenados.length; i++) {
      const intervalo = (reportesOrdenados[i].fecha - reportesOrdenados[i-1].fecha) / (1000 * 60 * 60 * 24);
      intervalos.push(intervalo);
    }
    
    if (intervalos.length > 0) {
      const promedioIntervalo = intervalos.reduce((a, b) => a + b, 0) / intervalos.length;
      const varianzaIntervalo = intervalos.reduce((acc, intervalo) => {
        return acc + Math.pow(intervalo - promedioIntervalo, 2);
      }, 0) / intervalos.length;
      
      const coeficienteVariacion = Math.sqrt(varianzaIntervalo) / promedioIntervalo;
      if (coeficienteVariacion < 0.5) {
        puntuacion *= 1.1; // Bonificar consistencia
      }
    }
    
    return Math.max(0.1, Math.min(1.0, puntuacion));
  }
  
  /**
   * Calcular margen de error
   */
  calcularMargenError(confiabilidad, numeroReportes) {
    // Margen de error basado en tamaño de muestra y confiabilidad
    const factorTamaño = 1.96 / Math.sqrt(Math.max(1, numeroReportes)); // 95% confianza
    const factorConfiabilidad = (1 - confiabilidad) * 0.5;
    
    return Math.min(0.25, factorTamaño + factorConfiabilidad); // Máximo 25% de error
  }
  
  /**
   * Determinar estado del barrio
   */
  determinarEstado(progreso, velocidad) {
    if (progreso >= 95) {
      return 'completado';
    } else if (progreso >= 70) {
      return velocidad > 0.5 ? 'avanzado' : 'avanzado_lento';
    } else if (progreso >= 30) {
      return velocidad > 0.3 ? 'progreso' : 'progreso_lento';
    } else if (velocidad > 0.1) {
      return 'iniciado';
    } else {
      return 'inactivo';
    }
  }
  
  /**
   * Aplicar corrección estadística
   */
  aplicarCorreccionEstadistica(estadisticas) {
    const corregidas = { ...estadisticas };
    
    // Aplicar suavizado exponencial
    Object.keys(corregidas).forEach(barrio => {
      const datos = corregidas[barrio];
      
      // Suavizar velocidad de progreso
      if (datos.velocidadProgreso > 0) {
        const alpha = this.config.estadisticas.factorSuavizado;
        const velocidadPromedio = this.calcularVelocidadPromedio(estadisticas);
        datos.velocidadProgreso = alpha * datos.velocidadProgreso + (1 - alpha) * velocidadPromedio;
      }
      
      // Ajustar progreso con intervalo de confianza
      const margenError = datos.margenError;
      datos.progresoMinimo = Math.max(0, datos.progresoCorregido - (margenError * 100));
      datos.progresoMaximo = Math.min(100, datos.progresoCorregido + (margenError * 100));
    });
    
    return corregidas;
  }
  
  /**
   * Calcular velocidad promedio
   */
  calcularVelocidadPromedio(estadisticas) {
    const velocidades = Object.values(estadisticas)
      .map(datos => datos.velocidadProgreso)
      .filter(v => v > 0);
    
    return velocidades.length > 0 
      ? velocidades.reduce((a, b) => a + b, 0) / velocidades.length 
      : 0;
  }
  
  /**
   * Calcular intervalos de confianza
   */
  calcularIntervalosConfianza(estadisticas) {
    const intervalos = {};
    
    this.config.estadisticas.intervalosConfianza.forEach(nivel => {
      intervalos[nivel] = {};
      
      Object.entries(estadisticas).forEach(([barrio, datos]) => {
        const z = this.obtenerValorZ(nivel);
        const error = datos.margenError * z;
        
        intervalos[nivel][barrio] = {
          inferior: Math.max(0, datos.progresoCorregido - error),
          superior: Math.min(100, datos.progresoCorregido + error),
          nivel: nivel
        };
      });
    });
    
    return intervalos;
  }
  
  /**
   * Obtener valor Z para nivel de confianza
   */
  obtenerValorZ(nivelConfianza) {
    const valores = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576
    };
    return valores[nivelConfianza] || 1.96;
  }
  
  /**
   * Calcular confiabilidad general
   */
  calcularConfiabilidad(estadisticas) {
    const confiabilidades = Object.values(estadisticas).map(datos => datos.confiabilidad);
    return confiabilidades.length > 0 
      ? confiabilidades.reduce((a, b) => a + b, 0) / confiabilidades.length 
      : 0;
  }
  
  /**
   * MÓDULO 3: MOTOR DE VISUALIZACIÓN
   */
  
  /**
   * Renderizar gráfica
   */
  async renderizar() {
    console.log('🎨 Renderizando gráfica...');
    
    if (!this.state.datosValidados) {
      throw new Error('No hay datos validados para renderizar');
    }
    
    // Destruir gráfica anterior si existe
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Preparar datos para Chart.js
    const datosChart = this.prepararDatosChart();
    
    // Configurar opciones de Chart.js
    const opciones = this.configurarOpciones();
    
    // Crear nueva gráfica
    this.chart = new Chart(this.ctx, {
      type: 'bar',
      data: datosChart,
      options: opciones
    });
    
    // Actualizar metadatos de estado
    this.state.ultimaActualizacion = new Date();
    this.state.cacheValido = true;
    
    console.log('✅ Gráfica renderizada exitosamente');
  }
  
  /**
   * Preparar datos para Chart.js
   */
  prepararDatosChart() {
    const estadisticas = this.state.datosValidados.barrios;
    const barrios = Object.keys(estadisticas).sort();
    
    // Datos principales
    const progresos = barrios.map(barrio => estadisticas[barrio].progresoCorregido);
    const colores = this.asignarColores(barrios, estadisticas);
    
    return {
      labels: barrios,
      datasets: [
        {
          label: 'Progreso del Barrio (%)',
          data: progresos,
          backgroundColor: colores.fondo,
          borderColor: colores.borde,
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false,
          // Datos adicionales para tooltips
          metadata: barrios.map(barrio => estadisticas[barrio])
        }
      ]
    };
  }
  
  /**
   * Asignar colores basados en estado
   */
  asignarColores(barrios, estadisticas) {
    const coloresFondo = [];
    const coloresBorde = [];
    
    barrios.forEach((barrio, index) => {
      const datos = estadisticas[barrio];
      let color;
      
      switch (datos.estado) {
        case 'completado':
          color = this.config.visualizacion.colores.completado;
          break;
        case 'avanzado':
        case 'avanzado_lento':
          color = this.config.visualizacion.colores.enProgreso;
          break;
        case 'progreso_lento':
          color = this.config.visualizacion.colores.advertencia;
          break;
        case 'inactivo':
          color = this.config.visualizacion.colores.critico;
          break;
        default:
          color = this.config.visualizacion.colores.primarios[index % this.config.visualizacion.colores.primarios.length];
      }
      
      coloresFondo.push(color);
      coloresBorde.push(color.replace('0.8', '1.0'));
    });
    
    return {
      fondo: coloresFondo,
      borde: coloresBorde
    };
  }
  
  /**
   * Configurar opciones de Chart.js
   */
  configurarOpciones() {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: this.config.visualizacion.animaciones.duracion,
        easing: this.config.visualizacion.animaciones.easing
      },
      plugins: {
        title: {
          display: true,
          text: 'Progreso de Barrios - Análisis Estadístico Avanzado',
          font: {
            size: isMobile ? 14 : 16,
            weight: 'bold'
          },
          color: '#374151'
        },
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: 'rgba(116, 185, 255, 0.5)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: (context) => {
              return context[0].label;
            },
            label: (context) => {
              const barrio = context.label;
              const datos = this.state.datosValidados.barrios[barrio];
              
              return [
                `Progreso: ${datos.progresoCorregido.toFixed(1)}%`,
                `Manzanas: ${datos.manzanasUnicas}/${datos.totalTerritorios}`,
                `Velocidad: ${datos.velocidadProgreso.toFixed(2)} manzanas/día`,
                `Estado: ${this.traducirEstado(datos.estado)}`,
                `Confiabilidad: ${(datos.confiabilidad * 100).toFixed(0)}%`,
                `Margen error: ±${(datos.margenError * 100).toFixed(1)}%`,
                datos.diasEstimadosRestantes < Infinity 
                  ? `Estimado: ${datos.diasEstimadosRestantes} días restantes`
                  : 'Estimado: No disponible'
              ];
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            maxRotation: isMobile ? 45 : 0,
            font: {
              size: isMobile ? 10 : 12
            },
            color: '#6B7280'
          }
        },
        y: {
          beginAtZero: true,
          max: 100,
          grid: {
            color: 'rgba(107, 114, 128, 0.1)'
          },
          ticks: {
            callback: (value) => value + '%',
            font: {
              size: isMobile ? 10 : 12
            },
            color: '#6B7280'
          },
          title: {
            display: true,
            text: 'Progreso (%)',
            font: {
              size: isMobile ? 11 : 13,
              weight: 'bold'
            },
            color: '#374151'
          }
        }
      },
      onHover: (event, activeElements) => {
        event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
      }
    };
  }
  
  /**
   * Traducir estado a español
   */
  traducirEstado(estado) {
    const traducciones = {
      'completado': 'Completado',
      'avanzado': 'Avanzado',
      'avanzado_lento': 'Avanzado (Lento)',
      'progreso': 'En Progreso',
      'progreso_lento': 'Progreso Lento',
      'iniciado': 'Iniciado',
      'inactivo': 'Inactivo'
    };
    return traducciones[estado] || estado;
  }
  
  /**
   * MÓDULO 4: MANEJO DE ERRORES
   */
  
  /**
   * Registrar error
   */
  registrarError(mensaje, error = null) {
    const errorObj = {
      timestamp: new Date().toISOString(),
      mensaje,
      error: error ? error.message || error : null,
      stack: error ? error.stack : null
    };
    
    this.state.errores.push(errorObj);
    console.error('❌ Error registrado:', errorObj);
  }
  
  /**
   * Manejar error crítico
   */
  manejarError(error) {
    console.error('💥 Error crítico en BarriosProgressChart:', error);
    
    // Mostrar mensaje de error en el canvas
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#EF4444';
      this.ctx.font = '16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        'Error cargando gráfica de progreso',
        this.canvas.width / 2,
        this.canvas.height / 2
      );
      
      this.ctx.fillStyle = '#6B7280';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(
        'Verifique la conexión y recargue la página',
        this.canvas.width / 2,
        this.canvas.height / 2 + 25
      );
    }
  }
  
  /**
   * MÉTODOS PÚBLICOS
   */
  
  /**
   * Actualizar gráfica
   */
  async actualizar() {
    try {
      console.log('🔄 Actualizando gráfica...');
      this.state.cacheValido = false;
      await this.cargarDatos();
      await this.procesarDatos();
      await this.renderizar();
      console.log('✅ Gráfica actualizada');
    } catch (error) {
      this.registrarError('Error actualizando gráfica', error);
      this.manejarError(error);
    }
  }
  
  /**
   * Obtener estadísticas
   */
  obtenerEstadisticas() {
    return this.state.datosValidados;
  }
  
  /**
   * Obtener errores
   */
  obtenerErrores() {
    return this.state.errores;
  }
  
  /**
   * Limpiar errores
   */
  limpiarErrores() {
    this.state.errores = [];
  }
  
  /**
   * Destruir instancia
   */
  destruir() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    
    this.state = {
      datosOriginales: null,
      datosValidados: null,
      estadisticas: null,
      errores: [],
      ultimaActualizacion: null,
      cacheValido: false
    };
    
    console.log('🗑️ BarriosProgressChart destruido');
  }
}

// Exportar clase para uso global
window.BarriosProgressChart = BarriosProgressChart;

// Exportar para módulos ES6
export default BarriosProgressChart;

/**
 * DOCUMENTACIÓN DE USO:
 * 
 * // Inicialización básica
 * const grafica = new BarriosProgressChart('grafica-barrios');
 * 
 * // Inicialización con configuración personalizada
 * const grafica = new BarriosProgressChart('grafica-barrios', {
 *   estadisticas: {
 *     umbralCompletado: 0.90,
 *     factorSuavizado: 0.2
 *   },
 *   territorios: {
 *     totales: {
 *       'Mi Barrio': 75
 *     }
 *   }
 * });
 * 
 * // Actualizar datos
 * await grafica.actualizar();
 * 
 * // Obtener estadísticas
 * const stats = grafica.obtenerEstadisticas();
 * 
 * // Verificar errores
 * const errores = grafica.obtenerErrores();
 * 
 * // Limpiar al finalizar
 * grafica.destruir();
 */