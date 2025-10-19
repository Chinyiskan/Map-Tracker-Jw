-- Función optimizada para obtener el progreso de todos los barrios
-- Resuelve el problema de las tarjetas de progreso que muestran 0.0% y datos incorrectos

CREATE OR REPLACE FUNCTION obtener_progreso_barrios_optimizado()
RETURNS TABLE (
    barrio character varying,
    numero_ciclo integer,
    fecha_inicio date,
    total_territorios integer,
    territorios_completados integer,
    progreso_porcentaje numeric,
    reportes_completados integer,
    reportes_pendientes integer,
    total_reportes integer,
    estado character varying
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH barrios_unicos AS (
        -- Obtener todos los barrios únicos de la tabla de referencia
        SELECT DISTINCT mbr.barrio
        FROM manzanas_barrio_referencia mbr
        WHERE mbr.es_valida = true
    ),
    ciclos_activos AS (
        -- Obtener ciclos activos por barrio
        SELECT 
            c.barrio,
            c.numero_ciclo,
            c.fecha_inicio,
            c.total_territorios,
            c.territorios_completados,
            c.progreso_porcentaje,
            c.estado
        FROM ciclos c
        WHERE c.estado = 'activo'
    ),
    territorios_por_barrio AS (
        -- Contar territorios totales por barrio desde la tabla de referencia
        SELECT 
            mbr.barrio,
            COUNT(DISTINCT mbr.manzana) as total_manzanas
        FROM manzanas_barrio_referencia mbr
        WHERE mbr.es_valida = true
        GROUP BY mbr.barrio
    ),
    reportes_por_barrio AS (
        -- Contar reportes por barrio
        SELECT 
            r.barrio,
            COUNT(*) as total_reportes_barrio,
            COUNT(CASE WHEN r.estado = 'finalizado' THEN 1 END) as reportes_completados_barrio
        FROM reportes r
        GROUP BY r.barrio
    )
    SELECT 
        bu.barrio::character varying,
        COALESCE(ca.numero_ciclo, 1)::integer,
        COALESCE(ca.fecha_inicio, CURRENT_DATE)::date,
        -- CORREGIDO: Priorizar total_territorios de ciclos sobre manzanas_barrio_referencia
        COALESCE(ca.total_territorios, tpb.total_manzanas, 0)::integer as total_territorios,
        COALESCE(ca.territorios_completados, 0)::integer,
        COALESCE(ca.progreso_porcentaje, 0.00)::numeric,
        COALESCE(rpb.reportes_completados_barrio, 0)::integer,
        COALESCE(rpb.total_reportes_barrio - rpb.reportes_completados_barrio, 0)::integer as reportes_pendientes,
        COALESCE(rpb.total_reportes_barrio, 0)::integer,
        COALESCE(ca.estado, 'sin_ciclo')::character varying
    FROM barrios_unicos bu
    LEFT JOIN ciclos_activos ca ON bu.barrio = ca.barrio
    LEFT JOIN territorios_por_barrio tpb ON bu.barrio = tpb.barrio
    LEFT JOIN reportes_por_barrio rpb ON bu.barrio = rpb.barrio
    ORDER BY bu.barrio;
END;
$$;

-- Comentario explicativo de la función
COMMENT ON FUNCTION obtener_progreso_barrios_optimizado() IS 
'Función optimizada que retorna el progreso de todos los barrios incluyendo aquellos sin ciclos activos. 
Corrige el problema de datos incorrectos en las tarjetas del dashboard.
Utiliza manzanas_barrio_referencia como fuente de verdad para el total de territorios.';