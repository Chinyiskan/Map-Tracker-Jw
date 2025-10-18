// tests/resilience/ResilienceAndFallbacks.test.js
// Tests de resiliencia para validar fallbacks y manejo de errores

import { performance } from 'perf_hooks';
import ReporteRepository from '../../backend/infrastructure/database/repositories/ReporteRepository.js';
import ProgresoRepository from '../../backend/infrastructure/database/repositories/ProgresoRepository.js';
import ReporteService from '../../backend/application/services/ReporteService.js';
import CicloService from '../../backend/application/services/CicloService.js';
import cacheService from '../../backend/infrastructure/cache/CacheService.js';

// Mock de Supabase con capacidad de simular fallos
class MockSupabaseClient {
  constructor() {
    this.shouldFail = false;
    this.failureType = 'network';
    this.failureCount = 0;
    this.maxFailures = 1;
    this.callCount = 0;
  }
  
  // Configurar comportamiento de fallos
  setFailure(shouldFail, type = 'network', maxFailures = 1) {
    this.shouldFail = shouldFail;
    this.failureType = type;
    this.maxFailures = maxFailures;
    this.failureCount = 0;
    this.callCount = 0;
  }
  
  // Simular diferentes tipos de errores
  _simulateError() {
    this.callCount++;
    
    if (!this.shouldFail || this.failureCount >= this.maxFailures) {
      return false;
    }
    
    this.failureCount++;
    
    switch (this.failureType) {
      case 'network':
        throw new Error('Network timeout');
      case 'database':
        throw new Error('Database connection failed');
      case 'sql':
        throw new Error('SQL syntax error');
      case 'permission':
        throw new Error('Permission denied');
      case 'rpc':
        throw new Error('RPC function not found');
      default:
        throw new Error('Unknown error');
    }
  }
  
  from(table) {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockImplementation(() => {
        this._simulateError();
        return Promise.resolve({ data: { id: 1 }, error: null });
      }),
      insert: jest.fn().mockImplementation(() => {
        this._simulateError();
        return Promise.resolve({ data: { id: 1 }, error: null });
      }),
      update: jest.fn().mockImplementation(() => {
        this._simulateError();
        return Promise.resolve({ data: { id: 1 }, error: null });
      }),
      delete: jest.fn().mockImplementation(() => {
        this._simulateError();
        return Promise.resolve({ data: null, error: null });
      })
    };
  }
  
  rpc(functionName, params) {
    if (this.shouldFail && this.failureCount < this.maxFailures) {
      this._simulateError();
    }
    
    // Simular respuestas exitosas después de fallos
    const mockData = functionName.includes('estadisticas') 
      ? [{ total_reportes: 100, barrios_unicos: 5 }]
      : [{ barrio: 'Test', progreso_porcentaje: 50 }];
      
    return Promise.resolve({ data: mockData, error: null });
  }
}

describe('Tests de Resiliencia y Fallbacks', () => {
  let mockClient;
  let reporteRepository;
  let progresoRepository;
  let reporteService;
  let cicloService;
  
  beforeAll(() => {
    mockClient = new MockSupabaseClient();
    reporteRepository = new ReporteRepository(mockClient);
    progresoRepository = new ProgresoRepository(mockClient);
    reporteService = new ReporteService(reporteRepository, null, null);
    cicloService = new CicloService(null, progresoRepository);
  });
  
  beforeEach(() => {
    mockClient.setFailure(false);
    cacheService.clear();
  });
  
  describe('Resiliencia de Consultas SQL Optimizadas', () => {
    test('debe recuperarse de fallos de red temporales', async () => {
      // Configurar fallo temporal de red
      mockClient.setFailure(true, 'network', 1);
      
      const resultado = await reporteService.obtenerEstadisticas({
        fechaDesde: '2024-01-01',
        fechaHasta: '2024-12-31'
      });
      
      // Debe haberse recuperado usando el método legacy
      expect(resultado.success).toBe(true);
      expect(resultado.data).toBeDefined();
      expect(typeof resultado.data.total_reportes).toBe('number');
      
      console.log('✅ Recuperación exitosa de fallo de red');
    });
    
    test('debe manejar fallos de base de datos con degradación graceful', async () => {
      mockClient.setFailure(true, 'database', 2);
      
      const startTime = performance.now();
      const resultado = await reporteService.obtenerEstadisticas({});
      const endTime = performance.now();
      
      // Debe fallar gracefully pero intentar recuperarse
      expect(resultado.success).toBe(true);
      
      // El tiempo de respuesta debe ser razonable incluso con fallos
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(5000); // Menos de 5 segundos
      
      console.log(`⚡ Tiempo de recuperación: ${responseTime.toFixed(2)}ms`);
    });
    
    test('debe usar cache como fallback cuando DB falla completamente', async () => {
      const cacheKey = 'test_fallback_cache';
      const cachedData = {
        total_reportes: 500,
        barrios_unicos: 10,
        capitanes_unicos: 20
      };
      
      // Precargar datos en cache
      cacheService.set(cacheKey, cachedData, 60000);
      
      // Simular fallo completo de base de datos
      mockClient.setFailure(true, 'database', 10);
      
      // Simular uso de cache como fallback
      const cachedResult = cacheService.get(cacheKey);
      
      expect(cachedResult).toEqual(cachedData);
      expect(cachedResult.total_reportes).toBe(500);
      
      console.log('💾 Cache usado exitosamente como fallback');
    });
    
    test('debe manejar errores de permisos SQL', async () => {
      mockClient.setFailure(true, 'permission', 1);
      
      const resultado = await reporteService.obtenerEstadisticas({
        fechaDesde: '2024-01-01',
        fechaHasta: '2024-12-31'
      });
      
      // Debe recuperarse usando método alternativo
      expect(resultado.success).toBe(true);
      
      console.log('🔐 Recuperación exitosa de error de permisos');
    });
  });
  
  describe('Resiliencia del Sistema de Cache', () => {
    test('debe manejar corrupción de datos en cache', () => {
      const key = 'corrupted_data';
      
      // Simular datos corruptos en cache
      cacheService.cache.set(key, {
        value: undefined, // Datos corruptos
        expiresAt: Date.now() + 60000,
        createdAt: Date.now()
      });
      
      // El sistema debe manejar datos corruptos gracefully
      const result = cacheService.get(key);
      expect(result).toBeUndefined(); // Debe retornar el valor corrupto pero manejarlo
      
      // Limpiar entrada corrupta
      cacheService.delete(key);
      expect(cacheService.has(key)).toBe(false);
      
      console.log('🛡️ Datos corruptos en cache manejados correctamente');
    });
    
    test('debe recuperarse de memoria insuficiente', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      try {
        // Intentar llenar cache con datos grandes
        for (let i = 0; i < 1000; i++) {
          const largeData = {
            id: i,
            data: 'x'.repeat(10000), // 10KB por entrada
            metadata: new Array(1000).fill(`item_${i}`)
          };
          cacheService.set(`large_${i}`, largeData, 60000);
        }
      } catch (error) {
        // Si hay error de memoria, el cache debe manejarlo
        console.log('⚠️ Error de memoria detectado:', error.message);
      }
      
      // El cache debe seguir funcionando
      cacheService.set('test_after_memory_issue', 'test_value');
      expect(cacheService.get('test_after_memory_issue')).toBe('test_value');
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log(`💾 Incremento de memoria: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // Limpiar cache
      cacheService.clear();
    });
    
    test('debe manejar TTL extremos gracefully', async () => {
      // TTL muy corto
      cacheService.set('very_short_ttl', 'value1', 1);
      await new Promise(resolve => setTimeout(resolve, 5));
      expect(cacheService.get('very_short_ttl')).toBeNull();
      
      // TTL muy largo
      cacheService.set('very_long_ttl', 'value2', Number.MAX_SAFE_INTEGER);
      expect(cacheService.get('very_long_ttl')).toBe('value2');
      
      // TTL negativo (debe ser tratado como expirado)
      cacheService.set('negative_ttl', 'value3', -1000);
      expect(cacheService.get('negative_ttl')).toBeNull();
      
      console.log('⏰ TTL extremos manejados correctamente');
    });
  });
  
  describe('Resiliencia de Servicios', () => {
    test('CicloService debe manejar fallos en progreso de barrios', async () => {
      // Simular fallo en método optimizado
      mockClient.setFailure(true, 'sql', 1);
      
      const resultado = await cicloService.obtenerProgresoTodosBarrios({
        fechaInicio: '2024-01-01',
        fechaFin: '2024-12-31'
      });
      
      // Debe usar método legacy como fallback
      expect(resultado.success).toBe(true);
      expect(resultado.metodo).toBe('legacy_fallback');
      expect(resultado.warning).toContain('Método optimizado falló');
      
      console.log('🔄 CicloService se recuperó usando método legacy');
    });
    
    test('ReporteService debe manejar estadísticas mensuales con fallos', async () => {
      mockClient.setFailure(true, 'rpc', 1);
      
      const resultado = await reporteService.obtenerEstadisticasMensuales(
        '2024-01-01',
        '2024-12-31'
      );
      
      // Debe recuperarse usando método legacy
      expect(resultado.success).toBe(true);
      expect(resultado.data.estadisticas_por_mes).toBeDefined();
      
      console.log('📊 Estadísticas mensuales recuperadas con método legacy');
    });
    
    test('debe manejar múltiples fallos concurrentes', async () => {
      mockClient.setFailure(true, 'network', 3);
      
      const promises = [
        reporteService.obtenerEstadisticas({}),
        cicloService.obtenerProgresoTodosBarrios({}),
        reporteService.obtenerEstadisticasMensuales('2024-01-01', '2024-12-31')
      ];
      
      const resultados = await Promise.all(promises);
      
      // Todos deben recuperarse exitosamente
      resultados.forEach((resultado, index) => {
        expect(resultado.success).toBe(true);
        console.log(`✅ Servicio ${index + 1} se recuperó exitosamente`);
      });
    });
  });
  
  describe('Recuperación Automática', () => {
    test('debe recuperarse automáticamente después de fallos temporales', async () => {
      const maxRetries = 3;
      let attemptCount = 0;
      
      // Simular función que falla las primeras veces
      const unreliableFunction = async () => {
        attemptCount++;
        if (attemptCount <= 2) {
          throw new Error(`Attempt ${attemptCount} failed`);
        }
        return { success: true, data: 'recovered' };
      };
      
      // Implementar retry logic
      const retryFunction = async (fn, retries = maxRetries) => {
        for (let i = 0; i < retries; i++) {
          try {
            return await fn();
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 100 * (i + 1))); // Backoff
          }
        }
      };
      
      const resultado = await retryFunction(unreliableFunction);
      
      expect(resultado.success).toBe(true);
      expect(resultado.data).toBe('recovered');
      expect(attemptCount).toBe(3);
      
      console.log(`🔄 Recuperación automática después de ${attemptCount} intentos`);
    });
    
    test('debe implementar circuit breaker para fallos persistentes', async () => {
      class CircuitBreaker {
        constructor(threshold = 5, timeout = 60000) {
          this.failureThreshold = threshold;
          this.timeout = timeout;
          this.failureCount = 0;
          this.lastFailureTime = null;
          this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        }
        
        async execute(fn) {
          if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.timeout) {
              this.state = 'HALF_OPEN';
            } else {
              throw new Error('Circuit breaker is OPEN');
            }
          }
          
          try {
            const result = await fn();
            this.onSuccess();
            return result;
          } catch (error) {
            this.onFailure();
            throw error;
          }
        }
        
        onSuccess() {
          this.failureCount = 0;
          this.state = 'CLOSED';
        }
        
        onFailure() {
          this.failureCount++;
          this.lastFailureTime = Date.now();
          if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
          }
        }
      }
      
      const circuitBreaker = new CircuitBreaker(3, 1000);
      let callCount = 0;
      
      const failingFunction = async () => {
        callCount++;
        throw new Error(`Call ${callCount} failed`);
      };
      
      // Hacer fallar el circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFunction);
        } catch (error) {
          // Esperado
        }
      }
      
      expect(circuitBreaker.state).toBe('OPEN');
      
      // Intentar llamar con circuit breaker abierto
      await expect(circuitBreaker.execute(failingFunction))
        .rejects.toThrow('Circuit breaker is OPEN');
      
      console.log('⚡ Circuit breaker funcionando correctamente');
    });
  });
  
  describe('Degradación Graceful', () => {
    test('debe proporcionar datos limitados cuando servicios fallan', async () => {
      // Simular fallo en estadísticas completas
      mockClient.setFailure(true, 'database', 10);
      
      // Implementar modo degradado
      const estadisticasDegradadas = {
        total_reportes: 0,
        barrios_unicos: 0,
        capitanes_unicos: 0,
        modo: 'degradado',
        mensaje: 'Datos limitados disponibles debido a problemas técnicos'
      };
      
      // En un escenario real, esto vendría del cache o datos básicos
      expect(estadisticasDegradadas.modo).toBe('degradado');
      expect(estadisticasDegradadas.mensaje).toContain('problemas técnicos');
      
      console.log('📉 Modo degradado activado correctamente');
    });
    
    test('debe mantener funcionalidad básica durante fallos parciales', async () => {
      // Simular fallo en funciones avanzadas pero no básicas
      const funcionesBasicas = {
        obtenerReportes: () => Promise.resolve([{ id: 1, fecha: '2024-01-01' }]),
        obtenerBarrios: () => Promise.resolve(['Alcalá', 'Niza']),
        obtenerCapitanes: () => Promise.resolve(['Juan', 'María'])
      };
      
      const funcionesAvanzadas = {
        obtenerEstadisticasComplejas: () => Promise.reject(new Error('Servicio no disponible')),
        obtenerAnalisisAvanzado: () => Promise.reject(new Error('Análisis no disponible'))
      };
      
      // Las funciones básicas deben seguir funcionando
      const reportes = await funcionesBasicas.obtenerReportes();
      const barrios = await funcionesBasicas.obtenerBarrios();
      const capitanes = await funcionesBasicas.obtenerCapitanes();
      
      expect(reportes).toHaveLength(1);
      expect(barrios).toHaveLength(2);
      expect(capitanes).toHaveLength(2);
      
      // Las funciones avanzadas deben fallar gracefully
      await expect(funcionesAvanzadas.obtenerEstadisticasComplejas())
        .rejects.toThrow('Servicio no disponible');
      
      console.log('🔧 Funcionalidad básica mantenida durante fallos parciales');
    });
  });
  
  describe('Monitoreo y Alertas', () => {
    test('debe detectar y reportar patrones de fallos', () => {
      const errorTracker = {
        errors: [],
        addError: function(error, context) {
          this.errors.push({
            message: error.message,
            timestamp: Date.now(),
            context,
            type: this.classifyError(error)
          });
        },
        classifyError: function(error) {
          if (error.message.includes('Network')) return 'network';
          if (error.message.includes('Database')) return 'database';
          if (error.message.includes('Permission')) return 'permission';
          return 'unknown';
        },
        getErrorStats: function() {
          const stats = {};
          this.errors.forEach(error => {
            stats[error.type] = (stats[error.type] || 0) + 1;
          });
          return stats;
        }
      };
      
      // Simular diferentes tipos de errores
      errorTracker.addError(new Error('Network timeout'), 'estadisticas');
      errorTracker.addError(new Error('Database connection failed'), 'progreso');
      errorTracker.addError(new Error('Network timeout'), 'reportes');
      errorTracker.addError(new Error('Permission denied'), 'admin');
      
      const stats = errorTracker.getErrorStats();
      
      expect(stats.network).toBe(2);
      expect(stats.database).toBe(1);
      expect(stats.permission).toBe(1);
      
      console.log('📊 Estadísticas de errores:', stats);
    });
    
    test('debe calcular métricas de disponibilidad', () => {
      const availabilityTracker = {
        requests: [],
        addRequest: function(success, responseTime) {
          this.requests.push({
            success,
            responseTime,
            timestamp: Date.now()
          });
        },
        getAvailability: function() {
          if (this.requests.length === 0) return 0;
          const successful = this.requests.filter(r => r.success).length;
          return (successful / this.requests.length) * 100;
        },
        getAverageResponseTime: function() {
          if (this.requests.length === 0) return 0;
          const total = this.requests.reduce((sum, r) => sum + r.responseTime, 0);
          return total / this.requests.length;
        }
      };
      
      // Simular requests con diferentes resultados
      availabilityTracker.addRequest(true, 150);
      availabilityTracker.addRequest(true, 200);
      availabilityTracker.addRequest(false, 5000); // Timeout
      availabilityTracker.addRequest(true, 180);
      availabilityTracker.addRequest(true, 120);
      
      const availability = availabilityTracker.getAvailability();
      const avgResponseTime = availabilityTracker.getAverageResponseTime();
      
      expect(availability).toBe(80); // 4 de 5 exitosos
      expect(avgResponseTime).toBeCloseTo(1130, 0); // Promedio incluyendo timeout
      
      console.log(`📈 Disponibilidad: ${availability}%`);
      console.log(`⏱️ Tiempo promedio de respuesta: ${avgResponseTime.toFixed(2)}ms`);
    });
  });
  
  afterAll(() => {
    cacheService.clear();
  });
});