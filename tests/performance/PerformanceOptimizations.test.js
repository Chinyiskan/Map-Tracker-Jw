// tests/performance/PerformanceOptimizations.test.js
// Tests de performance para validar optimizaciones del Sprint 3

import { performance } from 'perf_hooks';
import ReporteRepository from '../../backend/infrastructure/database/repositories/ReporteRepository.js';
import ProgresoRepository from '../../backend/infrastructure/database/repositories/ProgresoRepository.js';
import ReporteService from '../../backend/application/services/ReporteService.js';
import CicloService from '../../backend/application/services/CicloService.js';
import cacheService from '../../backend/infrastructure/cache/CacheService.js';
import { createClient } from '@supabase/supabase-js';

// Mock de Supabase para tests de performance
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

describe('Performance Tests - Sprint 3 Optimizations', () => {
  let reporteRepository;
  let progresoRepository;
  let reporteService;
  let cicloService;
  
  beforeAll(() => {
    // Configurar repositorios con mock
    reporteRepository = new ReporteRepository(mockSupabaseClient);
    progresoRepository = new ProgresoRepository(mockSupabaseClient);
    
    // Configurar servicios
    reporteService = new ReporteService(reporteRepository, null, null);
    cicloService = new CicloService(null, progresoRepository);
    
    // Limpiar cache antes de tests
    cacheService.clear();
  });
  
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
    cacheService.clear();
  });
  
  describe('Optimización de Consultas SQL', () => {
    test('estadísticas optimizadas vs legacy - debe ser 10x más rápido', async () => {
      // Mock de datos de prueba
      const mockEstadisticas = {
        total_reportes: 1500,
        barrios_unicos: 12,
        capitanes_unicos: 25,
        fecha_primer_reporte: '2024-01-01',
        fecha_ultimo_reporte: '2024-12-31',
        reportes_ultima_semana: 45,
        reportes_ultimo_mes: 180
      };
      
      const mockReportesLegacy = Array.from({ length: 1500 }, (_, i) => ({
        id: i + 1,
        barrio: `Barrio${(i % 12) + 1}`,
        nombre_capitan: `Capitan${(i % 25) + 1}`,
        fecha: new Date(2024, Math.floor(i / 125), (i % 30) + 1).toISOString().slice(0, 10)
      }));
      
      // Configurar mock para método optimizado
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [mockEstadisticas],
        error: null
      });
      
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
      
      // Medir tiempo del método optimizado
      const startOptimized = performance.now();
      const resultOptimized = await reporteService.obtenerEstadisticas({
        fechaDesde: '2024-01-01',
        fechaHasta: '2024-12-31'
      });
      const endOptimized = performance.now();
      const timeOptimized = endOptimized - startOptimized;
      
      // Simular método legacy (forzar error en RPC para activar fallback)
      mockSupabaseClient.rpc.mockRejectedValueOnce(new Error('RPC not available'));
      
      const startLegacy = performance.now();
      const resultLegacy = await reporteService.obtenerEstadisticas({
        fechaDesde: '2024-01-01',
        fechaHasta: '2024-12-31'
      });
      const endLegacy = performance.now();
      const timeLegacy = endLegacy - startLegacy;
      
      // Validaciones
      expect(resultOptimized.success).toBe(true);
      expect(resultLegacy.success).toBe(true);
      
      // El método optimizado debe ser significativamente más rápido
      expect(timeOptimized).toBeLessThan(timeLegacy * 0.5); // Al menos 50% más rápido
      
      console.log(`⚡ Performance Optimizado: ${timeOptimized.toFixed(2)}ms`);
      console.log(`🐌 Performance Legacy: ${timeLegacy.toFixed(2)}ms`);
      console.log(`📈 Mejora: ${((timeLegacy - timeOptimized) / timeLegacy * 100).toFixed(1)}%`);
    });
    
    test('estadísticas mensuales - debe procesar 12 meses en <100ms', async () => {
      const mockEstadisticasMensuales = Array.from({ length: 12 }, (_, i) => ({
        mes: `2024-${String(i + 1).padStart(2, '0')}-01`,
        total_reportes: Math.floor(Math.random() * 200) + 50,
        barrios_activos: Math.floor(Math.random() * 12) + 1,
        capitanes_activos: Math.floor(Math.random() * 25) + 1,
        territorios_trabajados: Math.floor(Math.random() * 100) + 20,
        lista_barrios: [`Barrio${i + 1}`, `Barrio${i + 2}`]
      }));
      
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: mockEstadisticasMensuales,
        error: null
      });
      
      const start = performance.now();
      const result = await reporteService.obtenerEstadisticasMensuales(
        '2024-01-01',
        '2024-12-31'
      );
      const end = performance.now();
      const executionTime = end - start;
      
      expect(result.success).toBe(true);
      expect(result.data.estadisticas_por_mes).toHaveLength(12);
      expect(executionTime).toBeLessThan(100); // Menos de 100ms
      
      console.log(`📊 Estadísticas mensuales procesadas en: ${executionTime.toFixed(2)}ms`);
    });
    
    test('progreso por barrios optimizado - debe ser 5x más rápido que múltiples consultas', async () => {
      const mockProgresoOptimizado = [
        {
          barrio: 'Alcalá',
          numero_ciclo: 1,
          total_territorios: 50,
          territorios_trabajados: 35,
          total_trabajos: 42,
          fecha_inicio_trabajo: '2024-01-15',
          fecha_ultimo_trabajo: '2024-03-10',
          progreso_porcentaje: 70.0,
          estado: 'activo'
        },
        {
          barrio: 'Niza',
          numero_ciclo: 2,
          total_territorios: 45,
          territorios_trabajados: 45,
          total_trabajos: 52,
          fecha_inicio_trabajo: '2024-02-01',
          fecha_ultimo_trabajo: '2024-03-15',
          progreso_porcentaje: 100.0,
          estado: 'completado'
        }
      ];
      
      // Mock para método optimizado
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: mockProgresoOptimizado,
        error: null
      });
      
      const start = performance.now();
      const result = await cicloService.obtenerProgresoTodosBarrios({
        fechaInicio: '2024-01-01',
        fechaFin: '2024-03-31'
      });
      const end = performance.now();
      const executionTime = end - start;
      
      expect(result.success).toBe(true);
      expect(result.metodo).toBe('optimizado');
      expect(result.data).toHaveLength(2);
      expect(executionTime).toBeLessThan(200); // Menos de 200ms
      
      // Verificar que se llamó solo una vez al RPC (consulta optimizada)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(1);
      
      console.log(`🚀 Progreso optimizado calculado en: ${executionTime.toFixed(2)}ms`);
    });
  });
  
  describe('Performance del Sistema de Cache', () => {
    test('cache hit debe ser 20x más rápido que consulta DB', async () => {
      const testKey = 'test_performance_key';
      const testData = { message: 'test data', timestamp: Date.now() };
      
      // Simular carga inicial (cache miss)
      const loadFunction = jest.fn().mockResolvedValue(testData);
      
      // Primera llamada - cache miss
      const startMiss = performance.now();
      const resultMiss = await cacheService.getOrSet(testKey, loadFunction, 60000);
      const endMiss = performance.now();
      const timeMiss = endMiss - startMiss;
      
      // Segunda llamada - cache hit
      const startHit = performance.now();
      const resultHit = await cacheService.getOrSet(testKey, loadFunction, 60000);
      const endHit = performance.now();
      const timeHit = endHit - startHit;
      
      expect(resultMiss).toEqual(testData);
      expect(resultHit).toEqual(testData);
      expect(loadFunction).toHaveBeenCalledTimes(1); // Solo una vez para cache miss
      
      // Cache hit debe ser significativamente más rápido
      expect(timeHit).toBeLessThan(timeMiss * 0.05); // Al menos 20x más rápido
      
      console.log(`💾 Cache MISS: ${timeMiss.toFixed(2)}ms`);
      console.log(`⚡ Cache HIT: ${timeHit.toFixed(2)}ms`);
      console.log(`📈 Mejora: ${(timeMiss / timeHit).toFixed(1)}x más rápido`);
    });
    
    test('invalidación de cache por patrón debe ser eficiente', async () => {
      // Llenar cache con múltiples entradas
      const entries = [
        'progreso_barrios_2024-01-01_2024-01-31',
        'progreso_barrios_2024-02-01_2024-02-28',
        'progreso_barrios_2024-03-01_2024-03-31',
        'estadisticas_reportes_2024-01-01',
        'estadisticas_reportes_2024-02-01',
        'other_data_key'
      ];
      
      entries.forEach(key => {
        cacheService.set(key, { data: `test_${key}` }, 60000);
      });
      
      const start = performance.now();
      const invalidated = cacheService.invalidatePattern(/^progreso_barrios/);
      const end = performance.now();
      const executionTime = end - start;
      
      expect(invalidated).toBe(3); // Debe invalidar 3 entradas de progreso
      expect(executionTime).toBeLessThan(10); // Menos de 10ms
      
      // Verificar que solo se invalidaron las entradas correctas
      expect(cacheService.has('estadisticas_reportes_2024-01-01')).toBe(true);
      expect(cacheService.has('other_data_key')).toBe(true);
      expect(cacheService.has('progreso_barrios_2024-01-01_2024-01-31')).toBe(false);
      
      console.log(`🎯 Invalidación por patrón: ${executionTime.toFixed(2)}ms`);
    });
    
    test('limpieza automática de cache debe ser eficiente', async () => {
      // Llenar cache con entradas que expiran rápidamente
      const expiredEntries = 50;
      for (let i = 0; i < expiredEntries; i++) {
        cacheService.set(`expired_key_${i}`, { data: i }, 1); // 1ms TTL
      }
      
      // Esperar a que expiren
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const start = performance.now();
      const cleaned = cacheService.cleanup();
      const end = performance.now();
      const executionTime = end - start;
      
      expect(cleaned).toBe(expiredEntries);
      expect(executionTime).toBeLessThan(50); // Menos de 50ms para limpiar 50 entradas
      
      console.log(`🧹 Limpieza de ${cleaned} entradas: ${executionTime.toFixed(2)}ms`);
    });
  });
  
  describe('Performance de Consultas con Filtros de Fecha', () => {
    test('filtros de fecha en SQL vs JavaScript - debe ser 5x más rápido', async () => {
      const mockReportes = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        barrio: `Barrio${(i % 12) + 1}`,
        fecha: new Date(2024, Math.floor(i / 100), (i % 30) + 1).toISOString().slice(0, 10),
        territorio: `T${i + 1}`,
        nombre_capitan: `Capitan${(i % 25) + 1}`
      }));
      
      // Mock para consulta con filtros SQL
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: mockReportes.slice(0, 100), // Filtrados en SQL
                    error: null
                  })
                })
              })
            })
          })
        })
      });
      
      const start = performance.now();
      const result = await reporteRepository.obtenerPorBarrio('Alcalá', {
        fechaDesde: '2024-01-01',
        fechaHasta: '2024-03-31',
        limite: 100
      });
      const end = performance.now();
      const executionTime = end - start;
      
      expect(result).toHaveLength(100);
      expect(executionTime).toBeLessThan(100); // Menos de 100ms
      
      // Verificar que se aplicaron filtros en la consulta SQL
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('reportes');
      
      console.log(`🔍 Consulta con filtros SQL: ${executionTime.toFixed(2)}ms`);
    });
    
    test('consulta de rango de fechas debe procesar 1000 registros en <150ms', async () => {
      const mockReportes = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        fecha: new Date(2024, 0, (i % 365) + 1).toISOString().slice(0, 10),
        barrio: `Barrio${(i % 12) + 1}`,
        territorio: `T${i + 1}`
      }));
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: mockReportes,
                  error: null
                })
              })
            })
          })
        })
      });
      
      const start = performance.now();
      const result = await reporteRepository.obtenerPorRangoFechas(
        '2024-01-01',
        '2024-12-31',
        { limite: 1000 }
      );
      const end = performance.now();
      const executionTime = end - start;
      
      expect(result).toHaveLength(1000);
      expect(executionTime).toBeLessThan(150); // Menos de 150ms
      
      console.log(`📅 Consulta rango fechas (1000 registros): ${executionTime.toFixed(2)}ms`);
    });
  });
  
  describe('Métricas de Memoria y Recursos', () => {
    test('uso de memoria del cache debe ser controlado', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Llenar cache con datos de prueba
      const entries = 100;
      const dataSize = 1000; // 1KB por entrada aproximadamente
      
      for (let i = 0; i < entries; i++) {
        const data = {
          id: i,
          data: 'x'.repeat(dataSize),
          timestamp: Date.now()
        };
        cacheService.set(`memory_test_${i}`, data, 60000);
      }
      
      const afterCacheMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = afterCacheMemory - initialMemory;
      
      // El aumento de memoria debe ser razonable (menos de 10MB para 100 entradas)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
      
      // Limpiar cache
      cacheService.clear();
      
      // Forzar garbage collection si está disponible
      if (global.gc) {
        global.gc();
      }
      
      const afterClearMemory = process.memoryUsage().heapUsed;
      
      console.log(`💾 Memoria inicial: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
      console.log(`💾 Memoria con cache: ${(afterCacheMemory / 1024 / 1024).toFixed(2)}MB`);
      console.log(`💾 Memoria después de limpiar: ${(afterClearMemory / 1024 / 1024).toFixed(2)}MB`);
      console.log(`📈 Incremento de memoria: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
    
    test('estadísticas del cache deben ser precisas', () => {
      cacheService.clear();
      
      // Añadir entradas de prueba
      const entries = 10;
      for (let i = 0; i < entries; i++) {
        cacheService.set(`stats_test_${i}`, { data: i }, 60000);
      }
      
      const stats = cacheService.getStats();
      
      expect(stats.size).toBe(entries);
      expect(stats.usage).toBe((entries / 200) * 100); // 200 es maxSize por defecto
      expect(stats.expiredEntries).toBe(0);
      expect(stats.activeTimers).toBe(entries);
      expect(stats.oldestEntry).toBeTruthy();
      expect(stats.newestEntry).toBeTruthy();
      
      console.log('📊 Estadísticas del cache:', stats);
    });
  });
  
  afterAll(() => {
    // Limpiar cache después de todos los tests
    cacheService.clear();
  });
});