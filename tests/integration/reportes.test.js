// tests/integration/reportes.test.js
// Tests de integración para el módulo de reportes

const request = require('supertest');
// Nota: Para CommonJS, necesitamos usar require dinámico para ES modules
let app, container;

beforeAll(async () => {
  // Importar módulos ES dinámicamente
  const appModule = await import('../../backend/app.js');
  const containerModule = await import('../../backend/infrastructure/container.js');
  
  app = appModule.default;
  container = containerModule.default;
  
  // Inicializar aplicación
  if (appModule.initializeApp) {
    await appModule.initializeApp();
  }
});

describe('Reportes API Integration Tests', () => {
  afterAll(async () => {
    // Limpiar singletons del contenedor
    if (container && container.clearSingletons) {
      container.clearSingletons();
    }
  });
  
  describe('POST /api/reportes', () => {
    test('debe crear un reporte válido', async () => {
      const nuevoReporte = {
        nombre_capitan: 'Test Captain',
        fecha: '2025-01-15',
        barrio: 'Zulima',
        manzanas: 'Z-174,Z-175',
        observaciones: 'Test de integración'
      };
      
      const response = await request(app)
        .post('/api/reportes')
        .send(nuevoReporte)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.reporte).toBeDefined();
      expect(response.body.data.ciclo).toBeDefined();
      expect(response.body.message).toBe('Reporte creado exitosamente');
    });
    
    test('debe fallar con datos inválidos', async () => {
      const reporteInvalido = {
        nombre_capitan: 'A', // Muy corto
        fecha: '2025-01-15',
        barrio: 'Zulima'
        // Falta manzanas
      };
      
      const response = await request(app)
        .post('/api/reportes')
        .send(reporteInvalido)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
    
    test('debe fallar con barrio inválido', async () => {
      const reporteInvalido = {
        nombre_capitan: 'Test Captain',
        fecha: '2025-01-15',
        barrio: 'Barrio Inexistente',
        manzanas: 'Z-174'
      };
      
      const response = await request(app)
        .post('/api/reportes')
        .send(reporteInvalido)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('no es válido');
    });
  });
  
  describe('GET /api/reportes/barrio/:barrio', () => {
    test('debe obtener reportes por barrio', async () => {
      const response = await request(app)
        .get('/api/reportes/barrio/Zulima')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.barrio).toBe('Zulima');
    });
    
    test('debe manejar barrio sin reportes', async () => {
      const response = await request(app)
        .get('/api/reportes/barrio/BarrioSinReportes')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });
  
  describe('GET /api/reportes/estadisticas', () => {
    test('debe obtener estadísticas de reportes', async () => {
      const response = await request(app)
        .get('/api/reportes/estadisticas')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(typeof response.body.data.total_reportes).toBe('number');
    });
  });
  
  describe('POST /api/reportes/validar', () => {
    test('debe validar datos correctos', async () => {
      const datosValidos = {
        nombre_capitan: 'Test Captain',
        fecha: '2025-01-15',
        barrio: 'Zulima',
        manzanas: 'Z-174,Z-175'
      };
      
      const response = await request(app)
        .post('/api/reportes/validar')
        .send(datosValidos)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.valido).toBe(true);
    });
    
    test('debe detectar datos inválidos', async () => {
      const datosInvalidos = {
        nombre_capitan: '', // Vacío
        fecha: 'fecha-invalida',
        barrio: 'Zulima',
        manzanas: 'Z-174'
      };
      
      const response = await request(app)
        .post('/api/reportes/validar')
        .send(datosInvalidos)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.valido).toBe(false);
      expect(response.body.data.error).toBeDefined();
    });
  });
});

describe('Ciclos API Integration Tests', () => {
  describe('GET /api/ciclos/health', () => {
    test('debe retornar estado saludable', async () => {
      const response = await request(app)
        .get('/api/ciclos/health')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('CicloService');
    });
  });
  
  describe('GET /api/ciclos/progreso', () => {
    test('debe obtener progreso de todos los barrios', async () => {
      const response = await request(app)
        .get('/api/ciclos/progreso')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
  
  describe('GET /api/ciclos/activos', () => {
    test('debe obtener ciclos activos', async () => {
      const response = await request(app)
        .get('/api/ciclos/activos')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
  
  describe('GET /api/ciclos/barrio/:barrio/activo', () => {
    test('debe obtener ciclo activo de un barrio', async () => {
      const response = await request(app)
        .get('/api/ciclos/barrio/Zulima/activo');
      
      // Puede ser 200 (ciclo encontrado) o 404 (no hay ciclo activo)
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.barrio).toBe('Zulima');
        expect(response.body.data.estado).toBe('activo');
      } else {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('No hay ciclo activo');
      }
    });
  });
  
  describe('GET /api/ciclos/estadisticas/generales', () => {
    test('debe obtener estadísticas generales', async () => {
      const response = await request(app)
        .get('/api/ciclos/estadisticas/generales')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.estadisticas).toBeDefined();
      expect(response.body.data.barrios).toBeDefined();
    });
  });
});

describe('Health Check Integration', () => {
  test('debe retornar estado saludable del sistema', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body.status).toBe('OK');
    expect(response.body.database).toBe('Connected');
    expect(response.body.container).toBeDefined();
    expect(response.body.container.status).toBe('healthy');
    expect(response.body.architecture).toBe('Clean Architecture');
    expect(response.body.version).toBe('2.0.0');
  });
});