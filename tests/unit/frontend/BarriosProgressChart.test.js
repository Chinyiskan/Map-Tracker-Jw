// tests/unit/frontend/BarriosProgressChart.test.js
// Pruebas unitarias para el componente BarriosProgressChart

import { BarriosProgressChart } from '../../../frontend/js/barrios-progress-chart.js';

// Mock del fetch global
global.fetch = jest.fn();

// Mock del DOM
Object.defineProperty(window, 'document', {
  value: {
    getElementById: jest.fn(),
    createElement: jest.fn(),
    head: {
      appendChild: jest.fn()
    },
    querySelectorAll: jest.fn(() => [])
  }
});

// Mock de console para evitar logs en tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn()
};

describe('BarriosProgressChart', () => {
  let mockContainer;
  let chart;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock del contenedor DOM
    mockContainer = {
      innerHTML: '',
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(() => []),
      addEventListener: jest.fn()
    };
    
    document.getElementById.mockReturnValue(mockContainer);
    document.createElement.mockReturnValue({
      id: '',
      textContent: '',
      style: {}
    });
  });
  
  afterEach(() => {
    if (chart) {
      chart.destroy();
      chart = null;
    }
  });
  
  describe('Constructor', () => {
    test('debe crear instancia con configuración por defecto', () => {
      chart = new BarriosProgressChart('test-container');
      
      expect(chart.containerId).toBe('test-container');
      expect(chart.container).toBe(mockContainer);
      expect(chart.config.api.endpoint).toBe('/api/ciclos/progreso');
      expect(chart.config.theme).toBe('light');
      expect(chart.config.animations).toBe(true);
    });
    
    test('debe lanzar error si no encuentra el contenedor', () => {
      document.getElementById.mockReturnValue(null);
      
      expect(() => {
        new BarriosProgressChart('inexistente');
      }).toThrow("Contenedor con ID 'inexistente' no encontrado");
    });
    
    test('debe aplicar configuración personalizada', () => {
      const customConfig = {
        theme: 'dark',
        animations: false,
        autoRefresh: false,
        api: {
          endpoint: '/custom/endpoint',
          timeout: 5000
        }
      };
      
      chart = new BarriosProgressChart('test-container', customConfig);
      
      expect(chart.config.theme).toBe('dark');
      expect(chart.config.animations).toBe(false);
      expect(chart.config.autoRefresh).toBe(false);
      expect(chart.config.api.endpoint).toBe('/custom/endpoint');
      expect(chart.config.api.timeout).toBe(5000);
    });
  });
  
  describe('Estructura HTML', () => {
    test('debe crear la estructura HTML correcta', () => {
      chart = new BarriosProgressChart('test-container');
      
      expect(mockContainer.innerHTML).toContain('barrios-progress-chart');
      expect(mockContainer.innerHTML).toContain('barrios-progress-chart__header');
      expect(mockContainer.innerHTML).toContain('barrios-progress-chart__title');
      expect(mockContainer.innerHTML).toContain('Progreso por Barrios');
      expect(mockContainer.innerHTML).toContain('barrios-progress-chart__content');
    });
  });
  
  describe('Carga de datos', () => {
    beforeEach(() => {
      mockContainer.querySelector.mockImplementation((selector) => {
        if (selector === '.barrios-progress-chart__content') {
          return { innerHTML: '' };
        }
        if (selector === '.barrios-progress-chart__stats') {
          return { innerHTML: '' };
        }
        return null;
      });
    });
    
    test('debe cargar datos exitosamente', async () => {
      const mockData = [
        {
          barrio: 'Niza',
          progreso_porcentaje: 75.5,
          territorios_completados: 15,
          total_territorios: 20,
          numero_ciclo: 2,
          estado: 'activo'
        },
        {
          barrio: 'Alcalá',
          progreso_porcentaje: 50.0,
          territorios_completados: 8,
          total_territorios: 16,
          numero_ciclo: 1,
          estado: 'activo'
        }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockData
        })
      });
      
      chart = new BarriosProgressChart('test-container');
      await chart.loadData();
      
      expect(fetch).toHaveBeenCalledWith('/api/ciclos/progreso', {
        signal: expect.any(AbortSignal),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      expect(chart.data).toEqual(mockData);
    });
    
    test('debe manejar errores de API', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      chart = new BarriosProgressChart('test-container');
      await chart.loadData();
      
      expect(console.error).toHaveBeenCalledWith(
        '❌ Error cargando datos:',
        expect.any(Error)
      );
    });
    
    test('debe manejar timeout', async () => {
      fetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10000))
      );
      
      chart = new BarriosProgressChart('test-container', {
        api: { timeout: 100 }
      });
      
      await chart.loadData();
      
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('Renderizado', () => {
    beforeEach(() => {
      mockContainer.querySelector.mockImplementation((selector) => {
        if (selector === '.barrios-progress-chart__content') {
          return { innerHTML: '' };
        }
        if (selector === '.barrios-progress-chart__stats') {
          return { innerHTML: '' };
        }
        return null;
      });
      
      mockContainer.querySelectorAll.mockReturnValue([]);
    });
    
    test('debe renderizar datos correctamente', () => {
      const mockData = [
        {
          barrio: 'Niza',
          progreso_porcentaje: 75.5,
          territorios_completados: 15,
          total_territorios: 20,
          numero_ciclo: 2,
          estado: 'activo'
        }
      ];
      
      chart = new BarriosProgressChart('test-container');
      chart.data = mockData;
      chart.renderChart();
      
      const contentElement = mockContainer.querySelector('.barrios-progress-chart__content');
      expect(contentElement.innerHTML).toContain('barrios-progress-chart__bars');
      expect(contentElement.innerHTML).toContain('Niza');
      expect(contentElement.innerHTML).toContain('75.5%');
      expect(contentElement.innerHTML).toContain('15/20 territorios');
      expect(contentElement.innerHTML).toContain('Ciclo 2');
    });
    
    test('debe mostrar mensaje cuando no hay datos', () => {
      chart = new BarriosProgressChart('test-container');
      chart.data = [];
      chart.renderChart();
      
      const contentElement = mockContainer.querySelector('.barrios-progress-chart__content');
      expect(contentElement.innerHTML).toContain('No hay datos disponibles');
    });
    
    test('debe ordenar barrios por progreso descendente', () => {
      const mockData = [
        { barrio: 'A', progreso_porcentaje: 30 },
        { barrio: 'B', progreso_porcentaje: 80 },
        { barrio: 'C', progreso_porcentaje: 50 }
      ];
      
      chart = new BarriosProgressChart('test-container');
      chart.data = mockData;
      chart.renderChart();
      
      // Verificar que se ordenó correctamente (B=80%, C=50%, A=30%)
      const contentElement = mockContainer.querySelector('.barrios-progress-chart__content');
      const html = contentElement.innerHTML;
      const indexB = html.indexOf('barrio="B"');
      const indexC = html.indexOf('barrio="C"');
      const indexA = html.indexOf('barrio="A"');
      
      expect(indexB).toBeLessThan(indexC);
      expect(indexC).toBeLessThan(indexA);
    });
  });
  
  describe('Estadísticas', () => {
    beforeEach(() => {
      mockContainer.querySelector.mockImplementation((selector) => {
        if (selector === '.barrios-progress-chart__stats') {
          return { innerHTML: '' };
        }
        return null;
      });
    });
    
    test('debe calcular estadísticas correctamente', () => {
      const mockData = [
        { progreso_porcentaje: 100 }, // Completo
        { progreso_porcentaje: 75 },
        { progreso_porcentaje: 50 },
        { progreso_porcentaje: 100 }  // Completo
      ];
      
      chart = new BarriosProgressChart('test-container');
      chart.renderStats(mockData);
      
      const statsElement = mockContainer.querySelector('.barrios-progress-chart__stats');
      expect(statsElement.innerHTML).toContain('4'); // Total barrios
      expect(statsElement.innerHTML).toContain('81.3%'); // Promedio (325/4)
      expect(statsElement.innerHTML).toContain('2'); // Barrios completos
    });
  });
  
  describe('Utilidades', () => {
    test('debe obtener etiquetas de estado correctas', () => {
      chart = new BarriosProgressChart('test-container');
      
      expect(chart.getEstadoLabel('activo')).toBe('En progreso');
      expect(chart.getEstadoLabel('completado')).toBe('Completado');
      expect(chart.getEstadoLabel('pausado')).toBe('Pausado');
      expect(chart.getEstadoLabel('pendiente')).toBe('Pendiente');
      expect(chart.getEstadoLabel('desconocido')).toBe('desconocido');
    });
  });
  
  describe('Auto-refresh', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    test('debe iniciar auto-refresh cuando está habilitado', () => {
      chart = new BarriosProgressChart('test-container', {
        autoRefresh: true,
        refreshInterval: 1000
      });
      
      expect(chart.refreshTimer).toBeTruthy();
    });
    
    test('debe detener auto-refresh', () => {
      chart = new BarriosProgressChart('test-container', {
        autoRefresh: true,
        refreshInterval: 1000
      });
      
      chart.stopAutoRefresh();
      expect(chart.refreshTimer).toBeNull();
    });
  });
  
  describe('Destrucción', () => {
    test('debe limpiar recursos correctamente', () => {
      chart = new BarriosProgressChart('test-container', {
        autoRefresh: true
      });
      
      chart.destroy();
      
      expect(chart.refreshTimer).toBeNull();
      expect(mockContainer.innerHTML).toBe('');
    });
  });
});