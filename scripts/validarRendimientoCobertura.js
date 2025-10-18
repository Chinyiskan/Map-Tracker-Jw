// scripts/validarRendimientoCobertura.js
// Script de validación de rendimiento para el componente Cobertura por Barrios
// Mide métricas de performance, memoria y usabilidad

import { performance } from 'perf_hooks';

/**
 * Validador de rendimiento del componente Cobertura por Barrios
 */
class RendimientoValidator {
  constructor(baseUrl = 'http://localhost:3003') {
    this.baseUrl = baseUrl;
    this.metricas = {
      api: {},
      procesamiento: {},
      memoria: {},
      usabilidad: {}
    };
  }

  /**
   * Ejecutar todas las validaciones de rendimiento
   */
  async ejecutarValidaciones() {
    console.log('🚀 Iniciando validación de rendimiento del componente Cobertura por Barrios...');
    console.log('=' .repeat(80));

    try {
      // 1. Validar rendimiento de API
      await this.validarRendimientoAPI();
      
      // 2. Validar procesamiento de datos
      await this.validarProcesamiento();
      
      // 3. Validar uso de memoria
      await this.validarMemoria();
      
      // 4. Validar usabilidad
      await this.validarUsabilidad();
      
      // 5. Generar reporte final
      this.generarReporte();
      
    } catch (error) {
      console.error('❌ Error durante validación:', error.message);
    }
  }

  /**
   * Validar rendimiento de la API
   */
  async validarRendimientoAPI() {
    console.log('\n📊 Validando rendimiento de API...');
    
    const endpoint = `${this.baseUrl}/api/ciclos/progreso`;
    const iteraciones = 10;
    const tiempos = [];
    
    for (let i = 0; i < iteraciones; i++) {
      const inicio = performance.now();
      
      try {
        const response = await fetch(endpoint);
        const data = await response.json();
        
        const fin = performance.now();
        const tiempo = fin - inicio;
        tiempos.push(tiempo);
        
        // Validar respuesta
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        if (!data.success) {
          throw new Error('API retornó success: false');
        }
        
        console.log(`   Iteración ${i + 1}: ${tiempo.toFixed(2)}ms`);
        
      } catch (error) {
        console.error(`   ❌ Error en iteración ${i + 1}:`, error.message);
        tiempos.push(null);
      }
    }
    
    // Calcular métricas
    const tiemposValidos = tiempos.filter(t => t !== null);
    const promedio = tiemposValidos.reduce((a, b) => a + b, 0) / tiemposValidos.length;
    const minimo = Math.min(...tiemposValidos);
    const maximo = Math.max(...tiemposValidos);
    
    this.metricas.api = {
      promedio: promedio.toFixed(2),
      minimo: minimo.toFixed(2),
      maximo: maximo.toFixed(2),
      exitosas: tiemposValidos.length,
      fallidas: tiempos.length - tiemposValidos.length,
      tasaExito: ((tiemposValidos.length / tiempos.length) * 100).toFixed(1)
    };
    
    console.log(`\n   ✅ Métricas de API:`);
    console.log(`      Tiempo promedio: ${this.metricas.api.promedio}ms`);
    console.log(`      Tiempo mínimo: ${this.metricas.api.minimo}ms`);
    console.log(`      Tiempo máximo: ${this.metricas.api.maximo}ms`);
    console.log(`      Tasa de éxito: ${this.metricas.api.tasaExito}%`);
    
    // Validaciones de umbral
    if (promedio > 2000) {
      console.log(`   ⚠️  ADVERTENCIA: Tiempo promedio (${promedio.toFixed(2)}ms) > 2000ms`);
    } else {
      console.log(`   ✅ Tiempo promedio dentro del umbral (<2000ms)`);
    }
  }

  /**
   * Validar procesamiento de datos
   */
  async validarProcesamiento() {
    console.log('\n🔄 Validando procesamiento de datos...');
    
    try {
      // Obtener datos de la API
      const response = await fetch(`${this.baseUrl}/api/ciclos/progreso`);
      const apiData = await response.json();
      
      if (!apiData.success) {
        throw new Error('No se pudieron obtener datos de la API');
      }
      
      const rawData = apiData.data;
      console.log(`   📥 Datos obtenidos: ${rawData.length} barrios`);
      
      // Simular procesamiento del DataProcessor
      const inicioProcesamiento = performance.now();
      
      // 1. Filtrado
      const inicioFiltrado = performance.now();
      const datosFiltrados = rawData.filter(barrio => {
        return barrio && 
               typeof barrio === 'object' && 
               barrio.barrio && 
               typeof barrio.barrio === 'string' &&
               parseInt(barrio.total_territorios) > 0;
      });
      const tiempoFiltrado = performance.now() - inicioFiltrado;
      
      // 2. Transformación
      const inicioTransformacion = performance.now();
      const datosTransformados = datosFiltrados.map(barrio => ({
        nombre: barrio.barrio.trim(),
        ciclo: parseInt(barrio.numero_ciclo) || 0,
        estado: (barrio.estado || 'sin_ciclo').toLowerCase(),
        progreso: Math.min(100, Math.max(0, Math.round(parseFloat(barrio.progreso_porcentaje) || 0))),
        territoriosCompletados: parseInt(barrio.territorios_completados) || 0,
        totalTerritorios: parseInt(barrio.total_territorios) || 0,
        completado: (parseFloat(barrio.progreso_porcentaje) || 0) >= 95,
        id: `${barrio.barrio.toLowerCase().replace(/[^a-z0-9]/g, '-')}-c${parseInt(barrio.numero_ciclo) || 0}`
      }));
      const tiempoTransformacion = performance.now() - inicioTransformacion;
      
      // 3. Ordenamiento
      const inicioOrdenamiento = performance.now();
      const datosOrdenados = datosTransformados.sort((a, b) => {
        if (a.completado !== b.completado) {
          return a.completado ? 1 : -1;
        }
        if (a.progreso !== b.progreso) {
          return b.progreso - a.progreso;
        }
        return a.nombre.localeCompare(b.nombre);
      });
      const tiempoOrdenamiento = performance.now() - inicioOrdenamiento;
      
      // 4. Cálculo de estadísticas
      const inicioEstadisticas = performance.now();
      const stats = {
        totalBarrios: datosOrdenados.length,
        barriosActivos: datosOrdenados.filter(b => b.estado === 'activo').length,
        barriosCompletados: datosOrdenados.filter(b => b.completado).length,
        progresoPromedio: datosOrdenados.length > 0 
          ? Math.round(datosOrdenados.reduce((sum, b) => sum + b.progreso, 0) / datosOrdenados.length)
          : 0,
        totalTerritorios: datosOrdenados.reduce((sum, b) => sum + b.totalTerritorios, 0),
        territoriosCompletados: datosOrdenados.reduce((sum, b) => sum + b.territoriosCompletados, 0)
      };
      const tiempoEstadisticas = performance.now() - inicioEstadisticas;
      
      const tiempoTotal = performance.now() - inicioProcesamiento;
      
      this.metricas.procesamiento = {
        tiempoTotal: tiempoTotal.toFixed(2),
        tiempoFiltrado: tiempoFiltrado.toFixed(2),
        tiempoTransformacion: tiempoTransformacion.toFixed(2),
        tiempoOrdenamiento: tiempoOrdenamiento.toFixed(2),
        tiempoEstadisticas: tiempoEstadisticas.toFixed(2),
        elementosEntrada: rawData.length,
        elementosSalida: datosOrdenados.length,
        elementosFiltrados: rawData.length - datosFiltrados.length
      };
      
      console.log(`   ✅ Procesamiento completado:`);
      console.log(`      Tiempo total: ${this.metricas.procesamiento.tiempoTotal}ms`);
      console.log(`      - Filtrado: ${this.metricas.procesamiento.tiempoFiltrado}ms`);
      console.log(`      - Transformación: ${this.metricas.procesamiento.tiempoTransformacion}ms`);
      console.log(`      - Ordenamiento: ${this.metricas.procesamiento.tiempoOrdenamiento}ms`);
      console.log(`      - Estadísticas: ${this.metricas.procesamiento.tiempoEstadisticas}ms`);
      console.log(`      Elementos procesados: ${this.metricas.procesamiento.elementosEntrada} → ${this.metricas.procesamiento.elementosSalida}`);
      
      // Validaciones de umbral
      if (tiempoTotal > 100) {
        console.log(`   ⚠️  ADVERTENCIA: Tiempo de procesamiento (${tiempoTotal.toFixed(2)}ms) > 100ms`);
      } else {
        console.log(`   ✅ Tiempo de procesamiento dentro del umbral (<100ms)`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error en validación de procesamiento:`, error.message);
    }
  }

  /**
   * Validar uso de memoria
   */
  async validarMemoria() {
    console.log('\n💾 Validando uso de memoria...');
    
    try {
      // Obtener memoria inicial
      const memoriaInicial = process.memoryUsage();
      
      // Simular carga de datos múltiples veces
      const iteraciones = 50;
      const datosAcumulados = [];
      
      for (let i = 0; i < iteraciones; i++) {
        const response = await fetch(`${this.baseUrl}/api/ciclos/progreso`);
        const data = await response.json();
        datosAcumulados.push(data);
        
        // Simular procesamiento
        const procesados = data.data?.map(barrio => ({
          ...barrio,
          procesado: true,
          timestamp: Date.now()
        })) || [];
        
        datosAcumulados.push(procesados);
      }
      
      // Obtener memoria después del procesamiento
      const memoriaFinal = process.memoryUsage();
      
      // Calcular diferencias
      const diferenciaHeap = (memoriaFinal.heapUsed - memoriaInicial.heapUsed) / 1024 / 1024;
      const diferenciaRSS = (memoriaFinal.rss - memoriaInicial.rss) / 1024 / 1024;
      
      this.metricas.memoria = {
        heapInicial: (memoriaInicial.heapUsed / 1024 / 1024).toFixed(2),
        heapFinal: (memoriaFinal.heapUsed / 1024 / 1024).toFixed(2),
        diferenciaHeap: diferenciaHeap.toFixed(2),
        rssInicial: (memoriaInicial.rss / 1024 / 1024).toFixed(2),
        rssFinal: (memoriaFinal.rss / 1024 / 1024).toFixed(2),
        diferenciaRSS: diferenciaRSS.toFixed(2),
        iteraciones: iteraciones
      };
      
      console.log(`   ✅ Métricas de memoria:`);
      console.log(`      Heap usado: ${this.metricas.memoria.heapInicial}MB → ${this.metricas.memoria.heapFinal}MB (Δ${this.metricas.memoria.diferenciaHeap}MB)`);
      console.log(`      RSS: ${this.metricas.memoria.rssInicial}MB → ${this.metricas.memoria.rssFinal}MB (Δ${this.metricas.memoria.diferenciaRSS}MB)`);
      console.log(`      Iteraciones: ${this.metricas.memoria.iteraciones}`);
      
      // Validaciones de umbral
      if (Math.abs(diferenciaHeap) > 50) {
        console.log(`   ⚠️  ADVERTENCIA: Incremento de heap (${diferenciaHeap.toFixed(2)}MB) > 50MB`);
      } else {
        console.log(`   ✅ Uso de memoria dentro del umbral (<50MB)`);
      }
      
      // Limpiar memoria
      datosAcumulados.length = 0;
      if (global.gc) {
        global.gc();
        console.log(`   🧹 Garbage collection ejecutado`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error en validación de memoria:`, error.message);
    }
  }

  /**
   * Validar usabilidad del componente
   */
  async validarUsabilidad() {
    console.log('\n👤 Validando usabilidad...');
    
    try {
      // 1. Validar estructura de datos para UI
      const response = await fetch(`${this.baseUrl}/api/ciclos/progreso`);
      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error('Datos no disponibles para validación de usabilidad');
      }
      
      const barrios = data.data;
      
      // 2. Validar legibilidad de datos
      let barriosConNombresLegibles = 0;
      let barriosConProgresoClear = 0;
      let barriosConEstadosValidos = 0;
      
      barrios.forEach(barrio => {
        // Nombres legibles (no muy largos, no caracteres extraños)
        if (barrio.barrio && 
            barrio.barrio.length >= 3 && 
            barrio.barrio.length <= 25 &&
            /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.]+$/.test(barrio.barrio)) {
          barriosConNombresLegibles++;
        }
        
        // Progreso claro (números enteros o con máximo 2 decimales)
        const progreso = parseFloat(barrio.progreso_porcentaje);
        if (!isNaN(progreso) && progreso >= 0 && progreso <= 100) {
          barriosConProgresoClear++;
        }
        
        // Estados válidos y comprensibles
        const estadosValidos = ['activo', 'completado', 'pausado', 'inactivo', 'sin_ciclo'];
        if (estadosValidos.includes(barrio.estado)) {
          barriosConEstadosValidos++;
        }
      });
      
      // 3. Validar distribución de datos
      const barriosConDatos = barrios.filter(b => parseInt(b.total_territorios) > 0);
      const barriosConProgreso = barrios.filter(b => parseFloat(b.progreso_porcentaje) > 0);
      const barriosCompletados = barrios.filter(b => parseFloat(b.progreso_porcentaje) >= 95);
      
      // 4. Validar variedad de estados
      const estadosUnicos = [...new Set(barrios.map(b => b.estado))].length;
      
      this.metricas.usabilidad = {
        totalBarrios: barrios.length,
        nombresLegibles: barriosConNombresLegibles,
        progresoClaro: barriosConProgresoClear,
        estadosValidos: barriosConEstadosValidos,
        barriosConDatos: barriosConDatos.length,
        barriosConProgreso: barriosConProgreso.length,
        barriosCompletados: barriosCompletados.length,
        estadosUnicos: estadosUnicos,
        legibilidadNombres: ((barriosConNombresLegibles / barrios.length) * 100).toFixed(1),
        claridadProgreso: ((barriosConProgresoClear / barrios.length) * 100).toFixed(1),
        validezEstados: ((barriosConEstadosValidos / barrios.length) * 100).toFixed(1)
      };
      
      console.log(`   ✅ Métricas de usabilidad:`);
      console.log(`      Legibilidad de nombres: ${this.metricas.usabilidad.legibilidadNombres}% (${barriosConNombresLegibles}/${barrios.length})`);
      console.log(`      Claridad de progreso: ${this.metricas.usabilidad.claridadProgreso}% (${barriosConProgresoClear}/${barrios.length})`);
      console.log(`      Validez de estados: ${this.metricas.usabilidad.validezEstados}% (${barriosConEstadosValidos}/${barrios.length})`);
      console.log(`      Barrios con datos: ${this.metricas.usabilidad.barriosConDatos}`);
      console.log(`      Barrios con progreso: ${this.metricas.usabilidad.barriosConProgreso}`);
      console.log(`      Barrios completados: ${this.metricas.usabilidad.barriosCompletados}`);
      console.log(`      Variedad de estados: ${this.metricas.usabilidad.estadosUnicos}`);
      
      // Validaciones de usabilidad
      const problemas = [];
      
      if (parseFloat(this.metricas.usabilidad.legibilidadNombres) < 90) {
        problemas.push(`Legibilidad de nombres baja (${this.metricas.usabilidad.legibilidadNombres}%)`);
      }
      
      if (parseFloat(this.metricas.usabilidad.claridadProgreso) < 95) {
        problemas.push(`Claridad de progreso baja (${this.metricas.usabilidad.claridadProgreso}%)`);
      }
      
      if (parseFloat(this.metricas.usabilidad.validezEstados) < 100) {
        problemas.push(`Estados inválidos detectados (${this.metricas.usabilidad.validezEstados}%)`);
      }
      
      if (this.metricas.usabilidad.estadosUnicos < 2) {
        problemas.push(`Poca variedad de estados (${this.metricas.usabilidad.estadosUnicos})`);
      }
      
      if (problemas.length > 0) {
        console.log(`   ⚠️  Problemas de usabilidad detectados:`);
        problemas.forEach(problema => console.log(`      - ${problema}`));
      } else {
        console.log(`   ✅ Usabilidad excelente - sin problemas detectados`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error en validación de usabilidad:`, error.message);
    }
  }

  /**
   * Generar reporte final de rendimiento
   */
  generarReporte() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 REPORTE FINAL DE RENDIMIENTO Y USABILIDAD');
    console.log('='.repeat(80));
    
    // Evaluación general
    const evaluaciones = [];
    
    // API Performance
    const tiempoAPI = parseFloat(this.metricas.api.promedio);
    if (tiempoAPI < 500) {
      evaluaciones.push({ categoria: 'API Performance', estado: '✅ EXCELENTE', valor: `${tiempoAPI}ms` });
    } else if (tiempoAPI < 1000) {
      evaluaciones.push({ categoria: 'API Performance', estado: '✅ BUENO', valor: `${tiempoAPI}ms` });
    } else if (tiempoAPI < 2000) {
      evaluaciones.push({ categoria: 'API Performance', estado: '⚠️ ACEPTABLE', valor: `${tiempoAPI}ms` });
    } else {
      evaluaciones.push({ categoria: 'API Performance', estado: '❌ LENTO', valor: `${tiempoAPI}ms` });
    }
    
    // Procesamiento
    const tiempoProcesamiento = parseFloat(this.metricas.procesamiento.tiempoTotal);
    if (tiempoProcesamiento < 50) {
      evaluaciones.push({ categoria: 'Procesamiento', estado: '✅ EXCELENTE', valor: `${tiempoProcesamiento}ms` });
    } else if (tiempoProcesamiento < 100) {
      evaluaciones.push({ categoria: 'Procesamiento', estado: '✅ BUENO', valor: `${tiempoProcesamiento}ms` });
    } else {
      evaluaciones.push({ categoria: 'Procesamiento', estado: '⚠️ LENTO', valor: `${tiempoProcesamiento}ms` });
    }
    
    // Memoria
    const usoMemoria = Math.abs(parseFloat(this.metricas.memoria.diferenciaHeap));
    if (usoMemoria < 10) {
      evaluaciones.push({ categoria: 'Uso de Memoria', estado: '✅ EXCELENTE', valor: `${usoMemoria}MB` });
    } else if (usoMemoria < 25) {
      evaluaciones.push({ categoria: 'Uso de Memoria', estado: '✅ BUENO', valor: `${usoMemoria}MB` });
    } else if (usoMemoria < 50) {
      evaluaciones.push({ categoria: 'Uso de Memoria', estado: '⚠️ ALTO', valor: `${usoMemoria}MB` });
    } else {
      evaluaciones.push({ categoria: 'Uso de Memoria', estado: '❌ EXCESIVO', valor: `${usoMemoria}MB` });
    }
    
    // Usabilidad
    const legibilidad = parseFloat(this.metricas.usabilidad.legibilidadNombres);
    const claridad = parseFloat(this.metricas.usabilidad.claridadProgreso);
    const validez = parseFloat(this.metricas.usabilidad.validezEstados);
    const usabilidadPromedio = (legibilidad + claridad + validez) / 3;
    
    if (usabilidadPromedio >= 95) {
      evaluaciones.push({ categoria: 'Usabilidad', estado: '✅ EXCELENTE', valor: `${usabilidadPromedio.toFixed(1)}%` });
    } else if (usabilidadPromedio >= 85) {
      evaluaciones.push({ categoria: 'Usabilidad', estado: '✅ BUENA', valor: `${usabilidadPromedio.toFixed(1)}%` });
    } else if (usabilidadPromedio >= 70) {
      evaluaciones.push({ categoria: 'Usabilidad', estado: '⚠️ ACEPTABLE', valor: `${usabilidadPromedio.toFixed(1)}%` });
    } else {
      evaluaciones.push({ categoria: 'Usabilidad', estado: '❌ DEFICIENTE', valor: `${usabilidadPromedio.toFixed(1)}%` });
    }
    
    // Mostrar evaluaciones
    console.log('\n🎯 EVALUACIONES POR CATEGORÍA:');
    evaluaciones.forEach(evaluacion => {
      console.log(`   ${evaluacion.categoria.padEnd(20)} ${evaluacion.estado.padEnd(15)} ${evaluacion.valor}`);
    });
    
    // Evaluación general
    const estadosPositivos = evaluaciones.filter(e => e.estado.includes('✅')).length;
    const estadosNegativos = evaluaciones.filter(e => e.estado.includes('❌')).length;
    const estadosAdvertencia = evaluaciones.filter(e => e.estado.includes('⚠️')).length;
    
    console.log('\n🏆 EVALUACIÓN GENERAL:');
    
    if (estadosNegativos === 0 && estadosAdvertencia === 0) {
      console.log('   ✅ EXCELENTE - Componente listo para producción');
    } else if (estadosNegativos === 0 && estadosAdvertencia <= 1) {
      console.log('   ✅ BUENO - Componente funcional con optimizaciones menores');
    } else if (estadosNegativos === 0) {
      console.log('   ⚠️ ACEPTABLE - Requiere optimizaciones antes de producción');
    } else {
      console.log('   ❌ DEFICIENTE - Requiere correcciones importantes');
    }
    
    console.log(`\n📊 RESUMEN:`);
    console.log(`   ✅ Categorías excelentes/buenas: ${estadosPositivos}/${evaluaciones.length}`);
    console.log(`   ⚠️ Categorías con advertencias: ${estadosAdvertencia}/${evaluaciones.length}`);
    console.log(`   ❌ Categorías deficientes: ${estadosNegativos}/${evaluaciones.length}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Validación de rendimiento completada');
    console.log('='.repeat(80));
  }
}

// Ejecutar validación si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new RendimientoValidator();
  validator.ejecutarValidaciones().catch(console.error);
}

export default RendimientoValidator;