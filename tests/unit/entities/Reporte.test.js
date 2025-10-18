// tests/unit/entities/Reporte.test.js
// Tests unitarios para la entidad Reporte

import Reporte from '../../../backend/domain/entities/Reporte.js';

describe('Reporte Entity', () => {
  describe('Constructor y Validaciones', () => {
    test('debe crear reporte válido con datos correctos', () => {
      const datosReporte = {
        nombre_capitan: 'Juan Pérez',
        fecha: '2025-01-15',
        barrio: 'Zulima',
        manzanas: 'Z-174,Z-175,Z-176'
      };
      
      const reporte = new Reporte(datosReporte);
      
      expect(reporte.nombre_capitan).toBe('Juan Pérez');
      expect(reporte.fecha).toBe('2025-01-15');
      expect(reporte.barrio).toBe('Zulima');
      expect(reporte.manzanas).toEqual(['Z-174', 'Z-175', 'Z-176']);
      expect(reporte.observaciones).toBeNull();
      expect(reporte.salida_id).toBeNull();
    });
    
    test('debe crear reporte con observaciones y salida_id', () => {
      const datosReporte = {
        nombre_capitan: 'María García',
        fecha: '2025-01-15',
        barrio: 'Acacios',
        manzanas: ['A-133', 'A-134'],
        observaciones: 'Territorio difícil',
        salida_id: '123e4567-e89b-12d3-a456-426614174000'
      };
      
      const reporte = new Reporte(datosReporte);
      
      expect(reporte.observaciones).toBe('Territorio difícil');
      expect(reporte.salida_id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });
    
    test('debe fallar con campos requeridos faltantes', () => {
      expect(() => {
        new Reporte({ nombre_capitan: 'Juan' });
      }).toThrow('El campo \'fecha\' es requerido');
      
      expect(() => {
        new Reporte({ 
          nombre_capitan: 'Juan',
          fecha: '2025-01-15'
        });
      }).toThrow('El campo \'barrio\' es requerido');
      
      expect(() => {
        new Reporte({ 
          nombre_capitan: 'Juan',
          fecha: '2025-01-15',
          barrio: 'Zulima'
        });
      }).toThrow('El campo \'manzanas\' es requerido');
    });
    
    test('debe fallar con nombre_capitan inválido', () => {
      expect(() => {
        new Reporte({
          nombre_capitan: 'A', // Muy corto
          fecha: '2025-01-15',
          barrio: 'Zulima',
          manzanas: 'Z-174'
        });
      }).toThrow('El nombre del capitán debe ser un texto de al menos 2 caracteres');
    });
    
    test('debe fallar con fecha inválida', () => {
      expect(() => {
        new Reporte({
          nombre_capitan: 'Juan Pérez',
          fecha: '15-01-2025', // Formato incorrecto
          barrio: 'Zulima',
          manzanas: 'Z-174'
        });
      }).toThrow('La fecha debe tener el formato YYYY-MM-DD');
    });
    
    test('debe fallar con barrio inválido', () => {
      expect(() => {
        new Reporte({
          nombre_capitan: 'Juan Pérez',
          fecha: '2025-01-15',
          barrio: 'A', // Muy corto
          manzanas: 'Z-174'
        });
      }).toThrow('El barrio debe ser un texto de al menos 2 caracteres');
    });
  });
  
  describe('Normalización de Manzanas', () => {
    test('debe normalizar manzanas desde string', () => {
      const reporte = new Reporte({
        nombre_capitan: 'Juan Pérez',
        fecha: '2025-01-15',
        barrio: 'Zulima',
        manzanas: 'Z-174, Z-175 , Z-176'
      });
      
      expect(reporte.manzanas).toEqual(['Z-174', 'Z-175', 'Z-176']);
    });
    
    test('debe normalizar manzanas desde array', () => {
      const reporte = new Reporte({
        nombre_capitan: 'Juan Pérez',
        fecha: '2025-01-15',
        barrio: 'Zulima',
        manzanas: [' Z-174 ', 'Z-175', ' Z-176 ']
      });
      
      expect(reporte.manzanas).toEqual(['Z-174', 'Z-175', 'Z-176']);
    });
    
    test('debe filtrar manzanas vacías', () => {
      const reporte = new Reporte({
        nombre_capitan: 'Juan Pérez',
        fecha: '2025-01-15',
        barrio: 'Zulima',
        manzanas: 'Z-174,,Z-175, ,Z-176'
      });
      
      expect(reporte.manzanas).toEqual(['Z-174', 'Z-175', 'Z-176']);
    });
    
    test('debe fallar con manzanas inválidas', () => {
      expect(() => {
        new Reporte({
          nombre_capitan: 'Juan Pérez',
          fecha: '2025-01-15',
          barrio: 'Zulima',
          manzanas: 123 // Tipo inválido
        });
      }).toThrow('Las manzanas deben ser un string separado por comas o un array');
    });
  });
  
  describe('Métodos de Utilidad', () => {
    let reporte;
    
    beforeEach(() => {
      reporte = new Reporte({
        nombre_capitan: 'Juan Pérez',
        fecha: '2025-01-15',
        barrio: 'Zulima',
        manzanas: ['Z-174', 'Z-175', 'Z-176']
      });
    });
    
    test('getManzanasAsString debe retornar string separado por comas', () => {
      expect(reporte.getManzanasAsString()).toBe('Z-174,Z-175,Z-176');
    });
    
    test('isValidDate debe validar fechas correctamente', () => {
      // Fecha de hoy debe ser válida
      const reporteHoy = new Reporte({
        nombre_capitan: 'Juan Pérez',
        fecha: new Date().toISOString().split('T')[0],
        barrio: 'Zulima',
        manzanas: 'Z-174'
      });
      expect(reporteHoy.isValidDate()).toBe(true);
      
      // Fecha pasada debe ser válida
      const reportePasado = new Reporte({
        nombre_capitan: 'Juan Pérez',
        fecha: '2024-12-01',
        barrio: 'Zulima',
        manzanas: 'Z-174'
      });
      expect(reportePasado.isValidDate()).toBe(true);
      
      // Fecha futura debe ser inválida
      const fechaFutura = new Date();
      fechaFutura.setDate(fechaFutura.getDate() + 2);
      const reporteFuturo = new Reporte({
        nombre_capitan: 'Juan Pérez',
        fecha: fechaFutura.toISOString().split('T')[0],
        barrio: 'Zulima',
        manzanas: 'Z-174'
      });
      expect(reporteFuturo.isValidDate()).toBe(false);
    });
    
    test('toDatabase debe retornar datos para persistencia', () => {
      const dbData = reporte.toDatabase();
      
      expect(dbData).toEqual({
        nombre_capitan: 'Juan Pérez',
        fecha: '2025-01-15',
        barrio: 'Zulima',
        manzanas: 'Z-174,Z-175,Z-176',
        observaciones: null,
        salida_id: null
      });
    });
  });
  
  describe('Métodos Estáticos', () => {
    test('fromDatabase debe crear instancia desde datos de BD', () => {
      const dbData = {
        nombre_capitan: 'María García',
        fecha: '2025-01-15',
        barrio: 'Acacios',
        manzanas: 'A-133,A-134,A-135',
        observaciones: 'Test observación',
        salida_id: '123e4567-e89b-12d3-a456-426614174000'
      };
      
      const reporte = Reporte.fromDatabase(dbData);
      
      expect(reporte.nombre_capitan).toBe('María García');
      expect(reporte.manzanas).toEqual(['A-133', 'A-134', 'A-135']);
      expect(reporte.observaciones).toBe('Test observación');
      expect(reporte.salida_id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });
  });
  
  describe('Casos Edge', () => {
    test('debe manejar espacios en blanco en campos de texto', () => {
      const reporte = new Reporte({
        nombre_capitan: '  Juan Pérez  ',
        fecha: '2025-01-15',
        barrio: '  Zulima  ',
        manzanas: 'Z-174',
        observaciones: '  Observación con espacios  '
      });
      
      expect(reporte.nombre_capitan).toBe('Juan Pérez');
      expect(reporte.barrio).toBe('Zulima');
      expect(reporte.observaciones).toBe('Observación con espacios');
    });
    
    test('debe manejar observaciones vacías como null', () => {
      const reporte = new Reporte({
        nombre_capitan: 'Juan Pérez',
        fecha: '2025-01-15',
        barrio: 'Zulima',
        manzanas: 'Z-174',
        observaciones: '   ' // Solo espacios
      });
      
      expect(reporte.observaciones).toBeNull();
    });
  });
});