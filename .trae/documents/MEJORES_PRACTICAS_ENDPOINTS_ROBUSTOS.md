# Mejores Prácticas para Endpoints Robustos - Map Tracker JW

## 1. Validación de Parámetros de Entrada

### 1.1 Validación de Parámetros de Ruta
```javascript
// ❌ Malo: Sin validación
app.get('/api/ciclos/barrio/:barrio/activo', async (req, res) => {
  const { barrio } = req.params;
  // Usar directamente sin validar
});

// ✅ Bueno: Con validación
app.get('/api/ciclos/barrio/:barrio/activo', async (req, res) => {
  const { barrio } = req.params;
  
  // Validar que el parámetro existe y no está vacío
  if (!barrio || barrio.trim() === '') {
    return res.status(400).json({
      error: 'Parámetro barrio es requerido',
      code: 'MISSING_BARRIO_PARAM'
    });
  }
  
  // Validar formato (solo letras, espacios y algunos caracteres especiales)
  const barrioRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.]+$/;
  if (!barrioRegex.test(barrio)) {
    return res.status(400).json({
      error: 'Formato de barrio inválido',
      code: 'INVALID_BARRIO_FORMAT'
    });
  }
});
```

### 1.2 Validación de Query Parameters
```javascript
// Función helper para validar parámetros
function validateQueryParams(req, res, next) {
  const { limit, offset, fecha_inicio, fecha_fin } = req.query;
  
  if (limit && (isNaN(limit) || limit < 1 || limit > 1000)) {
    return res.status(400).json({
      error: 'Límite debe ser un número entre 1 y 1000',
      code: 'INVALID_LIMIT'
    });
  }
  
  if (offset && (isNaN(offset) || offset < 0)) {
    return res.status(400).json({
      error: 'Offset debe ser un número mayor o igual a 0',
      code: 'INVALID_OFFSET'
    });
  }
  
  if (fecha_inicio && !isValidDate(fecha_inicio)) {
    return res.status(400).json({
      error: 'Formato de fecha_inicio inválido (YYYY-MM-DD)',
      code: 'INVALID_START_DATE'
    });
  }
  
  next();
}

function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}
```

## 2. Manejo de Errores Consistente

### 2.1 Estructura Estándar de Respuestas de Error
```javascript
// Estructura consistente para todos los errores
const ErrorResponse = {
  error: 'Mensaje descriptivo del error',
  code: 'ERROR_CODE_UNIQUE',
  timestamp: new Date().toISOString(),
  path: req.path,
  method: req.method,
  details: {} // Información adicional opcional
};

// Middleware global de manejo de errores
function globalErrorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);
  
  // Error de Supabase
  if (err.code && err.code.startsWith('PGRST')) {
    return res.status(500).json({
      error: 'Error en la base de datos',
      code: 'DATABASE_ERROR',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      details: { supabaseCode: err.code }
    });
  }
  
  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      details: err.details
    });
  }
  
  // Error genérico
  res.status(500).json({
    error: 'Error interno del servidor',
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
}
```

### 2.2 Try-Catch Consistente
```javascript
// Template para endpoints robustos
app.get('/api/ciclos/barrio/:barrio/activo', async (req, res) => {
  try {
    const { barrio } = req.params;
    
    // 1. Validación de entrada
    if (!barrio || barrio.trim() === '') {
      return res.status(400).json({
        error: 'Parámetro barrio es requerido',
        code: 'MISSING_BARRIO_PARAM',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
    
    // 2. Lógica de negocio
    const { data, error } = await supabase
      .from('ciclos')
      .select('*')
      .eq('barrio', barrio)
      .eq('activo', true)
      .single();
    
    // 3. Manejo de errores de Supabase
    if (error) {
      console.error(`[DB_ERROR] ${req.method} ${req.path}:`, error);
      return res.status(500).json({
        error: 'Error al consultar ciclo activo',
        code: 'DATABASE_QUERY_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
    
    // 4. Validación de resultado
    if (!data) {
      return res.status(404).json({
        error: `No se encontró ciclo activo para el barrio ${barrio}`,
        code: 'ACTIVE_CYCLE_NOT_FOUND',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
    
    // 5. Respuesta exitosa
    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`[UNEXPECTED_ERROR] ${req.method} ${req.path}:`, error);
    res.status(500).json({
      error: 'Error inesperado del servidor',
      code: 'UNEXPECTED_ERROR',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  }
});
```

## 3. Logging y Monitoreo

### 3.1 Sistema de Logging Estructurado
```javascript
// Logger configurado
const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'INFO',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  
  error: (message, error = null, meta = {}) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : null,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  
  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({
      level: 'WARN',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  }
};

// Middleware de logging de requests
function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
}
```

### 3.2 Métricas de Performance
```javascript
// Middleware para medir performance
function performanceMonitor(req, res, next) {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convertir a ms
    
    // Log si la request toma más de 1 segundo
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration.toFixed(2)}ms`
      });
    }
  });
  
  next();
}
```

## 4. Pruebas Automatizadas

### 4.1 Tests de Endpoints
```javascript
// tests/endpoints/ciclos.test.js
describe('Ciclos API Endpoints', () => {
  describe('GET /api/ciclos/barrio/:barrio/activo', () => {
    test('debe retornar ciclo activo para barrio válido', async () => {
      const response = await request(app)
        .get('/api/ciclos/barrio/Niza/activo')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('barrio', 'Niza');
    });
    
    test('debe retornar 400 para barrio vacío', async () => {
      const response = await request(app)
        .get('/api/ciclos/barrio/ /activo')
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'MISSING_BARRIO_PARAM');
    });
    
    test('debe retornar 404 para barrio inexistente', async () => {
      const response = await request(app)
        .get('/api/ciclos/barrio/BarrioInexistente/activo')
        .expect(404);
      
      expect(response.body).toHaveProperty('code', 'ACTIVE_CYCLE_NOT_FOUND');
    });
  });
});
```

### 4.2 Tests de Integración
```javascript
// tests/integration/endpoints-sync.test.js
describe('Sincronización Local-Producción', () => {
  test('todos los endpoints locales deben existir en api/index.js', async () => {
    const localRoutes = extractRoutesFromBackend();
    const vercelRoutes = extractRoutesFromVercelAPI();
    
    const missingRoutes = localRoutes.filter(route => 
      !vercelRoutes.includes(route)
    );
    
    expect(missingRoutes).toEqual([]);
  });
});
```

## 5. Sincronización entre Desarrollo Local y Producción

### 5.1 Script de Verificación de Endpoints
```javascript
// scripts/verify-endpoint-sync.js
const fs = require('fs');
const path = require('path');

function extractEndpointsFromBackend() {
  const routesDir = path.join(__dirname, '../backend/infrastructure/web/routes');
  const endpoints = [];
  
  // Leer todos los archivos de rutas
  const routeFiles = fs.readdirSync(routesDir);
  
  routeFiles.forEach(file => {
    const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
    const routeMatches = content.match(/router\.(get|post|put|delete)\(['"`]([^'"`]+)['"`]/g);
    
    if (routeMatches) {
      routeMatches.forEach(match => {
        const [, method, route] = match.match(/router\.(\w+)\(['"`]([^'"`]+)['"`]/);
        endpoints.push({ method: method.toUpperCase(), route });
      });
    }
  });
  
  return endpoints;
}

function extractEndpointsFromVercel() {
  const vercelFile = path.join(__dirname, '../api/index.js');
  const content = fs.readFileSync(vercelFile, 'utf8');
  const endpoints = [];
  
  const routeMatches = content.match(/app\.(get|post|put|delete)\(['"`]([^'"`]+)['"`]/g);
  
  if (routeMatches) {
    routeMatches.forEach(match => {
      const [, method, route] = match.match(/app\.(\w+)\(['"`]([^'"`]+)['"`]/);
      endpoints.push({ method: method.toUpperCase(), route });
    });
  }
  
  return endpoints;
}

function verifySync() {
  const backendEndpoints = extractEndpointsFromBackend();
  const vercelEndpoints = extractEndpointsFromVercel();
  
  const missing = backendEndpoints.filter(be => 
    !vercelEndpoints.some(ve => ve.method === be.method && ve.route === be.route)
  );
  
  if (missing.length > 0) {
    console.error('❌ Endpoints faltantes en Vercel:');
    missing.forEach(endpoint => {
      console.error(`  ${endpoint.method} ${endpoint.route}`);
    });
    process.exit(1);
  } else {
    console.log('✅ Todos los endpoints están sincronizados');
  }
}

verifySync();
```

### 5.2 Hook de Pre-commit
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run verify-endpoints && npm run test"
    }
  },
  "scripts": {
    "verify-endpoints": "node scripts/verify-endpoint-sync.js"
  }
}
```

## 6. Fallbacks y Recuperación de Errores

### 6.1 Circuit Breaker Pattern
```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }
  
  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

// Uso en endpoints
const dbCircuitBreaker = new CircuitBreaker(3, 30000);

app.get('/api/ciclos/barrio/:barrio/progreso', async (req, res) => {
  try {
    const result = await dbCircuitBreaker.execute(async () => {
      return await supabase
        .from('ciclos')
        .select('*')
        .eq('barrio', req.params.barrio);
    });
    
    res.json(result);
  } catch (error) {
    // Fallback a datos en caché o respuesta por defecto
    const fallbackData = await getCachedProgress(req.params.barrio);
    
    if (fallbackData) {
      res.json({
        data: fallbackData,
        warning: 'Datos desde caché debido a problemas temporales'
      });
    } else {
      res.status(503).json({
        error: 'Servicio temporalmente no disponible',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }
});
```

### 6.2 Retry Logic
```javascript
async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      logger.warn(`Intento ${attempt} falló, reintentando en ${delay}ms`, {
        error: error.message,
        attempt,
        maxRetries
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}

// Uso en endpoints
app.get('/api/reportes/barrio/:barrio', async (req, res) => {
  try {
    const data = await retryOperation(async () => {
      const { data, error } = await supabase
        .from('reportes')
        .select('*')
        .eq('barrio', req.params.barrio);
      
      if (error) throw error;
      return data;
    });
    
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error después de reintentos', error);
    res.status(500).json({
      error: 'Error al obtener reportes',
      code: 'REPORTS_FETCH_ERROR'
    });
  }
});
```

## 7. Documentación de APIs

### 7.1 Documentación OpenAPI/Swagger
```yaml
# docs/api-spec.yaml
openapi: 3.0.0
info:
  title: Map Tracker JW API
  version: 1.0.0
  description: API para gestión de territorios y reportes

paths:
  /api/ciclos/barrio/{barrio}/activo:
    get:
      summary: Obtener ciclo activo de un barrio
      parameters:
        - name: barrio
          in: path
          required: true
          schema:
            type: string
            pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.]+$'
          example: "Niza"
      responses:
        200:
          description: Ciclo activo encontrado
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    $ref: '#/components/schemas/Ciclo'
        400:
          description: Parámetro inválido
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        404:
          description: Ciclo no encontrado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

components:
  schemas:
    Ciclo:
      type: object
      properties:
        id:
          type: integer
        barrio:
          type: string
        numero_ciclo:
          type: integer
        activo:
          type: boolean
        fecha_inicio:
          type: string
          format: date
        fecha_fin:
          type: string
          format: date
    
    Error:
      type: object
      properties:
        error:
          type: string
        code:
          type: string
        timestamp:
          type: string
          format: date-time
        path:
          type: string
        method:
          type: string
```

### 7.2 Documentación en Código
```javascript
/**
 * @swagger
 * /api/ciclos/barrio/{barrio}/progreso:
 *   get:
 *     summary: Obtiene el progreso del ciclo activo de un barrio
 *     description: |
 *       Retorna información detallada del progreso del ciclo activo,
 *       incluyendo bloques trabajados, pendientes y estadísticas.
 *     parameters:
 *       - name: barrio
 *         in: path
 *         required: true
 *         description: Nombre del barrio
 *         schema:
 *           type: string
 *           example: "Niza"
 *     responses:
 *       200:
 *         description: Progreso obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     bloques_trabajados:
 *                       type: integer
 *                       example: 45
 *                     bloques_totales:
 *                       type: integer
 *                       example: 120
 *                     porcentaje:
 *                       type: number
 *                       example: 37.5
 *       400:
 *         description: Parámetro barrio inválido
 *       404:
 *         description: No se encontró ciclo activo para el barrio
 *       500:
 *         description: Error interno del servidor
 */
app.get('/api/ciclos/barrio/:barrio/progreso', async (req, res) => {
  // Implementación del endpoint
});
```

## 8. Versionado de Endpoints

### 8.1 Estrategia de Versionado
```javascript
// Versionado por URL
app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);

// Middleware de versionado
function apiVersioning(req, res, next) {
  const version = req.headers['api-version'] || 'v1';
  req.apiVersion = version;
  next();
}

// Endpoint con soporte multi-versión
app.get('/api/ciclos/barrio/:barrio/progreso', apiVersioning, async (req, res) => {
  try {
    if (req.apiVersion === 'v2') {
      // Lógica para v2 (con más detalles)
      const data = await getProgresoDetallado(req.params.barrio);
      res.json({ version: 'v2', data });
    } else {
      // Lógica para v1 (compatibilidad hacia atrás)
      const data = await getProgresoBasico(req.params.barrio);
      res.json({ version: 'v1', data });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
});
```

### 8.2 Deprecación Gradual
```javascript
// Middleware para endpoints deprecados
function deprecationWarning(version, deprecatedIn, removedIn) {
  return (req, res, next) => {
    res.set('Warning', `299 - "API version ${version} is deprecated. Deprecated in ${deprecatedIn}, will be removed in ${removedIn}"`);
    
    logger.warn('Deprecated endpoint accessed', {
      path: req.path,
      version,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    next();
  };
}

// Uso
app.get('/api/v1/ciclos/progreso', 
  deprecationWarning('v1', '2024-01-01', '2024-06-01'),
  async (req, res) => {
    // Lógica del endpoint deprecado
  }
);
```

## 9. Checklist de Implementación

### 9.1 Para Cada Nuevo Endpoint
- [ ] Validación de parámetros de entrada
- [ ] Manejo de errores con try-catch
- [ ] Logging estructurado
- [ ] Documentación OpenAPI
- [ ] Tests unitarios y de integración
- [ ] Implementación en backend local
- [ ] Implementación en api/index.js (Vercel)
- [ ] Verificación de sincronización

### 9.2 Para Despliegues
- [ ] Ejecutar script de verificación de endpoints
- [ ] Ejecutar tests completos
- [ ] Verificar variables de entorno
- [ ] Probar endpoints críticos en staging
- [ ] Monitorear logs después del despliegue

## 10. Herramientas de Monitoreo Recomendadas

### 10.1 Health Check Endpoint
```javascript
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    checks: {}
  };
  
  try {
    // Verificar conexión a Supabase
    const { data, error } = await supabase
      .from('ciclos')
      .select('count')
      .limit(1);
    
    health.checks.database = error ? 'error' : 'ok';
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'degraded';
  }
  
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

### 10.2 Métricas de Endpoints
```javascript
// Contador de requests por endpoint
const endpointMetrics = new Map();

function trackEndpointMetrics(req, res, next) {
  const key = `${req.method} ${req.route?.path || req.path}`;
  
  if (!endpointMetrics.has(key)) {
    endpointMetrics.set(key, {
      requests: 0,
      errors: 0,
      totalTime: 0,
      avgTime: 0
    });
  }
  
  const start = Date.now();
  const metrics = endpointMetrics.get(key);
  metrics.requests++;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.totalTime += duration;
    metrics.avgTime = metrics.totalTime / metrics.requests;
    
    if (res.statusCode >= 400) {
      metrics.errors++;
    }
  });
  
  next();
}

app.get('/api/metrics', (req, res) => {
  const metrics = Object.fromEntries(endpointMetrics);
  res.json(metrics);
});
```

Este documento proporciona una base sólida para crear endpoints robustos y evitar los errores que experimentamos. La clave está en la implementación consistente de estas prácticas en todos los endpoints del proyecto.