// backend/infrastructure/container.js
// Contenedor de inyección de dependencias

import { createClient } from '@supabase/supabase-js';

// Repositorios
import ReporteRepository from './database/repositories/ReporteRepository.js';
import CicloRepository from './database/repositories/CicloRepository.js';
import ProgresoRepository from './database/repositories/ProgresoRepository.js';
import { SalidaRepository } from './database/repositories/SalidaRepository.js';
import CapitanRepository from './database/repositories/CapitanRepository.js';
import ManzanasRepository from './database/repositories/ManzanasRepository.js';

// Servicios
import ReporteService from '../application/services/ReporteService.js';
import CicloService from '../application/services/CicloService.js';
import ProgresoService from '../application/services/ProgresoService.js';
import SalidaService from '../application/services/SalidaService.js';
import CapitanService from '../application/services/CapitanService.js';

// Controladores
import ReporteController from './web/controllers/ReporteController.js';
import CicloController from './web/controllers/CicloController.js';
import SalidaController from './web/controllers/SalidaController.js';
import CapitanController from './web/controllers/CapitanController.js';
import OptimizacionController from './web/controllers/OptimizacionController.js';
import ManzanasController from './web/controllers/ManzanasController.js';

class Container {
  constructor() {
    this.dependencies = new Map();
    this.singletons = new Map();
    this.setupDependencies();
  }
  
  /**
   * Configurar todas las dependencias
   */
  setupDependencies() {
    // Cliente de Supabase
    this.registerSingleton('supabaseClient', () => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Variables de entorno de Supabase no configuradas');
      }
      
      return createClient(supabaseUrl, supabaseKey);
    });
    
    // Repositorios
    this.registerSingleton('reporteRepository', () => {
      return new ReporteRepository(this.get('supabaseClient'));
    });
    
    this.registerSingleton('cicloRepository', () => {
      return new CicloRepository(this.get('supabaseClient'));
    });
    
    this.registerSingleton('progresoRepository', () => {
      return new ProgresoRepository(this.get('supabaseClient'));
    });
    
    this.registerSingleton('salidaRepository', () => {
      return new SalidaRepository(this.get('supabaseClient'));
    });
    
    this.registerSingleton('capitanRepository', () => {
      return new CapitanRepository(this.get('supabaseClient'));
    });
    
    this.registerSingleton('manzanasRepository', () => {
      return new ManzanasRepository(this.get('supabaseClient'));
    });
    
    // Servicios
    this.registerSingleton('progresoService', () => {
      return new ProgresoService(
        this.get('progresoRepository')
      );
    });
    
    this.registerSingleton('cicloService', () => {
      return new CicloService(
        this.get('cicloRepository'),
        this.get('progresoRepository'),
        this.get('manzanasRepository')
      );
    });
    
    this.registerSingleton('reporteService', () => {
      return new ReporteService(
        this.get('reporteRepository'),
        this.get('cicloService'),
        this.get('progresoService')
      );
    });
    
    this.registerSingleton('salidaService', () => {
      return new SalidaService(
        this.get('salidaRepository')
      );
    });
    
    this.registerSingleton('capitanService', () => {
      return new CapitanService(
        this.get('capitanRepository')
      );
    });
    
    // Controladores
    this.register('reporteController', () => {
      return new ReporteController(
        this.get('reporteService')
      );
    });
    
    this.register('cicloController', () => {
      return new CicloController(
        this.get('cicloService')
      );
    });
    
    this.register('salidaController', () => {
      return new SalidaController(
        this.get('salidaService')
      );
    });
    
    this.register('capitanController', () => {
      return new CapitanController(
        this.get('capitanService')
      );
    });
    
    this.register('optimizacionController', () => {
      return new OptimizacionController(
        this.get('supabaseClient'),
        this.get('cicloRepository')
      );
    });
    
    this.register('manzanasController', () => {
      return new ManzanasController(
        this.get('manzanasRepository')
      );
    });
  }
  
  /**
   * Registrar una dependencia
   * @param {string} name - Nombre de la dependencia
   * @param {Function} factory - Función factory
   */
  register(name, factory) {
    this.dependencies.set(name, factory);
  }
  
  /**
   * Registrar una dependencia singleton
   * @param {string} name - Nombre de la dependencia
   * @param {Function} factory - Función factory
   */
  registerSingleton(name, factory) {
    this.dependencies.set(name, factory);
    this.singletons.set(name, null);
  }
  
  /**
   * Obtener una dependencia
   * @param {string} name - Nombre de la dependencia
   * @returns {*} Instancia de la dependencia
   */
  get(name) {
    // Verificar si es singleton y ya está instanciado
    if (this.singletons.has(name)) {
      const instance = this.singletons.get(name);
      if (instance !== null) {
        return instance;
      }
    }
    
    // Obtener factory
    const factory = this.dependencies.get(name);
    if (!factory) {
      throw new Error(`Dependencia '${name}' no encontrada`);
    }
    
    // Crear instancia
    const instance = factory();
    
    // Guardar singleton si corresponde
    if (this.singletons.has(name)) {
      this.singletons.set(name, instance);
    }
    
    return instance;
  }
  
  /**
   * Verificar si una dependencia está registrada
   * @param {string} name - Nombre de la dependencia
   * @returns {boolean} True si está registrada
   */
  has(name) {
    return this.dependencies.has(name);
  }
  
  /**
   * Obtener todas las dependencias registradas
   * @returns {Array} Array de nombres de dependencias
   */
  getRegisteredDependencies() {
    return Array.from(this.dependencies.keys());
  }
  
  /**
   * Limpiar todas las instancias singleton (útil para testing)
   */
  clearSingletons() {
    this.singletons.forEach((value, key) => {
      this.singletons.set(key, null);
    });
  }
  
  /**
   * Verificar la salud de las dependencias
   * @returns {Object} Estado de las dependencias
   */
  async checkHealth() {
    const health = {
      status: 'healthy',
      dependencies: {},
      timestamp: new Date().toISOString()
    };
    
    try {
      // Verificar Supabase
      const supabase = this.get('supabaseClient');
      const { data, error } = await supabase
        .from('reportes')
        .select('id')
        .limit(1);
      
      health.dependencies.supabase = {
        status: error ? 'unhealthy' : 'healthy',
        error: error?.message || null
      };
      
      // Verificar repositorios
      const repositorios = ['reporteRepository', 'cicloRepository', 'progresoRepository'];
      for (const repo of repositorios) {
        try {
          const instance = this.get(repo);
          health.dependencies[repo] = {
            status: instance ? 'healthy' : 'unhealthy',
            instance: !!instance
          };
        } catch (error) {
          health.dependencies[repo] = {
            status: 'unhealthy',
            error: error.message
          };
        }
      }
      
      // Verificar servicios
      const servicios = ['reporteService', 'cicloService', 'progresoService'];
      for (const servicio of servicios) {
        try {
          const instance = this.get(servicio);
          health.dependencies[servicio] = {
            status: instance ? 'healthy' : 'unhealthy',
            instance: !!instance
          };
        } catch (error) {
          health.dependencies[servicio] = {
            status: 'unhealthy',
            error: error.message
          };
        }
      }
      
      // Determinar estado general
      const hasUnhealthy = Object.values(health.dependencies)
        .some(dep => dep.status === 'unhealthy');
      
      if (hasUnhealthy) {
        health.status = 'unhealthy';
      }
      
    } catch (error) {
      health.status = 'unhealthy';
      health.error = error.message;
    }
    
    return health;
  }
  
  /**
   * Obtener información de debug del contenedor
   * @returns {Object} Información de debug
   */
  getDebugInfo() {
    return {
      registered_dependencies: this.getRegisteredDependencies(),
      singleton_instances: Array.from(this.singletons.entries())
        .map(([name, instance]) => ({
          name,
          instantiated: instance !== null,
          type: instance ? instance.constructor.name : null
        })),
      total_dependencies: this.dependencies.size,
      total_singletons: this.singletons.size
    };
  }
}

// Crear instancia global del contenedor
const container = new Container();

export default container;