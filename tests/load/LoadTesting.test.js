// tests/load/LoadTesting.test.js
// Tests de carga para validar escalabilidad del sistema

import { performance } from 'perf_hooks';
import { Worker } from 'worker_threads';
import ReporteRepository from '../../backend/infrastructure/database/repositories/ReporteRepository.js';
import ProgresoRepository from '../../backend/infrastructure/database/repositories/ProgresoRepository.js';
import ReporteService from '../../backend/application/services/ReporteService.js';
import CicloService from '../../backend/application/services/CicloService.js';
import cacheService from '../../backend/infrastructure/cache/CacheService.js';

// Mock de Supabase optimizado para tests de carga
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

// Utilidades para tests de carga
class LoadTestUtils {
  static async measureConcurrentRequests(requestFunction, concurrency, iterations) {
    const results = {
      totalRequests: concurrency * iterations,
      successfulRequests: 0,
      failedRequests: 0,
      totalTime: 0,
      averageTime: 0,
      minTime: Infinity,
      maxTime: 0,
      requestsPerSecond: 0,
      errors: []
    };
    
    const startTime = performance.now();
    const promises = [];
    
    for (let i = 0; i < concurrency; i++) {
      for (let j = 0; j < iterations; j++) {
        promises.push(
          this.executeWithTiming(requestFunction)
            .then(result => {
              results.successfulRequests++;
              results.minTime = Math.min(results.minTime, result.time);
              results.maxTime = Math.max(results.maxTime, result.time);
              return result;
            })
            .catch(error => {
              results.failedRequests++;
              results.errors.push(error.message);
              return { error: error.message, time: 0 };
            })
        );
      }
    }
    
    const responses = await Promise.all(promises);
    const endTime = performance.now();
    
    results.totalTime = endTime - startTime;
    results.averageTime = responses
      .filter(r => !r.error)
      .reduce((sum, r) => sum + r.time, 0) / results.successfulRequests;
    results.requestsPerSecond = (results.totalRequests / (results.totalTime / 1000));
    
    return results;
  }
  
  static async executeWithTiming(requestFunction) {
    const start = performance.now();
    const result = await requestFunction();
    const end = performance.now();
    return { result, time: end - start };
  }
  
  static generateMockData(count, type = 'reportes') {
    switch (type) {
      case 'reportes':
        return Array.from({ length: count }, (_, i) => ({
          id: i + 1,
          barrio: `Barrio${(i % 12) + 1}`,
          fecha: new Date(2024, Math.floor(i / 100), (i % 30) + 1).toISOString().slice(0, 10),
          territorio: `T${i + 1}`,
          nombre_capitan: `Capitan${(i % 25) + 1}`,
          manzanas: [`M${i + 1}`, `M${i + 2}`]
        }));
      
      case 'progreso':
        return Array.from({ length: count }, (_, i) => ({
          barrio: `Barrio${(i % 12) + 1}`,
          numero_ciclo: Math.floor(i / 12) + 1,
          total_territorios: 50 + (i % 20),
          territorios_trabajados: Math.floor(Math.random() * 50),
          progreso_porcentaje: Math.floor(Math.random() * 100),
          estado: ['activo', 'completado', 'pausado'][i % 3]
        }));
      
      case 'estadisticas':
        return {
          total_reportes: count,
          barrios_unicos: Math.min(count / 10, 12),
          capitanes_unicos: Math.min(count / 5, 25),
          fecha_primer_reporte: '2024-01-01',
          fecha_ultimo_reporte: '2024-12-31',
          reportes_ultima_semana: Math.floor(count * 0.1),
          reportes_ultimo_mes: Math.floor(count * 0.3)
        };
      
      default:
        return [];
    }
  }
}

describe('Load Testing - Sistema de Reportes', () => {
  let reporteRepository;
  let progresoRepository;
  let reporteService;
  let cicloService;
  
  beforeAll(() => {
    // Configurar repositorios y servicios
    reporteRepository = new ReporteRepository(mockSupabaseClient);
    progresoRepository = new ProgresoRepository(mockSupabaseClient);
    reporteService = new ReporteService(reporteRepository, null, null);
    cicloService = new CicloService(null, progresoRepository);
    
    // Configurar timeout más alto para tests de carga
    jest.setTimeout(60000); // 60 segundos
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    cacheService.clear();
  });
  
  describe('Tests de Carga Básicos', () => {
    test('debe manejar 100 consultas concurrentes de estadísticas', async () => {
      const mockEstadisticas = LoadTestUtils.generateMockData(1000, 'estadisticas');
      
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [mockEstadisticas],
        error: null
      });
      
      const requestFunction = () => reporteService.obtenerEstadisticas({
        fechaDesde: '2024-01-01',
        fechaHasta: '2024-12-31'
      });
      
      const results = await LoadTestUtils.measureConcurrentRequests(
        requestFunction,
        10, // 10 usuarios concurrentes
        10  // 10 requests por usuario
      );
      
      // Validaciones de rendimiento
      expect(results.successfulRequests).toBe(100);
      expect(results.failedRequests).toBe(0);
      expect(results.averageTime).toBeLessThan(100); // Menos de 100ms promedio
      expect(results.requestsPerSecond).toBeGreaterThan(50); // Al menos 50 RPS
      
      // La mayoría de requests deben usar cache (pocas llamadas a RPC)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(1);
      
      console.log('📊 Resultados de carga - Estadísticas:');
      console.log(`   Total requests: ${results.totalRequests}`);
      console.log(`   Exitosos: ${results.successfulRequests}`);
      console.log(`   Tiempo promedio: ${results.averageTime.toFixed(2)}ms`);
      console.log(`   RPS: ${results.requestsPerSecond.toFixed(1)}`);
      console.log(`   Tiempo total: ${results.totalTime.toFixed(2)}ms`);
    });
    
    test('debe manejar 50 consultas concurrentes de progreso por barrios', async () => {
      const mockProgreso = LoadTestUtils.generateMockData(12, 'progreso');
      
      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockProgreso,
        error: null
      });
      
      const requestFunction = () => cicloService.obtenerProgresoTodosBarrios({
        fechaInicio: '2024-01-01',
        fechaFin: '2024-12-31'
      });
      
      const results = await LoadTestUtils.measureConcurrentRequests(
        requestFunction,
        5,  // 5 usuarios concurrentes
        10  // 10 requests por usuario
      );
      
      // Validaciones
      expect(results.successfulRequests).toBe(50);
      expect(results.failedRequests).toBe(0);
      expect(results.averageTime).toBeLessThan(200); // Menos de 200ms promedio
      expect(results.requestsPerSecond).toBeGreaterThan(20); // Al menos 20 RPS
      
      console.log('📊 Resultados de carga - Progreso por Barrios:');
      console.log(`   Total requests: ${results.totalRequests}`);
      console.log(`   Exitosos: ${results.successfulRequests}`);
      console.log(`   Tiempo promedio: ${results.averageTime.toFixed(2)}ms`);
      console.log(`   RPS: ${results.requestsPerSecond.toFixed(1)}`);
    });
    
    test('debe manejar consultas mixtas con diferentes endpoints', async () => {
      // Configurar mocks para diferentes tipos de consultas
      const mockEstadisticas = LoadTestUtils.generateMockData(500, 'estadisticas');
      const mockProgreso = LoadTestUtils.generateMockData(8, 'progreso');
      const mockReportes = LoadTestUtils.generateMockData(100, 'reportes');
      
      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: [mockEstadisticas], error: null })
        .mockResolvedValue({ data: mockProgreso, error: null });
      
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
      
      // Definir diferentes tipos de requests
      const requestTypes = [
        () => reporteService.obtenerEstadisticas({ fechaDesde: '2024-01-01', fechaHasta: '2024-12-31' }),
        () => cicloService.obtenerProgresoTodosBarrios({ fechaInicio: '2024-01-01', fechaFin: '2024-12-31' }),
        () => reporteRepository.obtenerPorRangoFechas('2024-01-01', '2024-12-31', { limite: 100 })
      ];
      
      const promises = [];
      const startTime = performance.now();
      
      // Ejecutar 30 requests mixtos (10 de cada tipo)
      for (let i = 0; i < 30; i++) {
        const requestType = requestTypes[i % 3];
        promises.push(requestType());
      }
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Validar que todas las consultas fueron exitosas
      results.forEach((result, index) => {
        if (result.success !== undefined) {
          expect(result.success).toBe(true);
        } else {
          expect(result).toBeDefined();
          expect(Array.isArray(result)).toBe(true);
        }
      });
      
      const avgTimePerRequest = totalTime / 30;
      expect(avgTimePerRequest).toBeLessThan(150); // Menos de 150ms promedio
      
      console.log('📊 Resultados de carga - Consultas Mixtas:');
      console.log(`   Total requests: 30`);
      console.log(`   Tiempo total: ${totalTime.toFixed(2)}ms`);
      console.log(`   Tiempo promedio: ${avgTimePerRequest.toFixed(2)}ms`);
    });
  });
  
  describe('Tests de Estrés del Cache', () => {
    test('cache debe mantener rendimiento con 1000 entradas', async () => {
      const entries = 1000;
      const startTime = performance.now();
      
      // Llenar cache con muchas entradas
      for (let i = 0; i < entries; i++) {
        const data = {
          id: i,
          data: `test_data_${i}`,
          timestamp: Date.now(),
          metadata: {
            barrio: `Barrio${i % 12}`,
            tipo: 'test',
            size: Math.floor(Math.random() * 1000)
          }
        };
        cacheService.set(`stress_test_${i}`, data, 300000); // 5 minutos TTL
      }
      
      const fillTime = performance.now() - startTime;
      
      // Medir tiempo de acceso aleatorio
      const accessStartTime = performance.now();
      const accessPromises = [];
      
      for (let i = 0; i < 100; i++) {
        const randomKey = `stress_test_${Math.floor(Math.random() * entries)}`;
        accessPromises.push(
          Promise.resolve(cacheService.get(randomKey))
        );
      }
      
      const accessResults = await Promise.all(accessPromises);
      const accessTime = performance.now() - accessStartTime;
      
      // Validaciones
      const hitCount = accessResults.filter(result => result !== null).length;
      expect(hitCount).toBe(100); // Todos deben ser hits
      
      const avgFillTime = fillTime / entries;
      const avgAccessTime = accessTime / 100;
      
      expect(avgFillTime).toBeLessThan(1); // Menos de 1ms por entrada
      expect(avgAccessTime).toBeLessThan(0.5); // Menos de 0.5ms por acceso
      
      // Verificar estadísticas del cache
      const stats = cacheService.getStats();
      expect(stats.size).toBe(entries);
      expect(stats.usage).toBeGreaterThan(0);
      
      console.log('🗄️ Resultados de estrés del cache:');
      console.log(`   Entradas creadas: ${entries}`);
      console.log(`   Tiempo de llenado: ${fillTime.toFixed(2)}ms`);
      console.log(`   Tiempo promedio por entrada: ${avgFillTime.toFixed(3)}ms`);
      console.log(`   Tiempo de acceso (100 gets): ${accessTime.toFixed(2)}ms`);
      console.log(`   Tiempo promedio por acceso: ${avgAccessTime.toFixed(3)}ms`);
      console.log(`   Cache hits: ${hitCount}/100`);
    });
    
    test('invalidación masiva debe ser eficiente', async () => {
      const entries = 500;
      const patterns = ['progreso_', 'estadisticas_', 'reportes_', 'otros_'];
      
      // Llenar cache con entradas de diferentes patrones
      for (let i = 0; i < entries; i++) {
        const pattern = patterns[i % patterns.length];
        const key = `${pattern}${i}`;
        cacheService.set(key, { data: `test_${i}` }, 300000);
      }
      
      expect(cacheService.getStats().size).toBe(entries);
      
      // Medir tiempo de invalidación por patrón
      const invalidationResults = [];
      
      for (const pattern of patterns.slice(0, 3)) { // Invalidar 3 de 4 patrones
        const startTime = performance.now();
        const invalidated = cacheService.invalidatePattern(new RegExp(`^${pattern}`));
        const endTime = performance.now();
        
        invalidationResults.push({
          pattern,
          invalidated,
          time: endTime - startTime
        });
      }
      
      // Validaciones
      const totalInvalidated = invalidationResults.reduce((sum, r) => sum + r.invalidated, 0);
      const expectedInvalidated = Math.floor(entries * 3 / 4); // 3 de 4 patrones
      
      expect(totalInvalidated).toBeCloseTo(expectedInvalidated, -1); // Aproximadamente
      
      invalidationResults.forEach(result => {
        expect(result.time).toBeLessThan(20); // Menos de 20ms por invalidación
      });
      
      console.log('🗑️ Resultados de invalidación masiva:');
      invalidationResults.forEach(result => {
        console.log(`   Patrón ${result.pattern}: ${result.invalidated} entradas en ${result.time.toFixed(2)}ms`);
      });
    });
  });
  
  describe('Tests de Escalabilidad', () => {
    test('rendimiento debe degradarse linealmente con la carga', async () => {
      const mockData = LoadTestUtils.generateMockData(100, 'estadisticas');
      mockSupabaseClient.rpc.mockResolvedValue({ data: [mockData], error: null });
      
      const requestFunction = () => reporteService.obtenerEstadisticas({
        fechaDesde: '2024-01-01',
        fechaHasta: '2024-12-31'
      });
      
      const loadLevels = [10, 25, 50, 100]; // Diferentes niveles de carga
      const results = [];
      
      for (const load of loadLevels) {
        cacheService.clear(); // Limpiar cache entre tests
        jest.clearAllMocks();
        
        const result = await LoadTestUtils.measureConcurrentRequests(
          requestFunction,
          load / 5, // Usuarios concurrentes
          5         // Requests por usuario
        );
        
        results.push({
          load,
          ...result
        });
      }
      
      // Validar que el rendimiento se degrada linealmente
      for (let i = 1; i < results.length; i++) {
        const current = results[i];
        const previous = results[i - 1];
        
        // El tiempo promedio no debe aumentar más del 50% por cada nivel
        const degradation = (current.averageTime - previous.averageTime) / previous.averageTime;
        expect(degradation).toBeLessThan(0.5);
        
        // Todas las requests deben seguir siendo exitosas
        expect(current.successfulRequests).toBe(current.totalRequests);
      }
      
      console.log('📈 Resultados de escalabilidad:');
      results.forEach(result => {
        console.log(`   Carga ${result.load}: ${result.averageTime.toFixed(2)}ms promedio, ${result.requestsPerSecond.toFixed(1)} RPS`);
      });
    });
    
    test('memoria debe mantenerse estable bajo carga sostenida', async () => {
      const initialMemory = process.memoryUsage();
      const mockData = LoadTestUtils.generateMockData(50, 'progreso');
      
      mockSupabaseClient.rpc.mockResolvedValue({ data: mockData, error: null });
      
      const requestFunction = () => cicloService.obtenerProgresoTodosBarrios({
        fechaInicio: '2024-01-01',
        fechaFin: '2024-12-31'
      });
      
      // Ejecutar carga sostenida durante varios ciclos
      const cycles = 5;
      const requestsPerCycle = 20;
      const memorySnapshots = [initialMemory];
      
      for (let cycle = 0; cycle < cycles; cycle++) {
        // Ejecutar requests del ciclo
        const promises = Array.from({ length: requestsPerCycle }, () => requestFunction());
        await Promise.all(promises);
        
        // Tomar snapshot de memoria
        const currentMemory = process.memoryUsage();
        memorySnapshots.push(currentMemory);
        
        // Pequeña pausa entre ciclos
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Analizar uso de memoria
      const heapUsages = memorySnapshots.map(snapshot => snapshot.heapUsed);
      const maxHeap = Math.max(...heapUsages);
      const minHeap = Math.min(...heapUsages);
      const heapVariation = (maxHeap - minHeap) / minHeap;
      
      // La variación de memoria no debe ser excesiva (menos del 100%)
      expect(heapVariation).toBeLessThan(1.0);
      
      // La memoria final no debe ser más del doble de la inicial
      const finalHeap = heapUsages[heapUsages.length - 1];
      const initialHeap = heapUsages[0];
      const memoryIncrease = (finalHeap - initialHeap) / initialHeap;
      
      expect(memoryIncrease).toBeLessThan(1.0); // Menos del 100% de aumento
      
      console.log('💾 Análisis de memoria bajo carga sostenida:');
      console.log(`   Memoria inicial: ${(initialHeap / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Memoria final: ${(finalHeap / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Incremento: ${(memoryIncrease * 100).toFixed(1)}%`);
      console.log(`   Variación máxima: ${(heapVariation * 100).toFixed(1)}%`);
    });
  });
  
  describe('Tests de Recuperación y Resiliencia', () => {
    test('sistema debe recuperarse rápidamente de fallos temporales', async () => {
      const mockData = LoadTestUtils.generateMockData(100, 'estadisticas');
      let callCount = 0;
      
      // Simular fallos intermitentes
      mockSupabaseClient.rpc.mockImplementation(() => {
        callCount++;
        if (callCount % 3 === 0) {
          // Cada tercera llamada falla
          return Promise.reject(new Error('Temporary database error'));
        }
        return Promise.resolve({ data: [mockData], error: null });
      });
      
      // Configurar fallback
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
      
      const requestFunction = () => reporteService.obtenerEstadisticas({
        fechaDesde: '2024-01-01',
        fechaHasta: '2024-12-31'
      });
      
      const results = await LoadTestUtils.measureConcurrentRequests(
        requestFunction,
        5,  // 5 usuarios concurrentes
        6   // 6 requests por usuario (30 total)
      );
      
      // Debe haber algunos fallos pero la mayoría exitosos debido al fallback
      expect(results.successfulRequests).toBeGreaterThan(20); // Al menos 20 de 30
      expect(results.failedRequests).toBeLessThan(10); // Menos de 10 fallos
      
      console.log('🔄 Resultados de recuperación de fallos:');
      console.log(`   Requests exitosos: ${results.successfulRequests}/${results.totalRequests}`);
      console.log(`   Requests fallidos: ${results.failedRequests}`);
      console.log(`   Tasa de éxito: ${(results.successfulRequests / results.totalRequests * 100).toFixed(1)}%`);
    });
  });
  
  afterAll(() => {
    cacheService.clear();
  });
});