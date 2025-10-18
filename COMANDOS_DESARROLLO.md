# 🚀 Comandos de Desarrollo - Map Tracker JW

## 📋 Comandos Principales

### **Iniciar Servidor**

```bash
# Iniciar en puerto por defecto (3002)
npm start

# Auto-detectar puerto disponible
npm run dev:auto

# Modo desarrollo con auto-reload
npm run dev:watch
```

### **Puertos Específicos**

```bash
# Puertos predefinidos
npm run start:3000
npm run start:3001
npm run start:3002
npm run start:3003
npm run start:3004
npm run start:3005

# Puerto personalizado
npm run start:port 3007
npm run start:port 8080
```

### **Desarrollo con Nodemon**

```bash
# Desarrollo con auto-reload en puerto por defecto
npm run dev:watch

# Desarrollo en puertos específicos
npm run dev:3000
npm run dev:3001
npm run dev:3002
npm run dev:3003
```

---

## 🔧 Configuración de Puertos

### **Variables de Entorno**

```bash
# Configurar puerto específico
PORT=3005 npm start

# Configurar host específico
HOST=0.0.0.0 PORT=3000 npm start

# Modo desarrollo
NODE_ENV=development npm start
```

### **Archivo .env**

```env
# Agregar al archivo .env
PORT=3002
HOST=localhost
NODE_ENV=development
```

---

## 🌐 URLs Disponibles

Cuando el servidor esté ejecutándose, tendrás acceso a:

### **Frontend**
- 🏠 **Aplicación Principal:** `http://localhost:[puerto]`
- ⚙️ **Panel Admin:** `http://localhost:[puerto]/admin`
- 📊 **Reportes:** `http://localhost:[puerto]/reportes`
- 🗺️ **Mapa:** `http://localhost:[puerto]/mapa`

### **APIs**
- 🔌 **Health Check:** `http://localhost:[puerto]/api/health`
- 📊 **Métricas:** `http://localhost:[puerto]/api/metrics`
- 📋 **Reportes API:** `http://localhost:[puerto]/api/reportes`
- 👥 **Capitanes API:** `http://localhost:[puerto]/api/capitanes`
- 🔄 **Ciclos API:** `http://localhost:[puerto]/api/ciclos`
- 🚪 **Salidas API:** `http://localhost:[puerto]/api/salidas`
- 🔐 **Auth API:** `http://localhost:[puerto]/api/auth`

---

## 🧪 Testing

```bash
# Ejecutar todas las pruebas
npm test

# Pruebas en modo watch
npm run test:watch

# Pruebas con cobertura
npm run test:coverage

# Pruebas unitarias
npm run test:unit

# Pruebas de integración
npm run test:integration

# Pruebas verbosas
npm run test:verbose

# Pruebas con debugger
npm run test:debug
```

---

## 🔍 Debugging y Monitoreo

### **Verificar Base de Datos**

```bash
# Probar conexión a la base de datos
npm run test-db
```

### **Linting**

```bash
# Verificar código
npm run lint

# Corregir automáticamente
npm run lint:fix
```

### **Auditoría de Seguridad**

```bash
# Auditar dependencias
npm run audit

# Corregir vulnerabilidades
npm run audit-fix
```

---

## 🚨 Solución de Problemas

### **Puerto Ocupado**

```bash
# Si el puerto está ocupado, usa auto-detección
npm run dev:auto

# O especifica un puerto diferente
npm run start:port 3007
```

### **Verificar Puertos Disponibles**

El sistema automáticamente:
1. Intenta el puerto preferido (3002)
2. Busca en puertos alternativos (3000, 3001, 3003, 3004, 3005)
3. Busca en rango extendido (3006-3050)
4. Muestra error si no encuentra puertos disponibles

### **Logs del Servidor**

El servidor muestra información detallada:
- ✅ Puerto asignado (preferido o alternativo)
- 🌐 URLs disponibles
- 📋 APIs configuradas
- 🚀 Optimizaciones activas

---

## 📊 Métricas y Monitoreo

### **Endpoints de Métricas**

```bash
# Métricas completas del sistema
curl http://localhost:3002/api/metrics

# Health check
curl http://localhost:3002/api/metrics/health

# Métricas en formato Prometheus
curl http://localhost:3002/api/metrics/prometheus

# Información del sistema
curl http://localhost:3002/api/metrics/system
```

### **Reset de Métricas (Solo Desarrollo)**

```bash
# Reset de métricas (solo en NODE_ENV=development)
curl -X POST http://localhost:3002/api/metrics/reset
```

---

## 🎯 Optimizaciones Activas

El servidor incluye las siguientes optimizaciones:

- ✅ **Compresión Gzip:** Reduce ancho de banda 60-80%
- ✅ **Rate Limiting:** Protección contra abuso
- ✅ **Headers de Caché HTTP:** ETag, Last-Modified, Cache-Control
- ✅ **Sistema de Métricas:** Monitoreo en tiempo real
- ✅ **Bundle Optimization:** Lazy loading y code splitting
- ✅ **Caché Diferenciado:** TTL inteligente por tipo de dato
- ✅ **Índices SQL:** Consultas 50-80% más rápidas

---

## 💡 Consejos de Desarrollo

1. **Usa `npm run dev:auto`** para desarrollo diario
2. **Usa `npm run dev:watch`** para auto-reload
3. **Verifica métricas** en `/api/metrics/health`
4. **Monitorea logs** para detectar problemas
5. **Ejecuta tests** antes de commits
6. **Usa linting** para mantener calidad de código

---

## 🔧 Configuración Avanzada

### **Múltiples Instancias**

```bash
# Terminal 1
npm run start:3000

# Terminal 2
npm run start:3001

# Terminal 3
npm run start:3002
```

### **Configuración de Host**

```bash
# Acceso desde red local
HOST=0.0.0.0 npm start

# Solo localhost (más seguro)
HOST=127.0.0.1 npm start
```

### **Variables de Entorno Completas**

```env
# .env para desarrollo
PORT=3002
HOST=localhost
NODE_ENV=development

# Configuración de Supabase
SUPABASE_URL=tu_url_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_key

# Configuración de admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_password_seguro
```

¡Listo para desarrollar! 🚀