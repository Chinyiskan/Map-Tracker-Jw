// backend/infrastructure/database/QueryOptimizationService.js
// Servicio de optimización de consultas SQL complejas

/**
 * Servicio de Optimización de Consultas - Mejora el rendimiento de consultas complejas
 * Implementa patrones avanzados de SQL para maximizar el rendimiento
 */
export class QueryOptimizationService {
  
  /**
   * Optimizar consulta de estadísticas globales con CTEs
   * @param {Object} database - Cliente de base de datos
   * @param {Object} filters - Filtros aplicados
   * @returns {Promise<Object>} Estadísticas optimizadas
   */
  static async getGlobalStatsOptimized(database, filters = {}) {
    try {
      console.log('🚀 Ejecutando consulta de estadísticas globales optimizada');
      
      const { fechaDesde, fechaHasta, barrio } = filters;
      
      // Construir filtros WHERE
      let whereClause = '';
      const params = [];
      
      if (fechaDesde || fechaHasta || barrio) {
        const conditions = [];
        
        if (fechaDesde) {
          conditions.push('r.fecha >= $' + (params.length + 1));
          params.push(fechaDesde);
        }
        if (fechaHasta) {
          conditions.push('r.fecha <= $' + (params.length + 1));
          params.push(fechaHasta);
        }
        if (barrio) {
          conditions.push('r.barrio = $' + (params.length + 1));
          params.push(barrio);
        }
        
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }
      
      // Consulta optimizada con CTEs (Common Table Expressions)
      const sqlQuery = `
        WITH reporte_stats AS (
          SELECT 
            COUNT(*) as total_reportes,
            COUNT(DISTINCT barrio) as barrios_unicos,
            COUNT(DISTINCT nombre_capitan) as capitanes_unicos,
            MIN(fecha) as fecha_primer_reporte,
            MAX(fecha) as fecha_ultimo_reporte,
            COUNT(CASE WHEN fecha >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as reportes_semana,
            COUNT(CASE WHEN fecha >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as reportes_mes
          FROM reportes r
          ${whereClause}
        ),
        ciclo_stats AS (
          SELECT 
            COUNT(*) as total_ciclos,
            COUNT(CASE WHEN estado = 'activo' THEN 1 END) as ciclos_activos,
            COUNT(CASE WHEN estado = 'completado' THEN 1 END) as ciclos_completados,
            AVG(progreso_porcentaje) as progreso_promedio,
            COUNT(DISTINCT barrio) as barrios_con_ciclos
          FROM ciclos c
          ${barrio ? 'WHERE c.barrio = $' + params.length : ''}
        ),
        progreso_stats AS (
          SELECT 
            COUNT(*) as total_territorios_trabajados,
            COUNT(DISTINCT territorio) as territorios_unicos,
            COUNT(DISTINCT DATE(fecha_trabajado)) as dias_activos
          FROM progreso_territorios p
          INNER JOIN ciclos c ON p.ciclo_id = c.id
          ${whereClause.replace('r.', 'p.').replace('fecha', 'fecha_trabajado')}
        ),
        capitan_stats AS (
          SELECT 
            COUNT(*) as total_capitanes,
            COUNT(CASE WHEN telefono IS NOT NULL AND telefono != '' THEN 1 END) as capitanes_con_telefono,
            COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as capitanes_con_email
          FROM capitanes
        )
        SELECT 
          rs.*,
          cs.total_ciclos,
          cs.ciclos_activos,
          cs.ciclos_completados,
          cs.progreso_promedio,
          cs.barrios_con_ciclos,
          ps.total_territorios_trabajados,
          ps.territorios_unicos,
          ps.dias_activos,
          caps.total_capitanes,
          caps.capitanes_con_telefono,
          caps.capitanes_con_email
        FROM reporte_stats rs
        CROSS JOIN ciclo_stats cs
        CROSS JOIN progreso_stats ps
        CROSS JOIN capitan_stats caps
      `;
      
      const { data, error } = await database.rpc('execute_sql', {
        query: sqlQuery,
        params: params
      });
      
      if (error) {
        throw error;
      }
      
      const result = data && data.length > 0 ? data[0] : {};
      
      console.log('✅ Estadísticas globales calculadas con CTE optimizado');
      return {
        reportes: {
          total: parseInt(result.total_reportes) || 0,
          barrios_unicos: parseInt(result.barrios_unicos) || 0,
          capitanes_unicos: parseInt(result.capitanes_unicos) || 0,
          fecha_primer_reporte: result.fecha_primer_reporte,
          fecha_ultimo_reporte: result.fecha_ultimo_reporte,
          reportes_semana: parseInt(result.reportes_semana) || 0,
          reportes_mes: parseInt(result.reportes_mes) || 0
        },
        ciclos: {
          total: parseInt(result.total_ciclos) || 0,
          activos: parseInt(result.ciclos_activos) || 0,
          completados: parseInt(result.ciclos_completados) || 0,
          progreso_promedio: parseFloat(result.progreso_promedio) || 0,
          barrios_con_ciclos: parseInt(result.barrios_con_ciclos) || 0
        },
        progreso: {
          territorios_trabajados: parseInt(result.total_territorios_trabajados) || 0,
          territorios_unicos: parseInt(result.territorios_unicos) || 0,
          dias_activos: parseInt(result.dias_activos) || 0
        },
        capitanes: {
          total: parseInt(result.total_capitanes) || 0,
          con_telefono: parseInt(result.capitanes_con_telefono) || 0,
          con_email: parseInt(result.capitanes_con_email) || 0
        }
      };
      
    } catch (error) {
      console.error('❌ Error en consulta de estadísticas globales optimizada:', error);
      throw error;
    }
  }
  
  /**
   * Obtener ranking de barrios con consulta optimizada
   * @param {Object} database - Cliente de base de datos
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Array>} Ranking de barrios
   */
  static async getBarriosRankingOptimized(database, options = {}) {
    try {
      console.log('🚀 Ejecutando ranking de barrios optimizado');
      
      const { limite = 10, fechaDesde, fechaHasta } = options;
      
      // Construir filtros WHERE
      let whereClause = '';
      const params = [];
      
      if (fechaDesde || fechaHasta) {
        const conditions = [];
        
        if (fechaDesde) {
          conditions.push('r.fecha >= $' + (params.length + 1));
          conditions.push('p.fecha_trabajado >= $' + (params.length + 1));
          params.push(fechaDesde);
        }
        if (fechaHasta) {
          conditions.push('r.fecha <= $' + (params.length + 1));
          conditions.push('p.fecha_trabajado <= $' + (params.length + 1));
          params.push(fechaHasta);
        }
        
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }
      
      // Consulta optimizada con window functions
      const sqlQuery = `
        WITH barrio_metrics AS (
          SELECT 
            c.barrio,
            c.total_territorios,
            c.progreso_porcentaje,
            c.estado as ciclo_estado,
            COUNT(DISTINCT r.id) as total_reportes,
            COUNT(DISTINCT r.nombre_capitan) as capitanes_activos,
            COUNT(DISTINCT p.territorio) as territorios_trabajados,
            MAX(r.fecha) as ultimo_reporte,
            MAX(p.fecha_trabajado) as ultimo_trabajo,
            AVG(ARRAY_LENGTH(STRING_TO_ARRAY(r.manzanas, ','), 1)) as promedio_manzanas_reporte
          FROM ciclos c
          LEFT JOIN reportes r ON c.barrio = r.barrio ${fechaDesde || fechaHasta ? 'AND ' + whereClause.split('WHERE ')[1].split(' AND p.')[0] : ''}
          LEFT JOIN progreso_territorios p ON c.id = p.ciclo_id ${fechaDesde || fechaHasta ? 'AND ' + whereClause.split('p.fecha_trabajado')[0].split('p.fecha_trabajado')[1] + 'p.fecha_trabajado' + whereClause.split('p.fecha_trabajado')[1] : ''}
          WHERE c.estado = 'activo'
          GROUP BY c.id, c.barrio, c.total_territorios, c.progreso_porcentaje, c.estado
        ),
        ranked_barrios AS (
          SELECT 
            *,
            RANK() OVER (ORDER BY progreso_porcentaje DESC, total_reportes DESC) as ranking_progreso,
            RANK() OVER (ORDER BY total_reportes DESC, territorios_trabajados DESC) as ranking_actividad,
            CASE 
              WHEN progreso_porcentaje >= 80 THEN 'Excelente'
              WHEN progreso_porcentaje >= 60 THEN 'Bueno'
              WHEN progreso_porcentaje >= 40 THEN 'Regular'
              ELSE 'Necesita atención'
            END as categoria_progreso,
            ROUND(
              (progreso_porcentaje * 0.4 + 
               (total_reportes::float / NULLIF(MAX(total_reportes) OVER (), 0)) * 100 * 0.3 + 
               (territorios_trabajados::float / NULLIF(total_territorios, 0)) * 100 * 0.3), 2
            ) as score_general
          FROM barrio_metrics
        )
        SELECT 
          barrio,
          total_territorios,
          progreso_porcentaje,
          ciclo_estado,
          total_reportes,
          capitanes_activos,
          territorios_trabajados,
          ultimo_reporte,
          ultimo_trabajo,
          promedio_manzanas_reporte,
          ranking_progreso,
          ranking_actividad,
          categoria_progreso,
          score_general
        FROM ranked_barrios
        ORDER BY score_general DESC, progreso_porcentaje DESC
        LIMIT $${params.length + 1}
      `;
      
      params.push(limite);
      
      const { data, error } = await database.rpc('execute_sql', {
        query: sqlQuery,
        params: params
      });
      
      if (error) {
        throw error;
      }
      
      console.log(`✅ Ranking de ${data?.length || 0} barrios calculado con window functions`);
      return (data || []).map(row => ({
        barrio: row.barrio,
        total_territorios: parseInt(row.total_territorios) || 0,
        progreso_porcentaje: parseFloat(row.progreso_porcentaje) || 0,
        ciclo_estado: row.ciclo_estado,
        total_reportes: parseInt(row.total_reportes) || 0,
        capitanes_activos: parseInt(row.capitanes_activos) || 0,
        territorios_trabajados: parseInt(row.territorios_trabajados) || 0,
        ultimo_reporte: row.ultimo_reporte,
        ultimo_trabajo: row.ultimo_trabajo,
        promedio_manzanas_reporte: parseFloat(row.promedio_manzanas_reporte) || 0,
        ranking_progreso: parseInt(row.ranking_progreso) || 0,
        ranking_actividad: parseInt(row.ranking_actividad) || 0,
        categoria_progreso: row.categoria_progreso,
        score_general: parseFloat(row.score_general) || 0
      }));
      
    } catch (error) {
      console.error('❌ Error en ranking de barrios optimizado:', error);
      throw error;
    }
  }
  
  /**
   * Análisis de tendencias temporales con consulta optimizada
   * @param {Object} database - Cliente de base de datos
   * @param {Object} options - Opciones de análisis
   * @returns {Promise<Object>} Análisis de tendencias
   */
  static async getTendenciasTemporalesOptimized(database, options = {}) {
    try {
      console.log('🚀 Ejecutando análisis de tendencias temporales optimizado');
      
      const { 
        fechaDesde = '2024-01-01', 
        fechaHasta = new Date().toISOString().split('T')[0],
        granularidad = 'month' // 'day', 'week', 'month'
      } = options;
      
      // Determinar función de truncado según granularidad
      const truncFunction = {
        'day': 'DATE(fecha)',
        'week': 'DATE_TRUNC(\'week\', fecha)',
        'month': 'DATE_TRUNC(\'month\', fecha)'
      }[granularidad] || 'DATE_TRUNC(\'month\', fecha)';
      
      // Consulta optimizada con análisis temporal
      const sqlQuery = `
        WITH fecha_series AS (
          SELECT generate_series(
            DATE_TRUNC('${granularidad}', $1::date),
            DATE_TRUNC('${granularidad}', $2::date),
            INTERVAL '1 ${granularidad}'
          ) as periodo
        ),
        reportes_por_periodo AS (
          SELECT 
            ${truncFunction} as periodo,
            COUNT(*) as total_reportes,
            COUNT(DISTINCT barrio) as barrios_activos,
            COUNT(DISTINCT nombre_capitan) as capitanes_activos,
            AVG(ARRAY_LENGTH(STRING_TO_ARRAY(manzanas, ','), 1)) as promedio_manzanas
          FROM reportes
          WHERE fecha >= $1 AND fecha <= $2
          GROUP BY ${truncFunction}
        ),
        progreso_por_periodo AS (
          SELECT 
            ${truncFunction.replace('fecha', 'fecha_trabajado')} as periodo,
            COUNT(*) as territorios_trabajados,
            COUNT(DISTINCT territorio) as territorios_unicos,
            COUNT(DISTINCT ciclo_id) as ciclos_activos
          FROM progreso_territorios
          WHERE fecha_trabajado >= $1 AND fecha_trabajado <= $2
          GROUP BY ${truncFunction.replace('fecha', 'fecha_trabajado')}
        ),
        tendencias AS (
          SELECT 
            fs.periodo,
            COALESCE(rpp.total_reportes, 0) as total_reportes,
            COALESCE(rpp.barrios_activos, 0) as barrios_activos,
            COALESCE(rpp.capitanes_activos, 0) as capitanes_activos,
            COALESCE(rpp.promedio_manzanas, 0) as promedio_manzanas,
            COALESCE(ppp.territorios_trabajados, 0) as territorios_trabajados,
            COALESCE(ppp.territorios_unicos, 0) as territorios_unicos,
            COALESCE(ppp.ciclos_activos, 0) as ciclos_activos,
            LAG(COALESCE(rpp.total_reportes, 0)) OVER (ORDER BY fs.periodo) as reportes_periodo_anterior,
            LAG(COALESCE(ppp.territorios_trabajados, 0)) OVER (ORDER BY fs.periodo) as territorios_periodo_anterior
          FROM fecha_series fs
          LEFT JOIN reportes_por_periodo rpp ON fs.periodo = rpp.periodo
          LEFT JOIN progreso_por_periodo ppp ON fs.periodo = ppp.periodo
          ORDER BY fs.periodo
        )
        SELECT 
          periodo,
          total_reportes,
          barrios_activos,
          capitanes_activos,
          promedio_manzanas,
          territorios_trabajados,
          territorios_unicos,
          ciclos_activos,
          CASE 
            WHEN reportes_periodo_anterior > 0 THEN 
              ROUND(((total_reportes - reportes_periodo_anterior)::float / reportes_periodo_anterior) * 100, 2)
            ELSE 0
          END as crecimiento_reportes_pct,
          CASE 
            WHEN territorios_periodo_anterior > 0 THEN 
              ROUND(((territorios_trabajados - territorios_periodo_anterior)::float / territorios_periodo_anterior) * 100, 2)
            ELSE 0
          END as crecimiento_territorios_pct
        FROM tendencias
        ORDER BY periodo
      `;
      
      const { data, error } = await database.rpc('execute_sql', {
        query: sqlQuery,
        params: [fechaDesde, fechaHasta]
      });
      
      if (error) {
        throw error;
      }
      
      const tendencias = (data || []).map(row => ({
        periodo: row.periodo,
        total_reportes: parseInt(row.total_reportes) || 0,
        barrios_activos: parseInt(row.barrios_activos) || 0,
        capitanes_activos: parseInt(row.capitanes_activos) || 0,
        promedio_manzanas: parseFloat(row.promedio_manzanas) || 0,
        territorios_trabajados: parseInt(row.territorios_trabajados) || 0,
        territorios_unicos: parseInt(row.territorios_unicos) || 0,
        ciclos_activos: parseInt(row.ciclos_activos) || 0,
        crecimiento_reportes_pct: parseFloat(row.crecimiento_reportes_pct) || 0,
        crecimiento_territorios_pct: parseFloat(row.crecimiento_territorios_pct) || 0
      }));
      
      // Calcular métricas de resumen
      const resumen = {
        total_periodos: tendencias.length,
        promedio_reportes_periodo: tendencias.reduce((sum, t) => sum + t.total_reportes, 0) / tendencias.length || 0,
        promedio_territorios_periodo: tendencias.reduce((sum, t) => sum + t.territorios_trabajados, 0) / tendencias.length || 0,
        crecimiento_promedio_reportes: tendencias.reduce((sum, t) => sum + t.crecimiento_reportes_pct, 0) / tendencias.length || 0,
        crecimiento_promedio_territorios: tendencias.reduce((sum, t) => sum + t.crecimiento_territorios_pct, 0) / tendencias.length || 0,
        periodo_mas_activo: tendencias.reduce((max, t) => 
          t.total_reportes > max.total_reportes ? t : max, 
          tendencias[0] || {}
        )
      };
      
      console.log(`✅ Análisis de tendencias calculado para ${tendencias.length} periodos`);
      return {
        tendencias,
        resumen,
        granularidad,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta
      };
      
    } catch (error) {
      console.error('❌ Error en análisis de tendencias temporales:', error);
      throw error;
    }
  }
  
  /**
   * Consulta de correlación entre reportes y progreso
   * @param {Object} database - Cliente de base de datos
   * @param {Object} options - Opciones de análisis
   * @returns {Promise<Object>} Análisis de correlación
   */
  static async getCorrelacionReportesProgreso(database, options = {}) {
    try {
      console.log('🚀 Ejecutando análisis de correlación reportes-progreso');
      
      const { fechaDesde, fechaHasta, barrio } = options;
      
      // Construir filtros WHERE
      let whereClause = '';
      const params = [];
      
      if (fechaDesde || fechaHasta || barrio) {
        const conditions = [];
        
        if (fechaDesde) {
          conditions.push('r.fecha >= $' + (params.length + 1));
          conditions.push('p.fecha_trabajado >= $' + (params.length + 1));
          params.push(fechaDesde);
        }
        if (fechaHasta) {
          conditions.push('r.fecha <= $' + (params.length + 1));
          conditions.push('p.fecha_trabajado <= $' + (params.length + 1));
          params.push(fechaHasta);
        }
        if (barrio) {
          conditions.push('c.barrio = $' + (params.length + 1));
          params.push(barrio);
        }
        
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }
      
      // Consulta optimizada con análisis estadístico
      const sqlQuery = `
        WITH datos_correlacion AS (
          SELECT 
            c.barrio,
            DATE_TRUNC('week', r.fecha) as semana,
            COUNT(DISTINCT r.id) as reportes_semana,
            COUNT(DISTINCT p.territorio) as territorios_trabajados_semana,
            AVG(c.progreso_porcentaje) as progreso_promedio_semana
          FROM ciclos c
          LEFT JOIN reportes r ON c.barrio = r.barrio
          LEFT JOIN progreso_territorios p ON c.id = p.ciclo_id 
            AND DATE_TRUNC('week', p.fecha_trabajado) = DATE_TRUNC('week', r.fecha)
          ${whereClause}
          GROUP BY c.barrio, DATE_TRUNC('week', r.fecha)
          HAVING COUNT(DISTINCT r.id) > 0 OR COUNT(DISTINCT p.territorio) > 0
        ),
        estadisticas_correlacion AS (
          SELECT 
            barrio,
            COUNT(*) as semanas_con_datos,
            AVG(reportes_semana) as promedio_reportes_semana,
            AVG(territorios_trabajados_semana) as promedio_territorios_semana,
            STDDEV(reportes_semana) as desviacion_reportes,
            STDDEV(territorios_trabajados_semana) as desviacion_territorios,
            CORR(reportes_semana, territorios_trabajados_semana) as correlacion_reportes_territorios,
            CORR(reportes_semana, progreso_promedio_semana) as correlacion_reportes_progreso
          FROM datos_correlacion
          GROUP BY barrio
        )
        SELECT 
          barrio,
          semanas_con_datos,
          ROUND(promedio_reportes_semana, 2) as promedio_reportes_semana,
          ROUND(promedio_territorios_semana, 2) as promedio_territorios_semana,
          ROUND(desviacion_reportes, 2) as desviacion_reportes,
          ROUND(desviacion_territorios, 2) as desviacion_territorios,
          ROUND(correlacion_reportes_territorios, 3) as correlacion_reportes_territorios,
          ROUND(correlacion_reportes_progreso, 3) as correlacion_reportes_progreso,
          CASE 
            WHEN ABS(correlacion_reportes_territorios) >= 0.7 THEN 'Fuerte'
            WHEN ABS(correlacion_reportes_territorios) >= 0.4 THEN 'Moderada'
            WHEN ABS(correlacion_reportes_territorios) >= 0.2 THEN 'Débil'
            ELSE 'Muy débil'
          END as fuerza_correlacion
        FROM estadisticas_correlacion
        WHERE semanas_con_datos >= 3
        ORDER BY ABS(correlacion_reportes_territorios) DESC
      `;
      
      const { data, error } = await database.rpc('execute_sql', {
        query: sqlQuery,
        params: params
      });
      
      if (error) {
        throw error;
      }
      
      const correlaciones = (data || []).map(row => ({
        barrio: row.barrio,
        semanas_con_datos: parseInt(row.semanas_con_datos) || 0,
        promedio_reportes_semana: parseFloat(row.promedio_reportes_semana) || 0,
        promedio_territorios_semana: parseFloat(row.promedio_territorios_semana) || 0,
        desviacion_reportes: parseFloat(row.desviacion_reportes) || 0,
        desviacion_territorios: parseFloat(row.desviacion_territorios) || 0,
        correlacion_reportes_territorios: parseFloat(row.correlacion_reportes_territorios) || 0,
        correlacion_reportes_progreso: parseFloat(row.correlacion_reportes_progreso) || 0,
        fuerza_correlacion: row.fuerza_correlacion
      }));
      
      // Calcular estadísticas globales
      const estadisticas_globales = {
        total_barrios_analizados: correlaciones.length,
        correlacion_promedio: correlaciones.reduce((sum, c) => sum + c.correlacion_reportes_territorios, 0) / correlaciones.length || 0,
        barrios_correlacion_fuerte: correlaciones.filter(c => c.fuerza_correlacion === 'Fuerte').length,
        barrios_correlacion_moderada: correlaciones.filter(c => c.fuerza_correlacion === 'Moderada').length,
        barrio_mejor_correlacion: correlaciones[0] || null
      };
      
      console.log(`✅ Análisis de correlación completado para ${correlaciones.length} barrios`);
      return {
        correlaciones,
        estadisticas_globales,
        filtros_aplicados: { fechaDesde, fechaHasta, barrio }
      };
      
    } catch (error) {
      console.error('❌ Error en análisis de correlación:', error);
      throw error;
    }
  }
  
  /**
   * Optimizar consulta existente agregando índices virtuales
   * @param {string} originalQuery - Consulta original
   * @param {Array} params - Parámetros de la consulta
   * @returns {Object} Consulta optimizada
   */
  static optimizeExistingQuery(originalQuery, params = []) {
    console.log('🔧 Optimizando consulta existente...');
    
    let optimizedQuery = originalQuery;
    const optimizations = [];
    
    // Optimización 1: Agregar hints de índice para fechas
    if (optimizedQuery.includes('fecha >=') || optimizedQuery.includes('fecha <=')) {
      optimizedQuery = optimizedQuery.replace(
        /WHERE/i,
        '/*+ INDEX(fecha_idx) */ WHERE'
      );
      optimizations.push('Agregado hint de índice para fechas');
    }
    
    // Optimización 2: Reescribir subconsultas como JOINs
    if (optimizedQuery.includes('IN (SELECT')) {
      // Esta es una optimización compleja que requeriría análisis específico
      optimizations.push('Subconsulta detectada - considerar reescribir como JOIN');
    }
    
    // Optimización 3: Agregar LIMIT si no existe en consultas grandes
    if (!optimizedQuery.includes('LIMIT') && optimizedQuery.includes('ORDER BY')) {
      optimizedQuery += ' LIMIT 1000';
      optimizations.push('Agregado LIMIT por defecto para prevenir consultas masivas');
    }
    
    // Optimización 4: Sugerir particionado para consultas temporales
    if (optimizedQuery.includes('DATE_TRUNC') || optimizedQuery.includes('EXTRACT')) {
      optimizations.push('Consulta temporal detectada - considerar particionado por fecha');
    }
    
    console.log(`✅ Consulta optimizada con ${optimizations.length} mejoras`);
    return {
      optimizedQuery,
      originalQuery,
      optimizations,
      params
    };
  }
  
  /**
   * Generar plan de ejecución para análisis de performance
   * @param {Object} database - Cliente de base de datos
   * @param {string} query - Consulta a analizar
   * @param {Array} params - Parámetros de la consulta
   * @returns {Promise<Object>} Plan de ejecución
   */
  static async getExecutionPlan(database, query, params = []) {
    try {
      console.log('📊 Generando plan de ejecución...');
      
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      
      const { data, error } = await database.rpc('execute_sql', {
        query: explainQuery,
        params: params
      });
      
      if (error) {
        throw error;
      }
      
      const plan = data && data.length > 0 ? data[0] : {};
      
      console.log('✅ Plan de ejecución generado');
      return {
        plan,
        query,
        params,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error generando plan de ejecución:', error);
      throw error;
    }
  }
}

export default QueryOptimizationService;