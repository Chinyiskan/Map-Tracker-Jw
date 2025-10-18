// tests/setup.js
// Configuración global para tests con soporte ES Modules

// Configurar variables de entorno para testing
// IMPORTANTE: Estos son valores ficticios solo para pruebas
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://fake-test-project.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-test-service-role-key-for-testing';
process.env.EMAIL_DESTINO = 'test-admin@fake-domain.com';
process.env.EMAIL_USER = 'test-sender@fake-domain.com';
process.env.EMAIL_PASSWORD = 'fake-test-password-123';
process.env.SMTP_HOST = 'smtp.fake-test-server.com';
process.env.SMTP_PORT = '587';
process.env.ADMIN_USERNAME = 'FakeTestAdmin';
process.env.ADMIN_PASSWORD = 'FakeTestPassword123!';

// Configuración para ES Modules
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Configurar timeout se hace en jest.config.js

// Mock de console para tests más limpios
const originalConsole = console;

beforeAll(() => {
  // Silenciar logs durante tests (opcional)
  if (process.env.SILENT_TESTS === 'true') {
    console.log = () => {};
    console.error = () => {};
    console.warn = () => {};
  }
});

afterAll(() => {
  // Restaurar console original
  if (process.env.SILENT_TESTS === 'true') {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  }
});

// Helpers globales para tests
global.createMockReporte = (overrides = {}) => {
  return {
    nombre_capitan: 'Test Captain',
    fecha: '2025-01-15',
    barrio: 'Zulima',
    manzanas: 'Z-174,Z-175',
    observaciones: null,
    salida_id: null,
    ...overrides
  };
};

global.createMockCiclo = (overrides = {}) => {
  return {
    barrio: 'Zulima',
    numero_ciclo: 1,
    fecha_inicio: '2025-01-01',
    fecha_fin: null,
    total_territorios: 52,
    territorios_completados: 0,
    progreso_porcentaje: 0.00,
    estado: 'activo',
    ...overrides
  };
};

global.createMockProgreso = (overrides = {}) => {
  return {
    ciclo_id: '123e4567-e89b-12d3-a456-426614174000',
    territorio: 'Z-174',
    fecha_trabajado: '2025-01-15',
    reporte_id: '123e4567-e89b-12d3-a456-426614174001',
    ...overrides
  };
};

// Mock de UUID para tests determinísticos
// Nota: Los mocks se configuran individualmente en cada test con ES Modules
const mockUuid = {
  v4: () => '123e4567-e89b-12d3-a456-426614174000'
};

// Los mocks globales no funcionan con ES Modules
// Se configuran individualmente en cada archivo de test

// Limpiar mocks después de cada test
afterEach(() => {
  // Limpieza se hace individualmente en cada test
});