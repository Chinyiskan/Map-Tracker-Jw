// tests/unit/entities/Ciclo.test.js
// Tests unitarios para la entidad Ciclo

import Ciclo from '../../../backend/domain/entities/Ciclo.js';

describe('Ciclo Entity', () => {
  describe('Constructor y Validaciones', () => {
    test('debe crear ciclo válido con datos mínimos', () => {
      const ciclo = new Ciclo({
        barrio: 'Zulima',
        total_territorios: 52
      });
      
      expect(ciclo.barrio).toBe('Zulima');
      expect(ciclo.total_territorios).toBe(52);
      expect(ciclo.numero_ciclo).toBe(1);
      expect(ciclo.territorios_completados).toBe(0);
      expect(ciclo.progreso_porcentaje).toBe(0.00);
      expect(ciclo.estado).toBe('activo');
      expect(ciclo.fecha_inicio).toBe(new Date().toISOString().split('T')[0]);
      expect(ciclo.fecha_fin).toBeNull();
    });
    
    test('debe crear ciclo con número específico', () => {
      const ciclo = new Ciclo({
        barrio: 'Acacios',
        total_territorios: 45,
        numero_ciclo: 3
      });
      
      expect(ciclo.numero_ciclo).toBe(3);
    });
    
    test('debe crear ciclo con fecha de inicio específica', () => {
      const ciclo = new Ciclo({
        barrio: 'Zulima',
        total_territorios: 52,
        fecha_inicio: '2025-01-01'
      });
      
      expect(ciclo.fecha_inicio).toBe('2025-01-01');
    });
    
    test('debe fallar con barrio faltante', () => {
      expect(() => {
        new Ciclo({ total_territorios: 52 });
      }).toThrow('El barrio es requerido');
    });
    
    test('debe fallar con total_territorios faltante', () => {
      expect(() => {
        new Ciclo({ barrio: 'Zulima' });
      }).toThrow('El total de territorios es requerido');
    });
    
    test('debe fallar con barrio inválido', () => {
      expect(() => {
        new Ciclo({
          barrio: 'A', // Muy corto
          total_territorios: 52
        });
      }).toThrow('El barrio debe ser un texto de al menos 2 caracteres');
    });
    
    test('debe fallar con total_territorios inválido', () => {
      expect(() => {
        new Ciclo({
          barrio: 'Zulima',
          total_territorios: 0 // Debe ser positivo
        });
      }).toThrow('El total de territorios debe ser un número entero positivo');
      
      expect(() => {
        new Ciclo({
          barrio: 'Zulima',
          total_territorios: 52.5 // Debe ser entero
        });
      }).toThrow('El total de territorios debe ser un número entero positivo');
    });
    
    test('debe fallar con numero_ciclo inválido', () => {
      expect(() => {
        new Ciclo({
          barrio: 'Zulima',
          total_territorios: 52,
          numero_ciclo: 0 // Debe ser positivo
        });
      }).toThrow('El número de ciclo debe ser un número entero positivo');
    });
  });
  
  describe('Cálculo de Progreso', () => {
    let ciclo;
    
    beforeEach(() => {
      ciclo = new Ciclo({
        barrio: 'Zulima',
        total_territorios: 50
      });
    });
    
    test('debe calcular progreso correctamente', () => {
      const progreso = ciclo.calcularProgreso(25);
      
      expect(progreso).toBe(50);
      expect(ciclo.territorios_completados).toBe(25);
      expect(ciclo.progreso_porcentaje).toBe(50);
    });
    
    test('debe calcular progreso 100%', () => {
      const progreso = ciclo.calcularProgreso(50);
      
      expect(progreso).toBe(100);
      expect(ciclo.isCompleto()).toBe(true);
    });
    
    test('debe calcular progreso 0%', () => {
      const progreso = ciclo.calcularProgreso(0);
      
      expect(progreso).toBe(0);
      expect(ciclo.isCompleto()).toBe(false);
    });
    
    test('debe fallar con territorios completados negativos', () => {
      expect(() => {
        ciclo.calcularProgreso(-1);
      }).toThrow('Los territorios completados no pueden ser negativos');
    });
    
    test('debe fallar con territorios completados excesivos', () => {
      expect(() => {
        ciclo.calcularProgreso(51); // Más que el total
      }).toThrow('Los territorios completados no pueden exceder el total');
    });
  });
  
  describe('Estados del Ciclo', () => {
    let ciclo;
    
    beforeEach(() => {
      ciclo = new Ciclo({
        barrio: 'Zulima',
        total_territorios: 50
      });
    });
    
    test('debe completar ciclo correctamente', () => {
      ciclo.calcularProgreso(45); // 90%
      ciclo.completar();
      
      expect(ciclo.estado).toBe('completado');
      expect(ciclo.fecha_fin).toBe(new Date().toISOString().split('T')[0]);
      expect(ciclo.progreso_porcentaje).toBe(100); // Debe forzar a 100%
      expect(ciclo.territorios_completados).toBe(50); // Debe forzar al total
    });
    
    test('debe completar ciclo con fecha específica', () => {
      ciclo.completar('2025-01-31');
      
      expect(ciclo.fecha_fin).toBe('2025-01-31');
    });
    
    test('debe fallar al completar ciclo ya completado', () => {
      ciclo.completar();
      
      expect(() => {
        ciclo.completar();
      }).toThrow('El ciclo ya está completado');
    });
    
    test('debe pausar ciclo correctamente', () => {
      ciclo.pausar();
      
      expect(ciclo.estado).toBe('pausado');
      expect(ciclo.isActivo()).toBe(false);
    });
    
    test('debe fallar al pausar ciclo completado', () => {
      ciclo.completar();
      
      expect(() => {
        ciclo.pausar();
      }).toThrow('No se puede pausar un ciclo completado');
    });
    
    test('debe reactivar ciclo pausado', () => {
      ciclo.pausar();
      ciclo.reactivar();
      
      expect(ciclo.estado).toBe('activo');
      expect(ciclo.isActivo()).toBe(true);
    });
    
    test('debe fallar al reactivar ciclo completado', () => {
      ciclo.completar();
      
      expect(() => {
        ciclo.reactivar();
      }).toThrow('No se puede reactivar un ciclo completado');
    });
  });
  
  describe('Información de Progreso', () => {
    test('debe retornar información de progreso correcta', () => {
      const ciclo = new Ciclo({
        barrio: 'Zulima',
        total_territorios: 50
      });
      
      ciclo.calcularProgreso(25);
      const info = ciclo.getProgresoInfo();
      
      expect(info).toEqual({
        territorios_completados: 25,
        total_territorios: 50,
        progreso_porcentaje: 50,
        estado: 'activo',
        is_completo: false
      });
    });
    
    test('debe redondear progreso a 2 decimales', () => {
      const ciclo = new Ciclo({
        barrio: 'Zulima',
        total_territorios: 3
      });
      
      ciclo.calcularProgreso(1); // 33.333...%
      const info = ciclo.getProgresoInfo();
      
      expect(info.progreso_porcentaje).toBe(33.33);
    });
  });
  
  describe('Persistencia', () => {
    test('toDatabase debe retornar datos para BD', () => {
      const ciclo = new Ciclo({
        barrio: 'Zulima',
        total_territorios: 50,
        numero_ciclo: 2,
        fecha_inicio: '2025-01-01'
      });
      
      ciclo.calcularProgreso(25);
      const dbData = ciclo.toDatabase();
      
      expect(dbData).toEqual({
        barrio: 'Zulima',
        numero_ciclo: 2,
        fecha_inicio: '2025-01-01',
        fecha_fin: null,
        total_territorios: 50,
        territorios_completados: 25,
        progreso_porcentaje: 50,
        estado: 'activo'
      });
    });
  });
  
  describe('Métodos Estáticos', () => {
    test('fromDatabase debe crear instancia desde datos de BD', () => {
      const dbData = {
        barrio: 'Acacios',
        numero_ciclo: 3,
        fecha_inicio: '2025-01-01',
        fecha_fin: null,
        total_territorios: 45,
        territorios_completados: 20,
        progreso_porcentaje: 44.44,
        estado: 'activo'
      };
      
      const ciclo = Ciclo.fromDatabase(dbData);
      
      expect(ciclo.barrio).toBe('Acacios');
      expect(ciclo.numero_ciclo).toBe(3);
      expect(ciclo.territorios_completados).toBe(20);
      expect(ciclo.progreso_porcentaje).toBe(44.44);
      expect(ciclo.estado).toBe('activo');
    });
    
    test('crearSiguiente debe crear nuevo ciclo basado en anterior', () => {
      const cicloAnterior = new Ciclo({
        barrio: 'Zulima',
        total_territorios: 50,
        numero_ciclo: 2
      });
      
      cicloAnterior.calcularProgreso(50); // Completar
      cicloAnterior.completar();
      
      const siguienteCiclo = Ciclo.crearSiguiente(cicloAnterior);
      
      expect(siguienteCiclo.barrio).toBe('Zulima');
      expect(siguienteCiclo.total_territorios).toBe(50);
      expect(siguienteCiclo.numero_ciclo).toBe(3);
      expect(siguienteCiclo.estado).toBe('activo');
      expect(siguienteCiclo.territorios_completados).toBe(0);
    });
    
    test('crearSiguiente debe fallar con ciclo no completado', () => {
      const cicloIncompleto = new Ciclo({
        barrio: 'Zulima',
        total_territorios: 50
      });
      
      cicloIncompleto.calcularProgreso(25); // Solo 50%
      
      expect(() => {
        Ciclo.crearSiguiente(cicloIncompleto);
      }).toThrow('El ciclo anterior debe estar completado');
    });
  });
  
  describe('Casos Edge', () => {
    test('debe manejar espacios en blanco en barrio', () => {
      const ciclo = new Ciclo({
        barrio: '  Zulima  ',
        total_territorios: 50
      });
      
      expect(ciclo.barrio).toBe('Zulima');
    });
    
    test('debe manejar total_territorios con valor 1', () => {
      const ciclo = new Ciclo({
        barrio: 'Test',
        total_territorios: 1
      });
      
      ciclo.calcularProgreso(1);
      expect(ciclo.progreso_porcentaje).toBe(100);
      expect(ciclo.isCompleto()).toBe(true);
    });
  });
});