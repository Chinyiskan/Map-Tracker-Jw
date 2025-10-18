// jest.config.js
// Configuración de Jest con soporte ESM + TypeScript mediante babel-jest

export default {
  // Entorno de testing
  testEnvironment: 'node',

  // Timeout global para tests
  testTimeout: 15000,

  // Habilitar soporte experimental para ES Modules
  preset: null,

  // Transformación de JS/TS vía Babel
  transform: {
    '^.+\\.(js|ts)$': 'babel-jest'
  },

  // Tratar TS como ESM (JS ya se infiere por package.json "type": "module")
  extensionsToTreatAsEsm: ['.ts'],

  // Mapeo para imports ESM sin extensión duplicada
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },

  // Archivos de configuración
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Patrones de archivos de test
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.test.ts',
    '**/__tests__/**/*.js',
    '**/__tests__/**/*.ts'
  ],

  // Ignorar transformaciones para node_modules excepto ES modules
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],

  // Cobertura de código
  collectCoverageFrom: [
    'backend/**/*.js',
    'backend/**/*.ts',
    'frontend/js/**/*.js',
    '!backend/server.js',
    '!backend/config/**',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**'
  ],

  // Directorio de cobertura
  coverageDirectory: 'coverage',

  // Reportes de cobertura
  coverageReporters: ['text', 'lcov', 'html', 'json'],

  // Umbrales de cobertura
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Extensiones de archivos soportadas
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Verbose output
  verbose: true,

  // Limpieza/restauración de mocks
  clearMocks: true,
  restoreMocks: true
};