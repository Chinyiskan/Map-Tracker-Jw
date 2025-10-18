// tests/unit/repositories/OptimizedRepositories.test.js
// Tests unitarios para repositorios optimizados con SQL nativo

import ReporteRepository from '../../../backend/infrastructure/database/repositories/ReporteRepository.js';
import ProgresoRepository from '../../../backend/infrastructure/database/repositories/ProgresoRepository.js';

// Mock de Supabase client
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  rpc: jest.fn()
};

describe('Repositorios Optimizados - Tests Unitarios', () => {
  let reporteRepository;
  let progresoRepository;
  
  beforeAll(() => {
    reporteRepository = new ReporteRepository(mockSupabaseClient);
    progresoRepository = new ProgresoRepository(mockSupabaseClient);
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('ReporteRepository - Métodos Optimizados', () => {
    describe('obtenerEstadisticas', () => {
      test('debe usar consulta SQL optimizada cuando RPC está disponible', async () => {
        const mockEstadisticas = {
          total_reportes: 1500,
          barrios_unicos: 12,
          capitanes_unicos: 25,
          fecha_primer_reporte: '2024-01-01',
          fecha_ultimo_reporte: '2024-12-31',
          reportes_ultima_semana: 45,
          reportes_ultimo_mes: 180
        };
        
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: [mockEstadisticas],
          error: null
        });
        
        const opciones = {
          fechaDesde: '2024-01-01',
          fechaHasta: '2024-12-31',
          barrio: 'Alcalá'
        };
        
        const resultado = await reporteRepository.obtenerEstadisticas(opciones);
        
        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('execute_sql', {
          query: expect.stringContaining('COUNT(*) as total_reportes'),
          params: ['2024-01-01', '2024-12-31', 'Alcalá']
        });
        
        expect(resultado).toEqual({
          total_reportes: 1500,
          barrios_unicos: 12,
          capitanes_unicos: 25,
          fecha_primer_reporte: '2024-01-01',
          fecha_ultimo_reporte: '2024-12-31',
          reportes_ultima_semana: 45,
          reportes_ultimo_mes: 180
        });
      });
      
      test('debe usar método legacy cuando RPC falla', async () => {
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
        
        // Simular fallo en RPC
        mockSupabaseClient.rpc.mockRejectedValueOnce(new Error('RPC not available'));
        
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
        
        const resultado = await reporteRepository.obtenerEstadisticas({
          fechaDesde: '2024-01-01',
          fechaHasta: '2024-03-31'
        });
        
        expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(1);
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('reportes');
        
        expect(resultado.total_reportes).toBe(2);
        expect(resultado.barrios_unicos).toBe(2);
        expect(resultado.capitanes_unicos).toBe(2);
      });
      
      test('debe construir consulta SQL correcta con filtros opcionales', async () => {
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: [{ total_reportes: 100 }],
          error: null
        });
        
        // Test sin filtros
        await reporteRepository.obtenerEstadisticas({});
        
        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('execute_sql', {
          query: expect.not.stringContaining('WHERE'),
          params: []
        });
        
        jest.clearAllMocks();
        
        // Test con todos los filtros
        await reporteRepository.obtenerEstadisticas({
          fechaDesde: '2024-01-01',
          fechaHasta: '2024-12-31',
          barrio: 'Alcalá'
        });
        
        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('execute_sql', {
          query: expect.stringContaining('WHERE fecha >= $1 AND fecha <= $2 AND barrio = $3'),
          params: ['2024-01-01', '2024-12-31', 'Alcalá']
        });
      });
    });
    
    describe('obtenerEstadisticasMensuales', () => {
      test('debe usar agregaciones SQL por mes', async () => {
        const mockEstadisticasMensuales = [
          {
            mes: '2024-01-01',
            total_reportes: 150,
            barrios_activos: 8,
            capitanes_activos: 15,
            territorios_trabajados: 45,
            lista_barrios: ['Alcalá', 'Niza', 'Prados Norte']
          },
          {
            mes: '2024-02-01',
            total_reportes: 180,
            barrios_activos: 10,
            capitanes_activos: 18,
            territorios_trabajados: 52,
            lista_barrios: ['Alcalá', 'Niza', 'Tasajero']
          }
        ];
        
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: mockEstadisticasMensuales,
          error: null
        });
        
        const resultado = await reporteRepository.obtenerEstadisticasMensuales(
          '2024-01-01',
          '2024-02-28'
        );
        
        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('execute_sql', {
          query: expect.stringContaining('DATE_TRUNC(\'month\', fecha)'),
          params: ['2024-01-01', '2024-02-28']
        });
        
        expect(resultado).toHaveLength(2);
        expect(resultado[0]).toEqual({
          mes: '2024-01-01',
          total_reportes: 150,
          barrios_activos: 8,
          capitanes_activos: 15,
          territorios_trabajados: 45,
          lista_barrios: ['Alcalá', 'Niza', 'Prados Norte']
        });
      });
      
      test('debe usar método legacy cuando SQL optimizado falla', async () => {
        const mockReportes = [
          {
            fecha: '2024-01-15',
            barrio: 'Alcalá',
            nombre_capitan: 'Juan Pérez',
            territorio: 'T1'
          },
          {
            fecha: '2024-02-10',
            barrio: 'Niza',
            nombre_capitan: 'María García',
            territorio: 'T2'
          }
        ];
        
        // Simular fallo en SQL optimizado
        mockSupabaseClient.rpc.mockRejectedValueOnce(new Error('SQL failed'));
        
        // Mock para obtenerPorRangoFechas (método legacy)
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
        
        const resultado = await reporteRepository.obtenerEstadisticasMensuales(
          '2024-01-01',
          '2024-02-28'
        );
        
        expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(1);
        expect(resultado).toHaveLength(2); // 2 meses diferentes
        expect(resultado[0].mes).toBe('2024-02-01'); // Ordenado DESC
        expect(resultado[1].mes).toBe('2024-01-01');
      });
    });
  });
  
  describe('ProgresoRepository - Métodos Optimizados', () => {
    describe('obtenerEstadisticasOptimizadas', () => {
      test('debe usar consulta SQL con joins optimizados', async () => {
        const mockEstadisticas = {
          total_territorios_trabajados: 250,
          territorios_unicos: 180,
          ciclos_activos: 8,
          barrios_activos: 12,
          fecha_primer_trabajo: '2024-01-15',
          fecha_ultimo_trabajo: '2024-03-20',
          promedio_dias_ciclo: 45.5,
          trabajados_ultima_semana: 25,
          trabajados_ultimo_mes: 120
        };
        
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: [mockEstadisticas],
          error: null
        });
        
        const resultado = await progresoRepository.obtenerEstadisticasOptimizadas(
          '2024-01-01',
          '2024-03-31',
          { cicloId: 'ciclo-123', barrio: 'Alcalá' }
        );
        
        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('execute_sql', {
          query: expect.stringContaining('INNER JOIN ciclos c ON p.ciclo_id = c.id'),
          params: ['2024-01-01', '2024-03-31', 'ciclo-123', 'Alcalá']
        });
        
        expect(resultado).toEqual({
          total_territorios_trabajados: 250,
          territorios_unicos: 180,
          ciclos_activos: 8,
          barrios_activos: 12,
          fecha_primer_trabajo: '2024-01-15',
          fecha_ultimo_trabajo: '2024-03-20',
          promedio_dias_ciclo: 45.5,
          trabajados_ultima_semana: 25,
          trabajados_ultimo_mes: 120
        });
      });
      
      test('debe construir WHERE clause correctamente según opciones', async () => {
        mockSupabaseClient.rpc.mockResolvedValue({
          data: [{}],
          error: null
        });
        
        // Test solo con fechas
        await progresoRepository.obtenerEstadisticasOptimizadas(
          '2024-01-01',
          '2024-03-31'
        );
        
        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('execute_sql', {
          query: expect.stringContaining('WHERE p.fecha_trabajado >= $1 AND p.fecha_trabajado <= $2'),
          params: ['2024-01-01', '2024-03-31']
        });
        
        jest.clearAllMocks();
        
        // Test con cicloId
        await progresoRepository.obtenerEstadisticasOptimizadas(
          '2024-01-01',
          '2024-03-31',
          { cicloId: 'ciclo-456' }
        );
        
        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('execute_sql', {
          query: expect.stringContaining('AND p.ciclo_id = $3'),
          params: ['2024-01-01', '2024-03-31', 'ciclo-456']
        });
      });
    });
    
    describe('obtenerProgresoPorBarrioOptimizado', () => {
      test('debe usar consulta SQL con agregaciones por barrio', async () => {
        const mockProgreso = [
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
        
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: mockProgreso,
          error: null
        });
        
        const resultado = await progresoRepository.obtenerProgresoPorBarrioOptimizado(
          '2024-01-01',
          '2024-03-31'
        );
        
        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('execute_sql', {
          query: expect.stringContaining('GROUP BY c.id, c.barrio, c.numero_ciclo, c.total_territorios'),
          params: ['2024-01-01', '2024-03-31']
        });
        
        expect(resultado).toHaveLength(2);
        expect(resultado[0]).toEqual({
          barrio: 'Alcalá',
          numero_ciclo: 1,
          total_territorios: 50,
          territorios_trabajados: 35,
          total_trabajos: 42,
          fecha_inicio_trabajo: '2024-01-15',
          fecha_ultimo_trabajo: '2024-03-10',
          progreso_porcentaje: 70.0,
          estado: 'activo'
        });
      });
      
      test('debe calcular progreso_porcentaje correctamente en SQL', async () => {
        const mockProgreso = [
          {
            barrio: 'Test',
            numero_ciclo: 1,
            total_territorios: 40,
            territorios_trabajados: 30,
            progreso_porcentaje: 75.0, // 30/40 * 100
            estado: 'activo'
          }
        ];
        
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: mockProgreso,
          error: null
        });
        
        const resultado = await progresoRepository.obtenerProgresoPorBarrioOptimizado(
          '2024-01-01',
          '2024-03-31'
        );
        
        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('execute_sql', {
          query: expect.stringContaining('ROUND((COUNT(DISTINCT p.territorio)::decimal / NULLIF(c.total_territorios, 0)) * 100, 2)'),
          params: ['2024-01-01', '2024-03-31']
        });
        
        expect(resultado[0].progreso_porcentaje).toBe(75.0);
      });
      
      test('debe determinar estado correctamente con CASE', async () => {
        const mockProgreso = [
          {
            barrio: 'Completado',
            total_territorios: 20,
            territorios_trabajados: 20,
            estado: 'completado'
          },
          {
            barrio: 'Activo',
            total_territorios: 30,
            territorios_trabajados: 15,
            estado: 'activo'
          },
          {
            barrio: 'Inactivo',
            total_territorios: 25,
            territorios_trabajados: 0,
            estado: 'inactivo'
          }
        ];
        
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: mockProgreso,
          error: null
        });
        
        const resultado = await progresoRepository.obtenerProgresoPorBarrioOptimizado(
          '2024-01-01',
          '2024-03-31'
        );
        
        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('execute_sql', {
          query: expect.stringContaining('CASE WHEN COUNT(DISTINCT p.territorio) = c.total_territorios THEN \'completado\''),
          params: ['2024-01-01', '2024-03-31']
        });
        
        expect(resultado[0].estado).toBe('completado');
        expect(resultado[1].estado).toBe('activo');
        expect(resultado[2].estado).toBe('inactivo');
      });
    });
  });
  
  describe('Manejo de Errores y Fallbacks', () => {
    test('ReporteRepository debe manejar errores de RPC gracefully', async () => {
      const errorMessage = 'Database connection failed';
      mockSupabaseClient.rpc.mockRejectedValueOnce(new Error(errorMessage));
      
      // Configurar fallback exitoso
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
      });
      
      const resultado = await reporteRepository.obtenerEstadisticas({});
      
      // Debe haber intentado RPC primero
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(1);
      
      // Luego debe haber usado el método legacy
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('reportes');
      
      // El resultado debe ser válido (del método legacy)
      expect(resultado).toBeDefined();
      expect(typeof resultado.total_reportes).toBe('number');
    });
    
    test('ProgresoRepository debe usar fallback cuando SQL optimizado falla', async () => {
      mockSupabaseClient.rpc.mockRejectedValueOnce(new Error('SQL syntax error'));
      
      // El método debe intentar usar fallback (que no existe en este caso)
      // pero debe manejar el error gracefully
      await expect(
        progresoRepository.obtenerEstadisticasOptimizadas('2024-01-01', '2024-03-31')
      ).rejects.toThrow();
      
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(1);
    });
    
    test('debe validar parámetros de entrada', async () => {
      // Test con fechas inválidas
      await expect(
        reporteRepository.obtenerEstadisticasMensuales(null, '2024-03-31')
      ).rejects.toThrow();
      
      await expect(
        progresoRepository.obtenerProgresoPorBarrioOptimizado('', '2024-03-31')
      ).rejects.toThrow();
    });
  });
  
  describe('Optimización de Consultas', () => {
    test('debe usar índices eficientemente en consultas de fecha', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [{}],
        error: null
      });
      
      await reporteRepository.obtenerEstadisticas({
        fechaDesde: '2024-01-01',
        fechaHasta: '2024-12-31'
      });
      
      // Verificar que la consulta usa comparaciones de fecha eficientes
      const sqlQuery = mockSupabaseClient.rpc.mock.calls[0][1].query;
      expect(sqlQuery).toContain('fecha >= $1');
      expect(sqlQuery).toContain('fecha <= $2');
      expect(sqlQuery).not.toContain('EXTRACT'); // Evitar funciones costosas
    });
    
    test('debe usar agregaciones nativas en lugar de cálculos en memoria', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [{}],
        error: null
      });
      
      await reporteRepository.obtenerEstadisticas({});
      
      const sqlQuery = mockSupabaseClient.rpc.mock.calls[0][1].query;
      
      // Verificar uso de agregaciones SQL nativas
      expect(sqlQuery).toContain('COUNT(*)');
      expect(sqlQuery).toContain('COUNT(DISTINCT');
      expect(sqlQuery).toContain('MIN(fecha)');
      expect(sqlQuery).toContain('MAX(fecha)');
      expect(sqlQuery).toContain('COUNT(CASE WHEN');
    });
    
    test('debe usar joins eficientes en consultas de progreso', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [],
        error: null
      });
      
      await progresoRepository.obtenerProgresoPorBarrioOptimizado(
        '2024-01-01',
        '2024-03-31'
      );
      
      const sqlQuery = mockSupabaseClient.rpc.mock.calls[0][1].query;
      
      // Verificar uso de LEFT JOIN para incluir ciclos sin progreso
      expect(sqlQuery).toContain('LEFT JOIN');
      expect(sqlQuery).toContain('GROUP BY');
      expect(sqlQuery).toContain('ORDER BY progreso_porcentaje DESC');
    });
  });
});