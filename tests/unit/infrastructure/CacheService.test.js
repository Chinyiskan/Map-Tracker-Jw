// tests/unit/infrastructure/CacheService.test.js
// Tests unitarios para el sistema de cache LRU con TTL

import { CacheService } from '../../../backend/infrastructure/cache/CacheService.js';

describe('CacheService - Tests Unitarios', () => {
  let cacheService;
  
  beforeEach(() => {
    // Crear nueva instancia para cada test
    cacheService = new CacheService({
      maxSize: 5,
      defaultTTL: 1000 // 1 segundo para tests rápidos
    });
  });
  
  afterEach(() => {
    // Limpiar cache después de cada test
    cacheService.clear();
  });
  
  describe('Configuración e Inicialización', () => {
    test('debe inicializarse con configuración por defecto', () => {
      const defaultCache = new CacheService();
      
      expect(defaultCache.maxSize).toBe(100);
      expect(defaultCache.defaultTTL).toBe(300000); // 5 minutos
      expect(defaultCache.cache.size).toBe(0);
      expect(defaultCache.accessOrder.size).toBe(0);
      expect(defaultCache.timers.size).toBe(0);
      
      defaultCache.clear();
    });
    
    test('debe inicializarse con configuración personalizada', () => {
      const customCache = new CacheService({
        maxSize: 50,
        defaultTTL: 60000
      });
      
      expect(customCache.maxSize).toBe(50);
      expect(customCache.defaultTTL).toBe(60000);
      
      customCache.clear();
    });
  });
  
  describe('Operaciones Básicas de Cache', () => {
    test('set y get deben funcionar correctamente', () => {
      const key = 'test_key';
      const value = { data: 'test_value', number: 42 };
      
      cacheService.set(key, value);
      const retrieved = cacheService.get(key);
      
      expect(retrieved).toEqual(value);
      expect(cacheService.has(key)).toBe(true);
    });
    
    test('get debe retornar null para clave inexistente', () => {
      const result = cacheService.get('nonexistent_key');
      expect(result).toBeNull();
    });
    
    test('has debe retornar false para clave inexistente', () => {
      const exists = cacheService.has('nonexistent_key');
      expect(exists).toBe(false);
    });
    
    test('delete debe eliminar entrada correctamente', () => {
      const key = 'delete_test';
      const value = 'test_value';
      
      cacheService.set(key, value);
      expect(cacheService.has(key)).toBe(true);
      
      const deleted = cacheService.delete(key);
      expect(deleted).toBe(true);
      expect(cacheService.has(key)).toBe(false);
      expect(cacheService.get(key)).toBeNull();
    });
    
    test('delete debe retornar false para clave inexistente', () => {
      const deleted = cacheService.delete('nonexistent_key');
      expect(deleted).toBe(false);
    });
    
    test('clear debe limpiar todo el cache', () => {
      // Añadir múltiples entradas
      for (let i = 0; i < 3; i++) {
        cacheService.set(`key_${i}`, `value_${i}`);
      }
      
      expect(cacheService.cache.size).toBe(3);
      
      cacheService.clear();
      
      expect(cacheService.cache.size).toBe(0);
      expect(cacheService.accessOrder.size).toBe(0);
      expect(cacheService.timers.size).toBe(0);
    });
  });
  
  describe('Funcionalidad TTL (Time To Live)', () => {
    test('entrada debe expirar después del TTL', async () => {
      const key = 'ttl_test';
      const value = 'expires_soon';
      const shortTTL = 50; // 50ms
      
      cacheService.set(key, value, shortTTL);
      expect(cacheService.get(key)).toBe(value);
      
      // Esperar a que expire
      await new Promise(resolve => setTimeout(resolve, shortTTL + 10));
      
      expect(cacheService.get(key)).toBeNull();
      expect(cacheService.has(key)).toBe(false);
    });
    
    test('entrada debe usar TTL por defecto si no se especifica', async () => {
      const key = 'default_ttl_test';
      const value = 'uses_default_ttl';
      
      cacheService.set(key, value); // Sin TTL específico
      
      // Debe estar disponible inmediatamente
      expect(cacheService.get(key)).toBe(value);
      
      // Verificar que tiene un timer configurado
      expect(cacheService.timers.has(key)).toBe(true);
    });
    
    test('TTL personalizado debe sobrescribir el por defecto', async () => {
      const key = 'custom_ttl_test';
      const value = 'custom_ttl_value';
      const customTTL = 30; // 30ms
      
      cacheService.set(key, value, customTTL);
      expect(cacheService.get(key)).toBe(value);
      
      // Esperar menos que el TTL por defecto pero más que el custom
      await new Promise(resolve => setTimeout(resolve, customTTL + 10));
      
      expect(cacheService.get(key)).toBeNull();
    });
    
    test('actualizar entrada debe renovar TTL', async () => {
      const key = 'renew_ttl_test';
      const value1 = 'first_value';
      const value2 = 'second_value';
      const ttl = 100; // 100ms
      
      cacheService.set(key, value1, ttl);
      
      // Esperar la mitad del TTL
      await new Promise(resolve => setTimeout(resolve, ttl / 2));
      
      // Actualizar con nuevo valor y TTL
      cacheService.set(key, value2, ttl);
      
      // Esperar más de la mitad original pero menos del nuevo TTL
      await new Promise(resolve => setTimeout(resolve, ttl / 2 + 10));
      
      // Debe seguir disponible con el nuevo valor
      expect(cacheService.get(key)).toBe(value2);
    });
  });
  
  describe('Funcionalidad LRU (Least Recently Used)', () => {
    test('debe actualizar orden de acceso en get', () => {
      const keys = ['key1', 'key2', 'key3'];
      
      // Añadir entradas
      keys.forEach(key => {
        cacheService.set(key, `value_${key}`);
      });
      
      // Acceder a key1 para moverla al final
      cacheService.get('key1');
      
      // Verificar que key1 tiene el timestamp más reciente
      const key1Time = cacheService.accessOrder.get('key1');
      const key2Time = cacheService.accessOrder.get('key2');
      const key3Time = cacheService.accessOrder.get('key3');
      
      expect(key1Time).toBeGreaterThan(key2Time);
      expect(key1Time).toBeGreaterThan(key3Time);
    });
    
    test('debe evictar entrada menos usada cuando se alcanza maxSize', () => {
      // Llenar cache hasta el máximo (5 entradas)
      for (let i = 0; i < 5; i++) {
        cacheService.set(`key_${i}`, `value_${i}`);
      }
      
      expect(cacheService.cache.size).toBe(5);
      
      // Acceder a algunas entradas para cambiar el orden LRU
      cacheService.get('key_1');
      cacheService.get('key_3');
      
      // Añadir una entrada más (debe evictar la menos usada)
      cacheService.set('new_key', 'new_value');
      
      expect(cacheService.cache.size).toBe(5); // Tamaño se mantiene
      expect(cacheService.has('new_key')).toBe(true); // Nueva entrada existe
      
      // key_0 debería haber sido evictada (menos usada recientemente)
      expect(cacheService.has('key_0')).toBe(false);
      
      // Las entradas accedidas recientemente deben seguir
      expect(cacheService.has('key_1')).toBe(true);
      expect(cacheService.has('key_3')).toBe(true);
    });
    
    test('debe evictar múltiples entradas si es necesario', () => {
      // Llenar cache
      for (let i = 0; i < 5; i++) {
        cacheService.set(`key_${i}`, `value_${i}`);
      }
      
      // Añadir múltiples entradas nuevas
      for (let i = 5; i < 8; i++) {
        cacheService.set(`key_${i}`, `value_${i}`);
      }
      
      expect(cacheService.cache.size).toBe(5); // Tamaño máximo respetado
      
      // Las entradas más nuevas deben estar presentes
      expect(cacheService.has('key_7')).toBe(true);
      expect(cacheService.has('key_6')).toBe(true);
      expect(cacheService.has('key_5')).toBe(true);
    });
  });
  
  describe('Método getOrSet', () => {
    test('debe cargar valor si no existe en cache', async () => {
      const key = 'load_test';
      const expectedValue = { loaded: true, timestamp: Date.now() };
      const loadFunction = jest.fn().mockResolvedValue(expectedValue);
      
      const result = await cacheService.getOrSet(key, loadFunction);
      
      expect(result).toEqual(expectedValue);
      expect(loadFunction).toHaveBeenCalledTimes(1);
      expect(cacheService.has(key)).toBe(true);
    });
    
    test('debe retornar valor del cache si existe', async () => {
      const key = 'cached_test';
      const cachedValue = { cached: true };
      const loadFunction = jest.fn().mockResolvedValue({ loaded: true });
      
      // Precargar en cache
      cacheService.set(key, cachedValue);
      
      const result = await cacheService.getOrSet(key, loadFunction);
      
      expect(result).toEqual(cachedValue);
      expect(loadFunction).not.toHaveBeenCalled();
    });
    
    test('debe usar TTL personalizado en getOrSet', async () => {
      const key = 'ttl_load_test';
      const value = { data: 'test' };
      const loadFunction = jest.fn().mockResolvedValue(value);
      const customTTL = 50;
      
      await cacheService.getOrSet(key, loadFunction, customTTL);
      
      expect(cacheService.has(key)).toBe(true);
      
      // Esperar a que expire
      await new Promise(resolve => setTimeout(resolve, customTTL + 10));
      
      expect(cacheService.has(key)).toBe(false);
    });
    
    test('debe propagar errores de la función de carga', async () => {
      const key = 'error_test';
      const error = new Error('Load failed');
      const loadFunction = jest.fn().mockRejectedValue(error);
      
      await expect(cacheService.getOrSet(key, loadFunction))
        .rejects.toThrow('Load failed');
      
      expect(loadFunction).toHaveBeenCalledTimes(1);
      expect(cacheService.has(key)).toBe(false);
    });
  });
  
  describe('Invalidación por Patrón', () => {
    test('debe invalidar entradas que coincidan con string pattern', () => {
      const entries = [
        'user_123',
        'user_456',
        'product_789',
        'order_111',
        'user_999'
      ];
      
      entries.forEach(key => {
        cacheService.set(key, `value_${key}`);
      });
      
      const invalidated = cacheService.invalidatePattern('user_');
      
      expect(invalidated).toBe(3); // 3 entradas de usuario
      expect(cacheService.has('user_123')).toBe(false);
      expect(cacheService.has('user_456')).toBe(false);
      expect(cacheService.has('user_999')).toBe(false);
      expect(cacheService.has('product_789')).toBe(true);
      expect(cacheService.has('order_111')).toBe(true);
    });
    
    test('debe invalidar entradas que coincidan con RegExp pattern', () => {
      const entries = [
        'cache_data_2024_01',
        'cache_data_2024_02',
        'cache_stats_2024_01',
        'temp_data_2024_01',
        'cache_data_2023_12'
      ];
      
      entries.forEach(key => {
        cacheService.set(key, `value_${key}`);
      });
      
      const pattern = /^cache_data_2024/;
      const invalidated = cacheService.invalidatePattern(pattern);
      
      expect(invalidated).toBe(2); // 2 entradas de cache_data_2024
      expect(cacheService.has('cache_data_2024_01')).toBe(false);
      expect(cacheService.has('cache_data_2024_02')).toBe(false);
      expect(cacheService.has('cache_stats_2024_01')).toBe(true);
      expect(cacheService.has('temp_data_2024_01')).toBe(true);
      expect(cacheService.has('cache_data_2023_12')).toBe(true);
    });
    
    test('debe retornar 0 si no hay coincidencias', () => {
      cacheService.set('test_key', 'test_value');
      
      const invalidated = cacheService.invalidatePattern('nonexistent_');
      
      expect(invalidated).toBe(0);
      expect(cacheService.has('test_key')).toBe(true);
    });
  });
  
  describe('Limpieza y Mantenimiento', () => {
    test('cleanup debe eliminar entradas expiradas', async () => {
      const shortTTL = 30;
      const longTTL = 200;
      
      // Añadir entradas con diferentes TTL
      cacheService.set('expires_soon', 'value1', shortTTL);
      cacheService.set('expires_later', 'value2', longTTL);
      cacheService.set('no_expiry', 'value3'); // TTL por defecto
      
      expect(cacheService.cache.size).toBe(3);
      
      // Esperar a que expire la primera
      await new Promise(resolve => setTimeout(resolve, shortTTL + 10));
      
      const cleaned = cacheService.cleanup();
      
      expect(cleaned).toBe(1);
      expect(cacheService.has('expires_soon')).toBe(false);
      expect(cacheService.has('expires_later')).toBe(true);
      expect(cacheService.has('no_expiry')).toBe(true);
    });
    
    test('cleanup debe retornar 0 si no hay entradas expiradas', () => {
      cacheService.set('valid_entry', 'value');
      
      const cleaned = cacheService.cleanup();
      
      expect(cleaned).toBe(0);
      expect(cacheService.has('valid_entry')).toBe(true);
    });
  });
  
  describe('Estadísticas del Cache', () => {
    test('getStats debe retornar estadísticas correctas', () => {
      // Cache vacío
      let stats = cacheService.getStats();
      expect(stats.size).toBe(0);
      expect(stats.maxSize).toBe(5);
      expect(stats.usage).toBe(0);
      expect(stats.expiredEntries).toBe(0);
      expect(stats.activeTimers).toBe(0);
      expect(stats.oldestEntry).toBeNull();
      expect(stats.newestEntry).toBeNull();
      
      // Añadir entradas
      cacheService.set('entry1', 'value1');
      cacheService.set('entry2', 'value2');
      cacheService.set('entry3', 'value3');
      
      stats = cacheService.getStats();
      expect(stats.size).toBe(3);
      expect(stats.usage).toBe(60); // 3/5 * 100
      expect(stats.activeTimers).toBe(3);
      expect(stats.oldestEntry).toBeTruthy();
      expect(stats.newestEntry).toBeTruthy();
      expect(stats.oldestEntry.key).toBe('entry1');
      expect(stats.newestEntry.key).toBe('entry3');
    });
    
    test('getStats debe contar entradas expiradas correctamente', async () => {
      const shortTTL = 30;
      
      cacheService.set('expires1', 'value1', shortTTL);
      cacheService.set('expires2', 'value2', shortTTL);
      cacheService.set('valid', 'value3');
      
      // Esperar a que expiren algunas
      await new Promise(resolve => setTimeout(resolve, shortTTL + 10));
      
      const stats = cacheService.getStats();
      expect(stats.expiredEntries).toBe(2);
    });
  });
  
  describe('Casos Edge y Manejo de Errores', () => {
    test('debe manejar valores null y undefined', () => {
      cacheService.set('null_value', null);
      cacheService.set('undefined_value', undefined);
      
      expect(cacheService.get('null_value')).toBeNull();
      expect(cacheService.get('undefined_value')).toBeUndefined();
      expect(cacheService.has('null_value')).toBe(true);
      expect(cacheService.has('undefined_value')).toBe(true);
    });
    
    test('debe manejar objetos complejos', () => {
      const complexObject = {
        array: [1, 2, 3],
        nested: {
          deep: {
            value: 'test'
          }
        },
        date: new Date(),
        regex: /test/g
      };
      
      cacheService.set('complex', complexObject);
      const retrieved = cacheService.get('complex');
      
      expect(retrieved).toEqual(complexObject);
      expect(retrieved.array).toEqual([1, 2, 3]);
      expect(retrieved.nested.deep.value).toBe('test');
    });
    
    test('debe manejar claves vacías y especiales', () => {
      const specialKeys = ['', ' ', '\n', '\t', 'key with spaces', 'key-with-dashes', 'key_with_underscores'];
      
      specialKeys.forEach((key, index) => {
        cacheService.set(key, `value_${index}`);
        expect(cacheService.get(key)).toBe(`value_${index}`);
      });
    });
    
    test('debe limpiar timers correctamente al eliminar entradas', () => {
      const key = 'timer_test';
      
      cacheService.set(key, 'value');
      expect(cacheService.timers.has(key)).toBe(true);
      
      cacheService.delete(key);
      expect(cacheService.timers.has(key)).toBe(false);
    });
    
    test('debe manejar TTL de 0 correctamente', async () => {
      const key = 'zero_ttl';
      
      cacheService.set(key, 'value', 0);
      
      // Con TTL 0, debe expirar inmediatamente
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(cacheService.get(key)).toBeNull();
    });
  });
});