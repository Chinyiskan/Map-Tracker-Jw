// tests/integration/CacheAndSQLOptimizations.test.js
// Tests de integración para cache y consultas SQL optimizadas

import { performance } from 'perf_hooks';
import ReporteRepository from '../../backend/infrastructure/database/repositories/ReporteRepository.js';
import ProgresoRepository from '../../backend/infrastructure/database/repositories/ProgresoRepository.js';
import ReporteService from '../../backend/application/services/ReporteService.js';
import CicloService from '../../backend/application/services/CicloService.js';
import cacheService from '../../backend/infrastructure/cache/CacheService.js';

// Mock de Supabase para tests de integración
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  rpc: jest.fn()
};

describe('Integration Tests - Cache + SQL Optimizations', () => {
  let reporteRepository;
  let progresoRepository;
  let reporteService;
  let cicloService;
  
  beforeAll(() => {
    // Configurar repositorios
    reporteRepository = new ReporteRepository(mockSupabaseClient);
    progresoRepository = new ProgresoRepository(mockSupabaseClient);
    
    // Configurar servicios
    reporteService = new ReporteService(reporteRepository, null, null);
    cicloService = new CicloService(null, progresoRepository);
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    cacheService.clear();
  });
  
  describe('Integración Cache + Consultas Optimizadas', () => {
    test('progreso de barrios debe usar cache en segunda llamada', async () => {
      const mockProgreso = [
        {
          barrio: 'Alcalá',
          numero_ciclo: 1,
          total_territorios: 50,
          territorios_trabajados: 35,
          progreso_porcentaje: 70.0,
          estado: 'activo'
        },
        {
          barrio: 'Niza',
          numero_ciclo: 2,
          total_territorios: 45,
          territorios_trabajados: 45,
          progreso_porcentaje: 100.0,
          estado: 'completado'
        }
      ];
      
      // Mock para consulta SQL optimizada
      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockProgreso,
        error: null
      });
      
      const opciones = {
        fechaInicio: '2024-01-01',
        fechaFin: '2024-03-31'
      };
      
      // Primera llamada - debe ir a la base de datos
      const start1 = performance.now();
      const result1 = await cicloService.obtenerProgresoTodosBarrios(opciones);
      const end1 = performance.now();
      const time1 = end1 - start1;
      
      // Segunda llamada - debe usar cache
      const start2 = performance.now();
      const result2 = await cicloService.obtenerProgresoTodosBarrios(opciones);
      const end2 = performance.now();
      const time2 = end2 - start2;
      
      // Validaciones
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data).toEqual(result2.data);
      
      // La segunda llamada debe ser significativamente más rápida (cache hit)
      expect(time2).toBeLessThan(time1 * 0.1); // Al menos 10x más rápido
      
      // Debe haber llamado a RPC solo una vez (primera llamada)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(1);
      
      console.log(`🔄 Primera llamada (DB): ${time1.toFixed(2)}ms`);
      console.log(`⚡ Segunda llamada (Cache): ${time2.toFixed(2)}ms`);
      console.log(`📈 Mejora con cache: ${(time1 / time2).toFixed(1)}x más rápido`);
    });
    
    test('invalidación de cache debe forzar nueva consulta SQL', async () => {
      const mockEstadisticas = {
        total_reportes: 1000,
        barrios_unicos: 12,
        capitanes_unicos: 20
      };
      
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [mockEstadisticas],
        error: null
      });
      
      const opciones = {
        fechaDesde: '2024-01-01',
        fechaHasta: '2024-03-31'
      };
      
      // Primera llamada
      await reporteService.obtenerEstadisticas(opciones);
      
      // Verificar que hay datos en cache
      const cacheStats = cacheService.getStats();
      expect(cacheStats.size).toBeGreaterThan(0);
      
      // Invalidar cache de estadísticas
      const invalidated = cacheService.invalidatePattern(/estadisticas/);
      expect(invalidated).toBeGreaterThan(0);
      
      // Segunda llamada después de invalidación
      await reporteService.obtenerEstadisticas(opciones);
      
      // Debe haber llamado a RPC dos veces (antes y después de invalidación)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(2);
      
      console.log(`🗑️ Cache invalidado: ${invalidated} entradas`);
    });
    
    test('fallback a método legacy debe funcionar cuando SQL optimizado falla', async () => {
      const mockReportesLegacy = [
        {
          barrio: 'Alcalá',
          nombre_capitan: 'Juan Pérez',
          fecha: '2024-01-15'
        },
        {
          barrio: 'Niza',
          nombre_capitan: 'María García',
          fecha: '2024-02-10'
        }
      ];
      
      // Simular fallo en consulta SQL optimizada
      mockSupabaseClient.rpc.mockRejectedValueOnce(new Error('SQL optimization failed'));
      
      // Configurar mock para método legacy
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: mockReportesLegacy,
                error: null
              })
            })
          })
        })
      });
      
      const result = await reporteService.obtenerEstadisticas({
        fechaDesde: '2024-01-01',
        fechaHasta: '2024-03-31'
      });
      
      // Debe funcionar usando método legacy
      expect(result.success).toBe(true);
      expect(result.data.total_reportes).toBe(2);
      expect(result.data.barrios_unicos).toBe(2);
      
      // Debe haber intentado RPC primero, luego usar método legacy
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(1);
      expect(mockSupabaseClient.from).toHaveBeenCalled();
      
      console.log('✅ Fallback a método legacy funcionó correctamente');
    });
    
    test('múltiples consultas concurrentes deben usar cache eficientemente', async () => {
      const mockProgreso = [
        {
          barrio: 'Alcalá',
          progreso_porcentaje: 75.0,
          estado: 'activo'
        }
      ];
      
      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockProgreso,
        error: null
      });
      
      const opciones = {
        fechaInicio: '2024-01-01',
        fechaFin: '2024-03-31'
      };
      
      // Ejecutar múltiples consultas concurrentes
      const promises = Array.from({ length: 5 }, () => 
        cicloService.obtenerProgresoTodosBarrios(opciones)
      );
      
      const start = performance.now();
      const results = await Promise.all(promises);
      const end = performance.now();
      const totalTime = end - start;
      
      // Todas las consultas deben ser exitosas
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data).toEqual(expect.arrayContaining([
          expect.objectContaining({ barrio: 'Alcalá' })
        ]));
      });
      
      // Solo debe haber una llamada a RPC (las demás usan cache)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(1);
      
      // El tiempo total debe ser razonable para 5 consultas
      expect(totalTime).toBeLessThan(500); // Menos de 500ms para 5 consultas
      
      console.log(`🚀 5 consultas concurrentes: ${totalTime.toFixed(2)}ms`);
      console.log(`📊 Promedio por consulta: ${(totalTime / 5).toFixed(2)}ms`);
    });
  });
  
  describe('Integración Completa del Sistema', () => {
    test('flujo completo: estadísticas + progreso + cache debe ser eficiente', async () => {
      // Mock de datos para estadísticas
      const mockEstadisticas = {
        total_reportes: 500,
        barrios_unicos: 8,
        capitanes_unicos: 15,
        reportes_ultima_semana: 25,
        reportes_ultimo_mes: 120
      };
      
      // Mock de datos para progreso
      const mockProgreso = [
        {
          barrio: 'Alcalá',
          progreso_porcentaje: 85.0,
          estado: 'activo'
        },
        {
          barrio: 'Niza',
          progreso_porcentaje: 100.0,
          estado: 'completado'
        }
      ];
      
      // Configurar mocks
      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: [mockEstadisticas], error: null })
        .mockResolvedValueOnce({ data: mockProgreso, error: null });
      
      const fechaInicio = '2024-01-01';
      const fechaFin = '2024-03-31';
      
      const start = performance.now();
      
      // Ejecutar flujo completo
      const [estadisticas, progreso] = await Promise.all([
        reporteService.obtenerEstadisticas({
          fechaDesde: fechaInicio,
          fechaHasta: fechaFin
        }),
        cicloService.obtenerProgresoTodosBarrios({
          fechaInicio,
          fechaFin
        })
      ]);
      
      const end = performance.now();
      const totalTime = end - start;
      
      // Validaciones
      expect(estadisticas.success).toBe(true);
      expect(progreso.success).toBe(true);
      expect(estadisticas.data.total_reportes).toBe(500);
      expect(progreso.data).toHaveLength(2);
      
      // El flujo completo debe ser rápido
      expect(totalTime).toBeLessThan(300); // Menos de 300ms
      
      // Verificar que se usaron consultas optimizadas
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(2);
      
      console.log(`🔄 Flujo completo ejecutado en: ${totalTime.toFixed(2)}ms`);
      
      // Segunda ejecución debe usar cache
      const start2 = performance.now();
      const [estadisticas2, progreso2] = await Promise.all([
        reporteService.obtenerEstadisticas({
          fechaDesde: fechaInicio,
          fechaHasta: fechaFin
        }),
        cicloService.obtenerProgresoTodosBarrios({
          fechaInicio,
          fechaFin
        })
      ]);
      const end2 = performance.now();
      const cachedTime = end2 - start2;
      
      expect(estadisticas2.success).toBe(true);
      expect(progreso2.success).toBe(true);
      expect(cachedTime).toBeLessThan(totalTime * 0.2); // Al menos 5x más rápido
      
      console.log(`⚡ Flujo con cache: ${cachedTime.toFixed(2)}ms`);
      console.log(`📈 Mejora con cache: ${(totalTime / cachedTime).toFixed(1)}x más rápido`);
    });
    
    test('manejo de errores en integración debe ser robusto', async () => {
      // Simular diferentes tipos de errores
      const errorScenarios = [
        { error: new Error('Network timeout'), description: 'Timeout de red' },
        { error: new Error('Database connection failed'), description: 'Fallo de conexión DB' },
        { error: new Error('SQL syntax error'), description: 'Error de sintaxis SQL' }
      ];
      
      for (const scenario of errorScenarios) {
        // Limpiar mocks y cache
        jest.clearAllMocks();
        cacheService.clear();
        
        // Simular error en consulta optimizada
        mockSupabaseClient.rpc.mockRejectedValueOnce(scenario.error);
        
        // Configurar fallback exitoso
        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [{ barrio: 'Test', nombre_capitan: 'Test', fecha: '2024-01-01' }],
                  error: null
                })
              })
            })
          })
        });
        
        const result = await reporteService.obtenerEstadisticas({
          fechaDesde: '2024-01-01',
          fechaHasta: '2024-03-31'
        });
        
        // El sistema debe recuperarse usando fallback
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        
        console.log(`✅ Recuperación exitosa de: ${scenario.description}`);
      }
    });
    
    test('rendimiento bajo carga simulada debe mantenerse estable', async () => {
      const mockData = {
        estadisticas: { total_reportes: 100, barrios_unicos: 5 },
        progreso: [{ barrio: 'Test', progreso_porcentaje: 50 }]
      };
      
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [mockData.estadisticas],
        error: null
      });
      
      // Simular carga con múltiples usuarios concurrentes
      const concurrentUsers = 10;
      const requestsPerUser = 5;
      
      const allPromises = [];
      const startTime = performance.now();
      
      for (let user = 0; user < concurrentUsers; user++) {
        for (let request = 0; request < requestsPerUser; request++) {
          allPromises.push(
            reporteService.obtenerEstadisticas({
              fechaDesde: '2024-01-01',
              fechaHasta: '2024-03-31'
            })
          );
        }
      }
      
      const results = await Promise.all(allPromises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Todas las consultas deben ser exitosas
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      const totalRequests = concurrentUsers * requestsPerUser;
      const avgTimePerRequest = totalTime / totalRequests;
      
      // El tiempo promedio por request debe ser razonable
      expect(avgTimePerRequest).toBeLessThan(50); // Menos de 50ms por request
      
      // Debe haber usado cache eficientemente (pocas llamadas a RPC)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(1);
      
      console.log(`🚀 ${totalRequests} requests procesados en: ${totalTime.toFixed(2)}ms`);
      console.log(`📊 Tiempo promedio por request: ${avgTimePerRequest.toFixed(2)}ms`);
      console.log(`⚡ Requests por segundo: ${(totalRequests / (totalTime / 1000)).toFixed(1)}`);
    });
  });
  
  describe('Validación de Consistencia de Datos', () => {
    test('datos del cache deben ser consistentes con la base de datos', async () => {
      const mockEstadisticas = {
        total_reportes: 750,
        barrios_unicos: 10,
        capitanes_unicos: 18,
        fecha_primer_reporte: '2024-01-01',
        fecha_ultimo_reporte: '2024-03-31'
      };
      
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [mockEstadisticas],
        error: null
      });
      
      const opciones = {
        fechaDesde: '2024-01-01',
        fechaHasta: '2024-03-31'
      };
      
      // Primera llamada - carga desde DB
      const result1 = await reporteService.obtenerEstadisticas(opciones);
      
      // Segunda llamada - desde cache
      const result2 = await reporteService.obtenerEstadisticas(opciones);
      
      // Los datos deben ser idénticos
      expect(result1.data).toEqual(result2.data);
      expect(result1.data.total_reportes).toBe(750);
      expect(result2.data.total_reportes).toBe(750);
      
      // Verificar que los datos tienen la estructura esperada
      expect(result1.data).toHaveProperty('total_reportes');
      expect(result1.data).toHaveProperty('barrios_unicos');
      expect(result1.data).toHaveProperty('capitanes_unicos');
      expect(result1.data).toHaveProperty('eficiencia_semanal');
      expect(result1.data).toHaveProperty('promedio_reportes_por_barrio');
      
      console.log('✅ Consistencia de datos validada entre DB y cache');
    });
    
    test('TTL del cache debe respetar los tiempos configurados', async () => {
      const mockData = { test: 'data', timestamp: Date.now() };
      
      // Configurar cache con TTL corto para testing
      const shortTTL = 100; // 100ms
      cacheService.set('ttl_test', mockData, shortTTL);
      
      // Inmediatamente debe estar disponible
      expect(cacheService.has('ttl_test')).toBe(true);
      expect(cacheService.get('ttl_test')).toEqual(mockData);
      
      // Esperar a que expire
      await new Promise(resolve => setTimeout(resolve, shortTTL + 50));
      
      // Debe haber expirado
      expect(cacheService.has('ttl_test')).toBe(false);
      expect(cacheService.get('ttl_test')).toBeNull();
      
      console.log(`⏰ TTL de ${shortTTL}ms respetado correctamente`);
    });
  });
  
  afterAll(() => {
    cacheService.clear();
  });
});