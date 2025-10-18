# 🗺️ Map Tracker JW

<div align="center">

![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

**Sistema moderno de gestión territorial para Testigos de Jehová**

*Arquitectura limpia • Mapas interactivos • Gestión automática de ciclos*

[🚀 Demo en Vivo](https://map-tracker-jw.vercel.app) • [📖 Documentación](./docs/) • [🐛 Reportar Bug](https://github.com/Chinyiskan/Map-Tracker-Jw/issues)

</div>

---

## ✨ Características Principales

🗺️ **Mapas SVG Interactivos** - Visualización territorial con selección de manzanas  
🔄 **Gestión Automática de Ciclos** - Sistema inteligente de progreso territorial  
📊 **Panel de Administración** - Dashboard completo con métricas y reportes  
📱 **Diseño Responsive** - Optimizado para móviles y desktop  
🌙 **Modo Oscuro/Claro** - Interfaz adaptable a preferencias del usuario  
📈 **Métricas en Tiempo Real** - Monitoreo de rendimiento y uso  
🔐 **Autenticación Segura** - Sistema de login para administradores  
📄 **Exportación Excel** - Reportes descargables en múltiples formatos  
🚀 **Clean Architecture** - Código mantenible y escalable  
⚡ **Optimización Avanzada** - Caché inteligente y compresión automática  

---

## 🏗️ Arquitectura del Sistema

```
📁 Map Tracker JW/
├── 🎯 backend/                    # Backend con Clean Architecture
│   ├── domain/                    # Entidades y casos de uso
│   ├── application/               # Servicios de aplicación
│   ├── infrastructure/            # Implementaciones técnicas
│   └── server.js                  # Punto de entrada
├── 🌐 frontend/                   # Frontend vanilla moderno
│   ├── css/                       # Estilos con design system
│   ├── js/                        # JavaScript modular
│   └── mapas/                     # Mapas SVG por barrio
├── 🧪 tests/                      # Testing completo
│   ├── unit/                      # Pruebas unitarias
│   ├── integration/               # Pruebas de integración
│   └── performance/               # Pruebas de rendimiento
└── 📚 docs/                       # Documentación técnica
```

### 🔧 Stack Tecnológico

**Backend:**
- **Node.js** + **Express** - Servidor web robusto
- **Supabase** - Base de datos PostgreSQL en la nube
- **Clean Architecture** - Separación de responsabilidades
- **Winston** - Logging estructurado
- **Jest** - Testing framework

**Frontend:**
- **HTML5** + **CSS3** + **JavaScript ES6+** - Sin frameworks, máximo rendimiento
- **SVG Interactivos** - Mapas vectoriales escalables
- **Design System** - Componentes reutilizables
- **Progressive Enhancement** - Funcionalidad gradual

**DevOps:**
- **Vercel** - Deployment automático
- **GitHub Actions** - CI/CD pipeline
- **ESLint** - Linting de código
- **Nodemon** - Desarrollo con hot reload

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** >= 16.0.0
- **npm** >= 7.0.0
- Cuenta en **Supabase** (gratuita)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Chinyiskan/Map-Tracker-Jw.git
cd Map-Tracker-Jw
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Base de datos Supabase
SUPABASE_URL=tu_supabase_url
SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key

# Configuración del servidor
PORT=3002
HOST=localhost
NODE_ENV=development

# Autenticación de administrador
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_password_seguro
```

### 4. Configurar Base de Datos

Ejecuta el script SQL incluido en tu proyecto Supabase:

```bash
# El archivo SQL.txt contiene todas las tablas necesarias
# Cópialo y ejecútalo en el editor SQL de Supabase
```

### 5. Iniciar el Servidor

```bash
# Desarrollo con auto-reload
npm run dev:watch

# Producción
npm start

# Auto-detectar puerto disponible
npm run dev:auto
```

🎉 **¡Listo!** Abre http://localhost:3002 en tu navegador

---

## 📋 Comandos Disponibles

### 🔧 Desarrollo

```bash
npm run dev:watch          # Desarrollo con auto-reload
npm run dev:auto           # Auto-detectar puerto disponible
npm run start:3000         # Iniciar en puerto específico
npm run start:port 3005    # Puerto personalizado
```

### 🧪 Testing

```bash
npm test                   # Ejecutar todas las pruebas
npm run test:watch         # Pruebas en modo watch
npm run test:coverage      # Cobertura de código
npm run test:unit          # Solo pruebas unitarias
npm run test:integration   # Solo pruebas de integración
```

### 🔍 Calidad de Código

```bash
npm run lint               # Verificar código
npm run lint:fix           # Corregir automáticamente
npm run typecheck          # Verificar tipos TypeScript
npm run audit              # Auditoría de seguridad
```

### 🗄️ Base de Datos

```bash
npm run test-db            # Probar conexión a BD
```

---

## 🌐 APIs Disponibles

### 🔌 Base URL: `http://localhost:3002/api`

#### 📊 Reportes
```http
GET    /api/reportes                    # Listar reportes
POST   /api/reportes                    # Crear reporte
GET    /api/reportes/barrio/:barrio     # Reportes por barrio
```

#### 🔄 Ciclos
```http
GET    /api/ciclos/progreso             # Progreso general
GET    /api/ciclos/activos              # Ciclos activos
POST   /api/ciclos/barrio/:barrio       # Crear ciclo
PUT    /api/ciclos/:id/completar        # Completar ciclo
```

#### 🚪 Salidas
```http
GET    /api/salidas                     # Listar salidas
POST   /api/salidas                     # Crear salida
PUT    /api/salidas/:id                 # Actualizar salida
DELETE /api/salidas/:id                 # Eliminar salida
```

#### 👥 Capitanes
```http
GET    /api/capitanes                   # Listar capitanes
POST   /api/capitanes                   # Crear capitán
PUT    /api/capitanes/:id               # Actualizar capitán
DELETE /api/capitanes/:id               # Eliminar capitán
```

#### 📈 Métricas
```http
GET    /api/metrics                     # Métricas del sistema
GET    /api/metrics/health              # Health check
GET    /api/metrics/prometheus          # Formato Prometheus
```

#### 🔐 Autenticación
```http
POST   /api/auth/login                  # Login de administrador
```

---

## 🎯 Funcionalidades Principales

### 🗺️ Sistema de Mapas Interactivos

- **Mapas SVG vectoriales** por barrio
- **Selección de manzanas** con feedback visual
- **Zoom y pan** suaves
- **Responsive design** para móviles
- **Estados visuales** (trabajado, pendiente, completado)

### 🔄 Gestión Automática de Ciclos

- **Creación automática** de ciclos por barrio
- **Cálculo de progreso** en tiempo real
- **Finalización inteligente** de ciclos
- **Historial completo** de actividades

### 📊 Panel de Administración

- **Dashboard interactivo** con métricas
- **Gráficas de progreso** por barrio
- **Exportación a Excel** de reportes
- **Gestión de capitanes** y salidas
- **Filtros avanzados** de búsqueda

### 📱 Experiencia de Usuario

- **Interfaz intuitiva** y moderna
- **Modo oscuro/claro** automático
- **Navegación fluida** entre secciones
- **Feedback visual** en todas las acciones
- **Optimización móvil** completa

---

## 🧪 Testing

El proyecto incluye una suite completa de pruebas:

### 🔬 Pruebas Unitarias
- Entidades de dominio
- Casos de uso
- Servicios de aplicación
- Repositorios

### 🔗 Pruebas de Integración
- APIs completas
- Flujos de datos
- Interacciones entre módulos

### ⚡ Pruebas de Rendimiento
- Optimizaciones de caché
- Consultas SQL
- Carga de trabajo

```bash
# Ejecutar todas las pruebas
npm test

# Ver cobertura
npm run test:coverage

# Modo watch para desarrollo
npm run test:watch
```

---

## 🚀 Deployment

### Vercel (Recomendado)

1. **Fork** este repositorio
2. Conecta tu cuenta de **Vercel** con GitHub
3. Configura las **variables de entorno** en Vercel
4. **Deploy automático** en cada push

### Manual

```bash
# Build para producción
npm run build

# Iniciar en modo producción
NODE_ENV=production npm start
```

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Este proyecto sigue las mejores prácticas de desarrollo.

### 🔄 Proceso de Contribución

1. **Fork** el proyecto
2. Crea una **rama feature** (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. Abre un **Pull Request**

### 📋 Guías de Contribución

- **Código limpio** siguiendo Clean Architecture
- **Tests** para nuevas funcionalidades
- **Documentación** actualizada
- **Commits semánticos** (feat, fix, docs, etc.)
- **ESLint** sin errores

### 🐛 Reportar Bugs

Usa las [GitHub Issues](https://github.com/Chinyiskan/Map-Tracker-Jw/issues) con:
- **Descripción clara** del problema
- **Pasos para reproducir**
- **Comportamiento esperado**
- **Screenshots** si aplica

---

## 📚 Documentación

- 📖 [**Documentación Técnica**](./docs/DOCUMENTACION_TECNICA_BASE_DATOS.md)
- 🏗️ [**Clean Architecture APIs**](./docs/CLEAN_ARCHITECTURE_APIS.md)
- 🚀 [**Comandos de Desarrollo**](./COMANDOS_DESARROLLO.md)
- ⚡ [**Optimizaciones de Performance**](./docs/OPTIMIZACION_CONSULTAS_COMPLEJAS.md)
- 📊 [**Análisis del Sistema**](./docs/ANALISIS_EXHAUSTIVO_SISTEMA_POST_REFACTORIZACION.md)

---

## 🔧 Configuración Avanzada

### Variables de Entorno Completas

```env
# Base de datos
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Servidor
PORT=3002
HOST=localhost
NODE_ENV=development

# Autenticación
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_password_seguro

# Opcional: Configuraciones adicionales
CACHE_TTL=300
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

### Puertos Alternativos

El sistema automáticamente busca puertos disponibles:
1. Puerto preferido: **3002**
2. Puertos alternativos: **3000, 3001, 3003, 3004, 3005**
3. Rango extendido: **3006-3050**

---

## 📊 Métricas y Monitoreo

### Endpoints de Métricas

```bash
# Métricas completas
curl http://localhost:3002/api/metrics

# Health check
curl http://localhost:3002/api/metrics/health

# Formato Prometheus
curl http://localhost:3002/api/metrics/prometheus
```

### Optimizaciones Activas

- ✅ **Compresión Gzip** (60-80% reducción)
- ✅ **Rate Limiting** (protección contra abuso)
- ✅ **Caché HTTP** (ETag, Last-Modified)
- ✅ **Índices SQL** (50-80% más rápido)
- ✅ **Bundle Optimization** (lazy loading)

---

## 🏆 Roadmap

### 🎯 Próximas Funcionalidades

- [ ] **API GraphQL** para consultas flexibles
- [ ] **Notificaciones push** para móviles
- [ ] **Modo offline** con sincronización
- [ ] **Integración WhatsApp** para reportes
- [ ] **Dashboard analytics** avanzado
- [ ] **Multi-idioma** (i18n)
- [ ] **Tema personalizable** por congregación

### 🔄 Mejoras Continuas

- [ ] **Performance optimizations**
- [ ] **Accessibility improvements**
- [ ] **Mobile app** (React Native)
- [ ] **Desktop app** (Electron)

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

```
MIT License

Copyright (c) 2024 Map Tracker JW

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Agradecimientos

- **Comunidad de Testigos de Jehová** por la inspiración
- **Supabase** por la infraestructura de base de datos
- **Vercel** por el hosting gratuito
- **Contribuidores** que hacen posible este proyecto

---

## 📞 Contacto

- **GitHub Issues**: [Reportar problemas](https://github.com/Chinyiskan/Map-Tracker-Jw/issues)
- **Discussions**: [Conversaciones](https://github.com/Chinyiskan/Map-Tracker-Jw/discussions)
- **Email**: [Contacto directo](mailto:contact@maptrackerjw.com)

---

<div align="center">

**⭐ Si este proyecto te ayuda, considera darle una estrella en GitHub ⭐**

[🌟 Star en GitHub](https://github.com/Chinyiskan/Map-Tracker-Jw) • [🍴 Fork](https://github.com/Chinyiskan/Map-Tracker-Jw/fork) • [📢 Compartir](https://twitter.com/intent/tweet?text=Check%20out%20Map%20Tracker%20JW%20-%20Modern%20territorial%20management%20system&url=https://github.com/Chinyiskan/Map-Tracker-Jw)

</div>
