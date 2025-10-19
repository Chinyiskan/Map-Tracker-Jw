/**
 * Gráfica de Progreso de Barrios - Versión TypeScript
 * Sistema avanzado de análisis estadístico y visualización de progreso territorial
 * 
 * Características principales:
 * - Análisis estadístico avanzado con intervalos de confianza
 * - Predicciones de finalización basadas en tendencias
 * - Validación robusta de datos
 * - Visualización interactiva con Chart.js
 * - Manejo de errores y logging detallado
 * 
 * @author Sistema de Mapas JW
 * @version 2.0.0 (TypeScript)
 */

import { 
  BarriosChartConfig, 
  BarriosChartState, 
  BarriosRawData, 
  BarriosProcessedData, 
  BarrioStatistics, 
  ProgresoCicloAPI, 
  ReporteAPI, 
  PrediccionFinalizacion, 
  AnalisisTemporal, 
  RegresionLineal, 
  IntervalConfianza, 
  ChartDataPoint, 
  ChartDataset, 
  ChartOptions,
  BarriosProgressChartInterface
} from './types/index.js';

/**
 * Configuración por defecto del sistema
 */
const CONFIG_DEFAULT: BarriosChartConfig = {
  api: {
    base: '/api',
    endpoints: {
      reportes: '/reportes',
      ciclos: '/ciclos/progreso',
      estadisticas: '/estadisticas/barrios'
    },
    timeout: 10000
  },
  estadisticas: {
    intervalosConfianza: [0.90, 0.95, 0.99],
    metodosRegresion: ['lineal', 'exponencial'],
    ventanaMovil: 7,
    umbralCompletado: 0.95,
    factorSuavizado: 0.3
  },
  visualizacion: {
    colores: {
      primarios: [
        'rgba(59, 130, 246, 0.8)',   // Azul
        'rgba(16, 185, 129, 0.8)',   // Verde
        'rgba(245, 158, 11, 0.8)',   // Amarillo
        'rgba(239, 68, 68, 0.8)',    // Rojo
        'rgba(139, 92, 246, 0.8)',   // Púrpura
        'rgba(236, 72, 153, 0.8)'    // Rosa
      ],
      completado: 'rgba(34, 197, 94, 0.8)',
      enProgreso: 'rgba(59, 130, 246, 0.8)',
      critico: 'rgba(239, 68, 68, 0.8)',
      advertencia: 'rgba(245, 158, 11, 0.8)'
    },
    animaciones: {
      duracion: 1000,
      easing: 'easeInOutQuart'
    }
  },
  territorios: {
    totales: {
      'Barrio Centro': 45,
      'Barrio Norte': 38,
      'Barrio Sur': 52,
      'Barrio Este': 41,
      'Barrio Oeste': 47
    },
    factoresCorreccion: {
      'Barrio Centro': 1.1,
      'Barrio Norte': 1.0,
      'Barrio Sur': 0.95,
      'Barrio Este': 1.05,
      'Barrio Oeste': 1.0
    }
  },
  validacion: {
    maxReportesPorBarrio: 1000,
    maxManzanasPorReporte: 50,
    rangoFechasValidas: {
      inicio: '2020-01-01',
      fin: '2030-12-31'
    }
  }
};

/**
 * Clase principal para gráficas de progreso de barrios
 */
export class BarriosProgressChart implements BarriosProgressChartInterface {
  public canvasId: string;
  public canvas: HTMLCanvasElement | null = null;
  public ctx: CanvasRenderingContext2D | null = null;
  public chart: any = null; // Chart.js instance
  public config: BarriosChartConfig;
  public state: BarriosChartState;

  constructor(canvasId: string, configuracionPersonalizada: Partial<BarriosChartConfig> = {}) {
    this.canvasId = canvasId;
    this.config = this.fusionarConfiguracion(CONFIG_DEFAULT, configuracionPersonalizada);
    
    // Inicializar estado
    this.state = {
      datosOriginales: null,
      datosValidados: null,
      estadisticas: null,
      errores: [],
      ultimaActualizacion: null,
      cacheValido: false
    };

    // Obtener elementos del DOM
    this.canvas = document.getElementById(this.canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas con ID '${this.canvasId}' no encontrado`);
    }

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('No se pudo obtener el contexto 2D del canvas');
    }

    console.log('🎯 BarriosProgressChart inicializado:', this.canvasId);
  }

  /**
   * Fusionar configuraciones de forma profunda
   */
  public fusionarConfiguracion(target: any, source: any): any {
    const resultado = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        resultado[key] = this.fusionarConfiguracion(target[key] || {}, source[key]);
      } else {
        resultado[key] = source[key];
      }
    }
    
    return resultado;
  }

  /**
   * MÓDULO 1: CARGA Y VALIDACIÓN DE DATOS
   */

  /**
   * Inicializar módulo
   */
  public async init(): Promise<void> {
    try {
      console.log('🚀 Inicializando BarriosProgressChart...');
      await this.cargarDatos();
      await this.procesarDatos();
      await this.renderizar();
      console.log('✅ BarriosProgressChart inicializado correctamente');
    } catch (error) {
      this.registrarError('Error en inicialización', error as Error);
      this.manejarError(error as Error);
      throw error;
    }
  }

  /**
   * Cargar datos desde APIs
   */
  public async cargarDatos(): Promise<void> {
    console.log('📥 Cargando datos...');
    
    try {
      const [reportes, progresoCiclos, estadisticas] = await Promise.all([
        this.obtenerReportes(),
        this.obtenerProgresoCiclos(),
        this.obtenerEstadisticas()
      ]);

      this.state.datosOriginales = {
        reportes,
        progresoCiclos,
        estadisticas
      };

      console.log('✅ Datos cargados:', {
        reportes: reportes.length,
        progresoCiclos: progresoCiclos.length,
        estadisticas: Object.keys(estadisticas).length
      });

    } catch (error) {
      this.registrarError('Error cargando datos', error as Error);
      throw error;
    }
  }

  /**
   * Obtener reportes desde API
   */
  public async obtenerReportes(): Promise<ReporteAPI[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.api.timeout);

    try {
      const response = await fetch(`${this.config.api.base}${this.config.api.endpoints.reportes}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : data.reportes || [];

    } catch (error) {
      clearTimeout(timeoutId);
      if ((error as Error).name === 'AbortError') {
        throw new Error('Timeout obteniendo reportes');
      }
      throw error;
    }
  }

  /**
   * Obtener progreso de ciclos desde API
   */
  public async obtenerProgresoCiclos(): Promise<ProgresoCicloAPI[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.api.timeout);

    try {
      const response = await fetch(`${this.config.api.base}${this.config.api.endpoints.ciclos}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : data.progreso || [];

    } catch (error) {
      clearTimeout(timeoutId);
      if ((error as Error).name === 'AbortError') {
        throw new Error('Timeout obteniendo progreso de ciclos');
      }
      throw error;
    }
  }

  /**
   * Obtener estadísticas desde API
   */
  public async obtenerEstadisticas(): Promise<Record<string, any>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.api.timeout);

    try {
      const response = await fetch(`${this.config.api.base}${this.config.api.endpoints.estadisticas}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data || {};

    } catch (error) {
      clearTimeout(timeoutId);
      if ((error as Error).name === 'AbortError') {
        throw new Error('Timeout obteniendo estadísticas');
      }
      throw error;
    }
  }

  /**
   * Validar datos cargados
   */
  public validarDatos(datos: BarriosRawData): string[] {
    const errores: string[] = [];

    // Validar reportes
    if (!Array.isArray(datos.reportes)) {
      errores.push('Los reportes deben ser un array');
    } else {
      datos.reportes.forEach((reporte, index) => {
        errores.push(...this.validarReporte(reporte, index));
      });
    }

    // Validar progreso de ciclos
    if (!Array.isArray(datos.progresoCiclos)) {
      errores.push('El progreso de ciclos debe ser un array');
    } else {
      datos.progresoCiclos.forEach((progreso, index) => {
        errores.push(...this.validarProgresoCiclo(progreso, index));
      });
    }

    // Validar estadísticas
    if (typeof datos.estadisticas !== 'object' || datos.estadisticas === null) {
      errores.push('Las estadísticas deben ser un objeto');
    }

    return errores;
  }

  /**
   * Validar reporte individual
   */
  public validarReporte(reporte: ReporteAPI, index: number): string[] {
    const errores: string[] = [];
    const prefijo = `Reporte ${index}:`;

    // Validar campos requeridos
    if (!reporte.id) errores.push(`${prefijo} ID requerido`);
    if (!reporte.fecha) errores.push(`${prefijo} Fecha requerida`);
    if (!reporte.barrio) errores.push(`${prefijo} Barrio requerido`);
    if (!reporte.capitan) errores.push(`${prefijo} Capitán requerido`);

    // Validar fecha
    if (reporte.fecha) {
      const fecha = new Date(reporte.fecha);
      const fechaInicio = new Date(this.config.validacion.rangoFechasValidas.inicio);
      const fechaFin = new Date(this.config.validacion.rangoFechasValidas.fin);

      if (isNaN(fecha.getTime())) {
        errores.push(`${prefijo} Fecha inválida`);
      } else if (fecha < fechaInicio || fecha > fechaFin) {
        errores.push(`${prefijo} Fecha fuera del rango válido`);
      }
    }

    // Validar manzanas
    if (reporte.manzanas) {
      const manzanas = this.normalizarManzanas(reporte.manzanas);
      if (manzanas.length > this.config.validacion.maxManzanasPorReporte) {
        errores.push(`${prefijo} Demasiadas manzanas (máximo ${this.config.validacion.maxManzanasPorReporte})`);
      }
    }

    return errores;
  }

  /**
   * Validar progreso de ciclo individual
   */
  public validarProgresoCiclo(progreso: ProgresoCicloAPI, index: number): string[] {
    const errores: string[] = [];
    const prefijo = `Progreso ${index}:`;

    // Validar campos requeridos
    if (!progreso.id) errores.push(`${prefijo} ID requerido`);
    if (!progreso.barrio) errores.push(`${prefijo} Barrio requerido`);

    // Validar porcentaje
    if (typeof progreso.progreso_porcentaje !== 'number') {
      errores.push(`${prefijo} Progreso debe ser numérico`);
    } else if (progreso.progreso_porcentaje < 0 || progreso.progreso_porcentaje > 100) {
      errores.push(`${prefijo} Progreso debe estar entre 0 y 100`);
    }

    return errores;
  }

  /**
   * MÓDULO 2: PROCESAMIENTO ESTADÍSTICO
   */

  /**
   * Procesar datos validados
   */
  public async procesarDatos(): Promise<void> {
    console.log('⚙️ Procesando datos...');

    if (!this.state.datosOriginales) {
      throw new Error('No hay datos originales para procesar');
    }

    // Validar datos
    const erroresValidacion = this.validarDatos(this.state.datosOriginales);
    if (erroresValidacion.length > 0) {
      console.warn('⚠️ Errores de validación encontrados:', erroresValidacion);
      this.state.errores.push(...erroresValidacion);
    }

    try {
      // Limpiar y normalizar datos
      const datosLimpios = this.limpiarDatos(this.state.datosOriginales);

      // Agrupar por barrios
      const datosPorBarrio = this.agruparPorBarrios(datosLimpios);

      // Calcular estadísticas por barrio
      const estadisticasPorBarrio = this.calcularEstadisticasPorBarrio(datosPorBarrio);

      // Aplicar correcciones estadísticas
      const estadisticasCorregidas = this.aplicarCorreccionEstadistica(estadisticasPorBarrio);

      // Calcular intervalos de confianza
      const intervalos = this.calcularIntervalosConfianza(estadisticasCorregidas);

      // Calcular confiabilidad general
      const confiabilidad = this.calcularConfiabilidad(estadisticasCorregidas);

      // Crear datos procesados
      this.state.datosValidados = {
        barrios: estadisticasCorregidas,
        intervalos,
        metadatos: {
          totalReportes: datosLimpios.reportes.length,
          barriosAnalizados: Object.keys(estadisticasCorregidas).length,
          fechaAnalisis: new Date().toISOString(),
          confiabilidad
        }
      };

      console.log('✅ Datos procesados exitosamente');

    } catch (error) {
      this.registrarError('Error procesando datos', error as Error);
      throw error;
    }
  }

  /**
   * Limpiar y normalizar datos
   */
  public limpiarDatos(datos: BarriosRawData): BarriosRawData {
    const datosLimpios: BarriosRawData = {
      reportes: [],
      progresoCiclos: [],
      estadisticas: { ...datos.estadisticas }
    };

    // Limpiar reportes
    datosLimpios.reportes = datos.reportes
      .filter(reporte => reporte.id && reporte.fecha && reporte.barrio)
      .map(reporte => ({
        ...reporte,
        barrio: this.normalizarNombreBarrio(reporte.barrio),
        fecha: new Date(reporte.fecha).toISOString(),
        manzanas: reporte.manzanas || ''
      }));

    // Limpiar progreso de ciclos
    datosLimpios.progresoCiclos = datos.progresoCiclos
      .filter(progreso => progreso.id && progreso.barrio)
      .map(progreso => ({
        ...progreso,
        barrio: this.normalizarNombreBarrio(progreso.barrio)
      }));

    return datosLimpios;
  }

  /**
   * Normalizar nombre de barrio
   */
  public normalizarNombreBarrio(nombre: string): string {
    return nombre
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/^barrio\s+/i, '')
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ');
  }

  /**
   * Normalizar manzanas
   */
  public normalizarManzanas(manzanas: string | null | undefined): string[] {
    if (!manzanas) return [];

    const manzanasArray = manzanas
      .split(/[,;|\n]/)
      .map(m => m.trim())
      .filter(m => m.length > 0);

    // Eliminar duplicados
    return Array.from(new Set(manzanasArray));
  }

  /**
   * Agrupar datos por barrios
   */
  public agruparPorBarrios(datos: BarriosRawData): Record<string, any> {
    const agrupados: Record<string, any> = {};

    // Agrupar reportes por barrio
    datos.reportes.forEach(reporte => {
      const barrio = reporte.barrio;
      if (!agrupados[barrio]) {
        agrupados[barrio] = {
          reportes: [],
          progresoCiclo: null,
          manzanasUnicas: new Set<string>()
        };
      }

      agrupados[barrio].reportes.push({
        ...reporte,
        fecha: new Date(reporte.fecha),
        manzanas: this.normalizarManzanas(reporte.manzanas)
      });

      // Agregar manzanas únicas
      this.normalizarManzanas(reporte.manzanas).forEach(manzana => {
        agrupados[barrio].manzanasUnicas.add(manzana);
      });
    });

    // Agregar progreso de ciclos
    datos.progresoCiclos.forEach(progreso => {
      const barrio = progreso.barrio;
      if (agrupados[barrio]) {
        agrupados[barrio].progresoCiclo = progreso;
      }
    });

    // Convertir Set a array
    Object.keys(agrupados).forEach(barrio => {
      agrupados[barrio].manzanasUnicas = Array.from(agrupados[barrio].manzanasUnicas);
    });

    return agrupados;
  }

  /**
   * Calcular estadísticas por barrio
   */
  public calcularEstadisticasPorBarrio(datosPorBarrio: Record<string, any>): Record<string, BarrioStatistics> {
    const estadisticas: Record<string, BarrioStatistics> = {};

    Object.entries(datosPorBarrio).forEach(([barrio, datos]) => {
      const totalTerritorios = this.config.territorios.totales[barrio] || datos.manzanasUnicas.length;
      const manzanasUnicas = datos.manzanasUnicas.length;
      const reportesTotales = datos.reportes.length;

      // Progreso básico
      const progresoBasico = totalTerritorios > 0 ? (manzanasUnicas / totalTerritorios) * 100 : 0;

      // Factor de corrección
      const factorCorreccion = this.config.territorios.factoresCorreccion[barrio] || 1.0;
      const progresoCorregido = Math.min(100, progresoBasico * factorCorreccion);

      // Análisis temporal
      const velocidadProgreso = this.calcularVelocidadProgreso(datos.reportes);
      const analisisTemporal = this.analizarTendenciaTemporal(datos.reportes);

      // Predicciones
      const manzanasRestantes = Math.max(0, totalTerritorios - manzanasUnicas);
      const prediccionFinalizacion = this.predecirFinalizacion(progresoCorregido, velocidadProgreso, manzanasRestantes);
      const diasEstimadosRestantes = prediccionFinalizacion.dias;

      // Calidad de datos
      const confiabilidad = this.calcularConfiabilidadBarrio(datos);
      const margenError = this.calcularMargenError(confiabilidad, reportesTotales);

      // Estado
      const estado = this.determinarEstado(progresoCorregido, velocidadProgreso);

      // Datos de ciclo
      const progresoCicloAPI = datos.progresoCiclo?.progreso_porcentaje || null;
      const estadoCiclo = datos.progresoCiclo?.estado || null;

      estadisticas[barrio] = {
        totalTerritorios,
        manzanasUnicas,
        reportesTotales,
        progresoBasico,
        progresoCorregido,
        factorCorreccion,
        velocidadProgreso,
        tendencia: analisisTemporal.tendencia,
        aceleracion: analisisTemporal.aceleracion,
        prediccionFinalizacion,
        diasEstimadosRestantes,
        confiabilidad,
        margenError,
        estado,
        progresoCicloAPI,
        estadoCiclo
      };
    });

    return estadisticas;
  }

  /**
   * Analizar tendencia temporal
   */
  public analizarTendenciaTemporal(reportes: ReporteAPI[]): AnalisisTemporal {
    if (reportes.length < 2) {
      return {
        tendencia: 0,
        aceleracion: 0,
        velocidadPromedio: 0,
        puntosInflexion: []
      };
    }

    // Ordenar reportes por fecha
    const reportesOrdenados = reportes.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    // Calcular progreso acumulativo
    const datosProgreso: ChartDataPoint[] = [];
    const manzanasAcumuladas = new Set<string>();

    reportesOrdenados.forEach((reporte, index) => {
      this.normalizarManzanas(reporte.manzanas).forEach(manzana => {
        manzanasAcumuladas.add(manzana);
      });

      datosProgreso.push({
        x: index,
        y: manzanasAcumuladas.size,
        label: reporte.fecha
      });
    });

    // Calcular regresión lineal
    const regresion = this.calcularRegresionLineal(datosProgreso);
    const tendencia = regresion.pendiente;

    // Calcular aceleración
    const aceleracion = this.calcularAceleracion(datosProgreso);

    // Calcular velocidad promedio
    const velocidadPromedio = this.calcularVelocidadProgreso(reportes);

    return {
      tendencia,
      aceleracion,
      velocidadPromedio,
      puntosInflexion: [] // Implementar si es necesario
    };
  }

  /**
   * Calcular regresión lineal
   */
  public calcularRegresionLineal(datos: ChartDataPoint[]): RegresionLineal {
    if (datos.length < 2) {
      return {
        pendiente: 0,
        intercepto: 0,
        coeficienteCorrelacion: 0,
        errorEstandar: 0
      };
    }

    const n = datos.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;

    datos.forEach((punto, index) => {
      const x = index;
      const y = typeof punto.y === 'number' ? punto.y : 0;

      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
      sumYY += y * y;
    });

    const pendiente = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
    const intercepto = (sumY - pendiente * sumX) / n || 0;

    // Coeficiente de correlación
    const numerador = n * sumXY - sumX * sumY;
    const denominador = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    const coeficienteCorrelacion = denominador !== 0 ? numerador / denominador : 0;

    // Error estándar (simplificado)
    const errorEstandar = Math.sqrt(Math.abs(1 - coeficienteCorrelacion * coeficienteCorrelacion));

    return {
      pendiente,
      intercepto,
      coeficienteCorrelacion,
      errorEstandar
    };
  }

  /**
   * Calcular aceleración
   */
  public calcularAceleracion(datos: ChartDataPoint[]): number {
    if (datos.length < 3) return 0;

    const velocidades: number[] = [];
    for (let i = 1; i < datos.length; i++) {
      const deltaY = (typeof datos[i].y === 'number' ? datos[i].y : 0) - (typeof datos[i-1].y === 'number' ? datos[i-1].y : 0);
      const deltaX = 1; // Asumiendo intervalos uniformes
      velocidades.push(deltaX > 0 ? deltaY / deltaX : 0);
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
  public calcularVelocidadProgreso(reportes: ReporteAPI[]): number {
    if (reportes.length < 2) return 0;

    const reportesOrdenados = reportes.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    const fechaInicio = new Date(reportesOrdenados[0].fecha);
    const fechaFin = new Date(reportesOrdenados[reportesOrdenados.length - 1].fecha);

    const diasTranscurridos = (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24);

    if (diasTranscurridos <= 0) return 0;

    const manzanasUnicas = new Set<string>();
    reportes.forEach(reporte => {
      this.normalizarManzanas(reporte.manzanas).forEach(manzana => manzanasUnicas.add(manzana));
    });

    return manzanasUnicas.size / diasTranscurridos;
  }

  /**
   * Predecir finalización
   */
  public predecirFinalizacion(progresoActual: number, velocidad: number, territoriosRestantes: number): PrediccionFinalizacion {
    if (velocidad <= 0 || progresoActual >= 100) {
      return {
        dias: progresoActual >= 100 ? 0 : Infinity,
        fecha: progresoActual >= 100 ? new Date().toISOString() : '',
        confianza: progresoActual >= 100 ? 1.0 : 0.0,
        metodo: 'directo'
      };
    }

    const diasEstimados = Math.ceil(territoriosRestantes / velocidad);
    const fechaEstimada = new Date(Date.now() + diasEstimados * 24 * 60 * 60 * 1000);

    // Calcular confianza basada en consistencia de velocidad
    const confianza = Math.max(0.1, Math.min(1.0, 1 / (1 + Math.abs(velocidad - 1))));

    return {
      dias: diasEstimados,
      fecha: fechaEstimada.toISOString(),
      confianza,
      metodo: 'lineal'
    };
  }

  /**
   * Calcular confiabilidad de datos por barrio
   */
  public calcularConfiabilidadBarrio(datos: any): number {
    let puntuacion = 1.0;

    // Penalizar por pocos reportes
    if (datos.reportes.length < 3) {
      puntuacion *= 0.7;
    } else if (datos.reportes.length < 5) {
      puntuacion *= 0.85;
    }

    // Penalizar por datos muy antiguos
    const ahora = new Date();
    const reporteReciente = datos.reportes.reduce((masReciente: any, reporte: any) => {
      return new Date(reporte.fecha) > new Date(masReciente.fecha) ? reporte : masReciente;
    });

    const diasDesdeUltimoReporte = (ahora.getTime() - new Date(reporteReciente.fecha).getTime()) / (1000 * 60 * 60 * 24);
    if (diasDesdeUltimoReporte > 30) {
      puntuacion *= 0.8;
    } else if (diasDesdeUltimoReporte > 14) {
      puntuacion *= 0.9;
    }

    // Bonificar por consistencia temporal
    const intervalos: number[] = [];
    const reportesOrdenados = datos.reportes.sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    for (let i = 1; i < reportesOrdenados.length; i++) {
      const intervalo = (new Date(reportesOrdenados[i].fecha).getTime() - new Date(reportesOrdenados[i-1].fecha).getTime()) / (1000 * 60 * 60 * 24);
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
  public calcularMargenError(confiabilidad: number, numeroReportes: number): number {
    // Margen de error basado en tamaño de muestra y confiabilidad
    const factorTamaño = 1.96 / Math.sqrt(Math.max(1, numeroReportes)); // 95% confianza
    const factorConfiabilidad = (1 - confiabilidad) * 0.5;

    return Math.min(0.25, factorTamaño + factorConfiabilidad); // Máximo 25% de error
  }

  /**
   * Determinar estado del barrio
   */
  public determinarEstado(progreso: number, velocidad: number): string {
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
  public aplicarCorreccionEstadistica(estadisticas: Record<string, BarrioStatistics>): Record<string, BarrioStatistics> {
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
      (datos as any).progresoMinimo = Math.max(0, datos.progresoCorregido - (margenError * 100));
      (datos as any).progresoMaximo = Math.min(100, datos.progresoCorregido + (margenError * 100));
    });

    return corregidas;
  }

  /**
   * Calcular velocidad promedio
   */
  private calcularVelocidadPromedio(estadisticas: Record<string, BarrioStatistics>): number {
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
  public calcularIntervalosConfianza(estadisticas: Record<string, BarrioStatistics>): Record<string, IntervalConfianza> {
    const intervalos: Record<string, IntervalConfianza> = {};

    this.config.estadisticas.intervalosConfianza.forEach(nivel => {
      const intervalosNivel: Record<string, any> = {};

      Object.entries(estadisticas).forEach(([barrio, datos]) => {
        const z = this.obtenerValorZ(nivel);
        const error = datos.margenError * z;

        intervalosNivel[barrio] = {
          nivel,
          limiteInferior: Math.max(0, datos.progresoCorregido - error),
          limiteSuperior: Math.min(100, datos.progresoCorregido + error),
          margenError: error
        };
      });

      intervalos[nivel.toString()] = intervalosNivel as IntervalConfianza;
    });

    return intervalos;
  }

  /**
   * Obtener valor Z para nivel de confianza
   */
  private obtenerValorZ(nivelConfianza: number): number {
    const valores: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576
    };
    return valores[nivelConfianza] || 1.96;
  }

  /**
   * Calcular confiabilidad general
   */
  public calcularConfiabilidad(estadisticas: Record<string, BarrioStatistics>): number {
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
  public async renderizar(): Promise<void> {
    console.log('🎨 Renderizando gráfica...');

    if (!this.state.datosValidados) {
      throw new Error('No hay datos validados para renderizar');
    }

    // Destruir gráfica anterior si existe
    if (this.chart) {
      this.chart.destroy();
    }

    // Preparar datos para Chart.js
    const datosChart = this.prepararDatosVisualizacion();

    // Configurar opciones de Chart.js
    const opciones = this.configurarGrafica();

    // Crear nueva gráfica
    this.chart = new (window as any).Chart(this.ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(this.state.datosValidados.barrios).sort(),
        datasets: datosChart
      },
      options: opciones
    });

    // Actualizar metadatos de estado
    this.state.ultimaActualizacion = new Date().toISOString();
    this.state.cacheValido = true;

    console.log('✅ Gráfica renderizada exitosamente');
  }

  /**
   * Preparar datos para visualización
   */
  public prepararDatosVisualizacion(): ChartDataset[] {
    if (!this.state.datosValidados) {
      return [];
    }

    const estadisticas = this.state.datosValidados.barrios;
    const barrios = Object.keys(estadisticas).sort();

    // Datos principales
    const progresos = barrios.map(barrio => estadisticas[barrio].progresoCorregido);
    const colores = this.asignarColores(barrios, estadisticas);

    return [{
      label: 'Progreso del Barrio (%)',
      data: progresos.map((progreso, index) => ({
        x: index,
        y: progreso,
        label: barrios[index]
      })),
      backgroundColor: colores.fondo,
      borderColor: colores.borde,
      borderWidth: 2
    }];
  }

  /**
   * Asignar colores basados en estado
   */
  private asignarColores(barrios: string[], estadisticas: Record<string, BarrioStatistics>): { fondo: string[], borde: string[] } {
    const coloresFondo: string[] = [];
    const coloresBorde: string[] = [];

    barrios.forEach((barrio, index) => {
      const datos = estadisticas[barrio];
      let color: string;

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
   * Configurar opciones de gráfica
   */
  public configurarGrafica(): ChartOptions {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: this.config.visualizacion.animaciones.duracion,
        easing: this.config.visualizacion.animaciones.easing
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Barrios'
          }
        },
        y: {
          display: true,
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Progreso (%)'
          }
        }
      }
    };
  }

  /**
   * Aplicar tema
   */
  public aplicarTema(): void {
    // Implementar si es necesario
  }

  /**
   * MÉTODOS DE INTERACCIÓN
   */

  public onBarrioClick(barrio: string): void {
    console.log('Click en barrio:', barrio);
  }

  public onBarrioHover(barrio: string): void {
    console.log('Hover en barrio:', barrio);
  }

  public mostrarDetalles(barrio: string): void {
    console.log('Mostrar detalles de:', barrio);
  }

  public exportarDatos(): void {
    console.log('Exportar datos');
  }

  /**
   * MÉTODOS DE ACTUALIZACIÓN
   */

  public async actualizar(): Promise<void> {
    try {
      console.log('🔄 Actualizando gráfica...');
      this.state.cacheValido = false;
      await this.cargarDatos();
      await this.procesarDatos();
      await this.renderizar();
      console.log('✅ Gráfica actualizada');
    } catch (error) {
      this.registrarError('Error actualizando gráfica', error as Error);
      this.manejarError(error as Error);
    }
  }

  public actualizarEnTiempoReal(): void {
    // Implementar si es necesario
  }

  public invalidarCache(): void {
    this.state.cacheValido = false;
  }

  /**
   * MÉTODOS DE UTILIDAD
   */

  public manejarError(error: Error): void {
    console.error('💥 Error crítico en BarriosProgressChart:', error);

    // Mostrar mensaje de error en el canvas
    if (this.ctx && this.canvas) {
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

  public registrarError(mensaje: string, error?: any): void {
    const errorObj = {
      timestamp: new Date().toISOString(),
      mensaje,
      error: error ? error.message || error : null,
      stack: error ? error.stack : null
    };

    this.state.errores.push(errorObj);
    console.error('❌ Error registrado:', errorObj);
  }

  public limpiarErrores(): void {
    this.state.errores = [];
  }

  public obtenerEstadoActual(): BarriosChartState {
    return { ...this.state };
  }

  /**
   * MÉTODOS DE LIMPIEZA
   */

  public destruir(): void {
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
(window as any).BarriosProgressChart = BarriosProgressChart;

// Exportar por defecto
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
 * // Inicializar
 * await grafica.init();
 * 
 * // Actualizar datos
 * await grafica.actualizar();
 * 
 * // Obtener estadísticas
 * const stats = grafica.obtenerEstadoActual();
 * 
 * // Verificar errores
 * const errores = grafica.state.errores;
 * 
 * // Limpiar al finalizar
 * grafica.destruir();
 */