// backend/infrastructure/database/MockDataService.js
// Servicio centralizado para datos mock consistentes en todos los repositorios

/**
 * Servicio de Datos Mock - Proporciona datos de fallback consistentes
 * Garantiza que todos los repositorios usen datos mock coherentes
 */
export class MockDataService {
  
  /**
   * Obtener datos mock para reportes
   * @param {Object} filters - Filtros aplicados
   * @returns {Array} Lista de reportes mock
   */
  static getMockReportes(filters = {}) {
    console.log('📝 Generando datos mock de reportes...');
    
    const mockData = [
      {
        id: 'mock-reporte-1',
        nombre_capitan: 'Augusto Maldonado',
        fecha: '2025-01-15',
        barrio: 'Niza',
        manzanas: ['N1', 'N2', 'N3'],
        observaciones: 'Territorio trabajado completamente',
        salida_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-reporte-2',
        nombre_capitan: 'Oscar Giraldo',
        fecha: '2025-01-14',
        barrio: 'Zulima',
        manzanas: ['Z4', 'Z5'],
        observaciones: 'Buen recibimiento en el territorio',
        salida_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-reporte-3',
        nombre_capitan: 'Julian Bayona',
        fecha: '2025-01-13',
        barrio: 'Guaimaral',
        manzanas: ['G1', 'G2'],
        observaciones: 'Territorio con buenas perspectivas',
        salida_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    return this._applyFilters(mockData, filters, 'reportes');
  }
  
  /**
   * Obtener datos mock para ciclos
   * @param {Object} filters - Filtros aplicados
   * @returns {Array} Lista de ciclos mock
   */
  static getMockCiclos(filters = {}) {
    console.log('🔄 Generando datos mock de ciclos...');
    
    const mockData = [
      {
        id: 'mock-ciclo-1',
        barrio: 'Niza',
        numero_ciclo: 1,
        total_territorios: 45,
        territorios_completados: 12,
        progreso_porcentaje: 26.67,
        estado: 'activo',
        fecha_inicio: '2025-01-01',
        fecha_fin: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-ciclo-2',
        barrio: 'Zulima',
        numero_ciclo: 1,
        total_territorios: 38,
        territorios_completados: 8,
        progreso_porcentaje: 21.05,
        estado: 'activo',
        fecha_inicio: '2025-01-01',
        fecha_fin: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-ciclo-3',
        barrio: 'Guaimaral',
        numero_ciclo: 1,
        total_territorios: 42,
        territorios_completados: 5,
        progreso_porcentaje: 11.90,
        estado: 'activo',
        fecha_inicio: '2025-01-01',
        fecha_fin: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    return this._applyFilters(mockData, filters, 'ciclos');
  }
  
  /**
   * Obtener datos mock para progreso de territorios
   * @param {Object} filters - Filtros aplicados
   * @returns {Array} Lista de progreso mock
   */
  static getMockProgreso(filters = {}) {
    console.log('📍 Generando datos mock de progreso...');
    
    const mockData = [
      {
        id: 'mock-progreso-1',
        ciclo_id: 'mock-ciclo-1',
        territorio: 'N1',
        fecha_trabajado: '2025-01-15',
        reporte_id: 'mock-reporte-1',
        created_at: new Date().toISOString()
      },
      {
        id: 'mock-progreso-2',
        ciclo_id: 'mock-ciclo-1',
        territorio: 'N2',
        fecha_trabajado: '2025-01-15',
        reporte_id: 'mock-reporte-1',
        created_at: new Date().toISOString()
      },
      {
        id: 'mock-progreso-3',
        ciclo_id: 'mock-ciclo-2',
        territorio: 'Z4',
        fecha_trabajado: '2025-01-14',
        reporte_id: 'mock-reporte-2',
        created_at: new Date().toISOString()
      },
      {
        id: 'mock-progreso-4',
        ciclo_id: 'mock-ciclo-2',
        territorio: 'Z5',
        fecha_trabajado: '2025-01-14',
        reporte_id: 'mock-reporte-2',
        created_at: new Date().toISOString()
      }
    ];
    
    return this._applyFilters(mockData, filters, 'progreso');
  }
  
  /**
   * Obtener datos mock para salidas
   * @param {Object} filters - Filtros aplicados
   * @returns {Array} Lista de salidas mock
   */
  static getMockSalidas(filters = {}) {
    console.log('🚪 Generando datos mock de salidas...');
    
    const mockData = [
      {
        id: 'mock-salida-1',
        capitan_id: 'mock-capitan-1',
        barrio_asignado: 'Niza',
        dia_semana: 'Jueves',
        hora: '08:30:00',
        estado: 'activo',
        observaciones: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-salida-2',
        capitan_id: 'mock-capitan-2',
        barrio_asignado: 'La Mar y Gratamira',
        dia_semana: 'Lunes',
        hora: '16:00:00',
        estado: 'activo',
        observaciones: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-salida-3',
        capitan_id: 'mock-capitan-3',
        barrio_asignado: 'Zulima',
        dia_semana: 'Martes',
        hora: '08:30:00',
        estado: 'activo',
        observaciones: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-salida-4',
        capitan_id: 'mock-capitan-4',
        barrio_asignado: 'Guaimaral',
        dia_semana: 'Miercoles',
        hora: '08:30:00',
        estado: 'activo',
        observaciones: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    return this._applyFilters(mockData, filters, 'salidas');
  }
  
  /**
   * Obtener datos mock para capitanes
   * @param {Object} filters - Filtros aplicados
   * @returns {Array} Lista de capitanes mock
   */
  static getMockCapitanes(filters = {}) {
    console.log('👥 Generando datos mock de capitanes...');
    
    const mockData = [
      {
        id: 'mock-capitan-1',
        nombre: 'Augusto',
        apellido: 'Maldonado',
        telefono: '3002071800',
        email: 'augusto.maldonado@email.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-capitan-2',
        nombre: 'Oscar',
        apellido: 'Giraldo',
        telefono: '3124826062',
        email: 'oscar.giraldo@email.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-capitan-3',
        nombre: 'Julian',
        apellido: 'Bayona',
        telefono: '3165709422',
        email: 'julian.bayona@email.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-capitan-4',
        nombre: 'Juan Carlos',
        apellido: 'Mojica',
        telefono: '3202419509',
        email: 'juan.mojica@email.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    return this._applyFilters(mockData, filters, 'capitanes');
  }
  
  /**
   * Obtener estadísticas mock para cualquier tabla
   * @param {string} tableName - Nombre de la tabla
   * @param {Object} options - Opciones adicionales
   * @returns {Object} Estadísticas mock
   */
  static getMockStats(tableName, options = {}) {
    console.log(`📊 Generando estadísticas mock para ${tableName}...`);
    
    const baseStats = {
      timestamp: new Date().toISOString(),
      source: 'mock_data',
      table: tableName
    };
    
    switch (tableName) {
      case 'reportes':
        return {
          ...baseStats,
          total_reportes: 3,
          barrios_unicos: 3,
          capitanes_unicos: 3,
          fecha_primer_reporte: '2025-01-13',
          fecha_ultimo_reporte: '2025-01-15',
          promedio_manzanas_por_reporte: 2.33
        };
        
      case 'ciclos':
        return {
          ...baseStats,
          total_ciclos: 3,
          ciclos_activos: 3,
          ciclos_completados: 0,
          progreso_promedio: 19.87,
          barrios_con_ciclos: 3
        };
        
      case 'progreso_territorios':
        return {
          ...baseStats,
          total_territorios_trabajados: 4,
          territorios_unicos: 4,
          ciclos_con_progreso: 2,
          fecha_primer_trabajo: '2025-01-14',
          fecha_ultimo_trabajo: '2025-01-15'
        };
        
      case 'salidas_predicacion':
        return {
          ...baseStats,
          total_salidas: 4,
          capitanes_unicos: 4,
          barrios_asignados: 4,
          salidas_activas: 4,
          dias_programados: 4
        };
        
      case 'capitanes':
        return {
          ...baseStats,
          total_capitanes: 4,
          capitanes_con_telefono: 4,
          capitanes_con_email: 4,
          capitanes_contacto_completo: 4,
          porcentaje_contacto_completo: 100
        };
        
      default:
        return {
          ...baseStats,
          total_records: 0,
          message: `No hay datos mock definidos para ${tableName}`
        };
    }
  }
  
  /**
   * Aplicar filtros a los datos mock
   * @param {Array} data - Datos originales
   * @param {Object} filters - Filtros a aplicar
   * @param {string} tableName - Nombre de la tabla
   * @returns {Array} Datos filtrados
   * @private
   */
  static _applyFilters(data, filters, tableName) {
    if (!filters || Object.keys(filters).length === 0) {
      console.log(`✅ Generados ${data.length} registros mock para ${tableName}`);
      return data;
    }
    
    let filteredData = [...data];
    
    // Aplicar filtros específicos según la tabla
    switch (tableName) {
      case 'reportes':
        filteredData = this._applyReportesFilters(filteredData, filters);
        break;
        
      case 'ciclos':
        filteredData = this._applyCiclosFilters(filteredData, filters);
        break;
        
      case 'progreso':
        filteredData = this._applyProgresoFilters(filteredData, filters);
        break;
        
      case 'salidas':
        filteredData = this._applySalidasFilters(filteredData, filters);
        break;
        
      case 'capitanes':
        filteredData = this._applyCapitanesFilters(filteredData, filters);
        break;
    }
    
    console.log(`✅ Generados ${filteredData.length} registros mock filtrados para ${tableName}`);
    return filteredData;
  }
  
  /**
   * Aplicar filtros específicos para reportes
   * @param {Array} data - Datos de reportes
   * @param {Object} filters - Filtros
   * @returns {Array} Datos filtrados
   * @private
   */
  static _applyReportesFilters(data, filters) {
    let filtered = data;
    
    if (filters.barrio) {
      filtered = filtered.filter(item => 
        item.barrio.toLowerCase().includes(filters.barrio.toLowerCase())
      );
    }
    
    if (filters.nombre_capitan) {
      filtered = filtered.filter(item => 
        item.nombre_capitan.toLowerCase().includes(filters.nombre_capitan.toLowerCase())
      );
    }
    
    if (filters.fecha_desde) {
      filtered = filtered.filter(item => item.fecha >= filters.fecha_desde);
    }
    
    if (filters.fecha_hasta) {
      filtered = filtered.filter(item => item.fecha <= filters.fecha_hasta);
    }
    
    return filtered;
  }
  
  /**
   * Aplicar filtros específicos para ciclos
   * @param {Array} data - Datos de ciclos
   * @param {Object} filters - Filtros
   * @returns {Array} Datos filtrados
   * @private
   */
  static _applyCiclosFilters(data, filters) {
    let filtered = data;
    
    if (filters.barrio) {
      filtered = filtered.filter(item => 
        item.barrio.toLowerCase().includes(filters.barrio.toLowerCase())
      );
    }
    
    if (filters.estado) {
      filtered = filtered.filter(item => item.estado === filters.estado);
    }
    
    if (filters.numero_ciclo) {
      filtered = filtered.filter(item => item.numero_ciclo === parseInt(filters.numero_ciclo));
    }
    
    return filtered;
  }
  
  /**
   * Aplicar filtros específicos para progreso
   * @param {Array} data - Datos de progreso
   * @param {Object} filters - Filtros
   * @returns {Array} Datos filtrados
   * @private
   */
  static _applyProgresoFilters(data, filters) {
    let filtered = data;
    
    if (filters.ciclo_id) {
      filtered = filtered.filter(item => item.ciclo_id === filters.ciclo_id);
    }
    
    if (filters.territorio) {
      filtered = filtered.filter(item => 
        item.territorio.toLowerCase().includes(filters.territorio.toLowerCase())
      );
    }
    
    if (filters.fecha_desde) {
      filtered = filtered.filter(item => item.fecha_trabajado >= filters.fecha_desde);
    }
    
    if (filters.fecha_hasta) {
      filtered = filtered.filter(item => item.fecha_trabajado <= filters.fecha_hasta);
    }
    
    return filtered;
  }
  
  /**
   * Aplicar filtros específicos para salidas
   * @param {Array} data - Datos de salidas
   * @param {Object} filters - Filtros
   * @returns {Array} Datos filtrados
   * @private
   */
  static _applySalidasFilters(data, filters) {
    let filtered = data;
    
    if (filters.capitan_id) {
      filtered = filtered.filter(item => item.capitan_id === filters.capitan_id);
    }
    
    if (filters.barrio_asignado) {
      filtered = filtered.filter(item => 
        item.barrio_asignado.toLowerCase().includes(filters.barrio_asignado.toLowerCase())
      );
    }
    
    if (filters.dia_semana) {
      filtered = filtered.filter(item => item.dia_semana === filters.dia_semana);
    }
    
    if (filters.estado) {
      filtered = filtered.filter(item => item.estado === filters.estado);
    }
    
    return filtered;
  }
  
  /**
   * Aplicar filtros específicos para capitanes
   * @param {Array} data - Datos de capitanes
   * @param {Object} filters - Filtros
   * @returns {Array} Datos filtrados
   * @private
   */
  static _applyCapitanesFilters(data, filters) {
    let filtered = data;
    
    if (filters.nombre) {
      filtered = filtered.filter(item => 
        item.nombre.toLowerCase().includes(filters.nombre.toLowerCase())
      );
    }
    
    if (filters.apellido) {
      filtered = filtered.filter(item => 
        item.apellido.toLowerCase().includes(filters.apellido.toLowerCase())
      );
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.nombre.toLowerCase().includes(searchTerm) ||
        item.apellido.toLowerCase().includes(searchTerm)
      );
    }
    
    return filtered;
  }
}

export default MockDataService;