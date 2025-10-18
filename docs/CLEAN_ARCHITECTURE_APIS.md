# 📚 **DOCUMENTACIÓN DE APIs - CLEAN ARCHITECTURE**

## 🎯 **RESUMEN EJECUTIVO**

**Map Tracker JW** ha sido migrado exitosamente a **Clean Architecture** con un sistema automático de gestión de ciclos. Las nuevas APIs proporcionan funcionalidades avanzadas de tracking territorial con gestión automática de progreso y ciclos.

---

## 🏗️ **ARQUITECTURA IMPLEMENTADA**

### **Capas de Clean Architecture:**

```
📁 backend/
├── 🎯 domain/
│   ├── entities/          # Entidades de negocio
│   └── usecases/          # Casos de uso
├── 🔧 application/
│   └── services/          # Servicios de aplicación
└── 🌐 infrastructure/
    ├── database/
    │   └── repositories/   # Acceso a datos
    ├── web/
    │   ├── controllers/    # Controladores HTTP
    │   └── routes/         # Rutas de API
    └── container.js       # Inyección de dependencias
```

### **Principios Implementados:**
- ✅ **Separación de responsabilidades**
- ✅ **Inversión de dependencias**
- ✅ **Inyección de dependencias**
- ✅ **Casos de uso bien definidos**
- ✅ **Entidades de dominio puras**

---

## 🚀 **NUEVAS APIs DISPONIBLES**

### **🔌 Base URL:** `http://localhost:3002/api`

---

## 📊 **MÓDULO DE REPORTES**

### **POST /reportes**
**Crear nuevo reporte con gestión automática de ciclos**

```json
{
  "nombre_capitan": "Juan Pérez",
  "fecha": "2025-01-15",
  "barrio": "Zulima",
  "manzanas": "Z-174,Z-175,Z-176",
  "observaciones": "Trabajo completado sin inconvenientes"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "reporte": {
      "id": "uuid-reporte",
      "nombre_capitan": "Juan Pérez",
      "fecha": "2025-01-15",
      "barrio": "Zulima",
      "manzanas": "Z-174,Z-175,Z-176",
      "created_at": "2025-01-15T10:30:00Z"
    },
    "ciclo": {
      "id": "uuid-ciclo",
      "barrio": "Zulima",
      "numero_ciclo": 3,
      "estado": "activo",
      "progreso_porcentaje": 45.2,
      "territorios_completados": 28,
      "total_territorios": 62
    },
    "progreso": {
      "territorios_registrados": 3,
      "territorios_nuevos": 2,
      "territorios_duplicados": 1
    }
  },
  "message": "Reporte creado exitosamente"
}
```

### **GET /reportes/barrio/{barrio}**
**Obtener reportes por barrio**

**Parámetros de consulta:**
- `limite`: Número máximo de reportes (default: 100)
- `orden`: `asc` o `desc` (default: desc)
- `fechaDesde`: Fecha inicio (YYYY-MM-DD)
- `fechaHasta`: Fecha fin (YYYY-MM-DD)

**Ejemplo:** `GET /reportes/barrio/Zulima?limite=50&fechaDesde=2025-01-01`

### **GET /reportes/capitan/{nombre}**
**Obtener reportes por capitán**

### **GET /reportes/estadisticas**
**Obtener estadísticas de reportes**

### **POST /reportes/validar**
**Validar datos de reporte antes de envío**

---

## 🔄 **MÓDULO DE CICLOS**

### **GET /ciclos/health**
**Health check del servicio de ciclos**

```json
{
  "success": true,
  "status": "healthy",
  "service": "CicloService",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "service_available": true,
    "total_ciclos_activos": 12
  }
}
```

### **GET /ciclos/barrio/{barrio}/activo**
**Obtener ciclo activo de un barrio**

```json
{
  "success": true,
  "data": {
    "id": "uuid-ciclo",
    "barrio": "Zulima",
    "numero_ciclo": 3,
    "estado": "activo",
    "fecha_inicio": "2025-01-01",
    "progreso_porcentaje": 45.2,
    "territorios_completados": 28,
    "total_territorios": 62,
    "dias_transcurridos": 15,
    "velocidad_promedio": 1.87,
    "fecha_estimada_finalizacion": "2025-02-15"
  }
}
```

### **GET /ciclos/barrio/{barrio}/progreso**
**Obtener progreso detallado de un barrio**

### **GET /ciclos/progreso**
**Obtener progreso de todos los barrios**

### **GET /ciclos/activos**
**Obtener todos los ciclos activos**

### **POST /ciclos/barrio/{barrio}**
**Crear nuevo ciclo para un barrio**

### **PUT /ciclos/{id}/completar**
**Completar ciclo manualmente**

### **PUT /ciclos/{id}/pausar**
**Pausar ciclo**

### **PUT /ciclos/{id}/reactivar**
**Reactivar ciclo pausado**

### **GET /ciclos/estadisticas/generales**
**Obtener estadísticas generales del sistema**

---

## 🎯 **FUNCIONALIDADES AUTOMÁTICAS**

### **🔄 Gestión Automática de Ciclos:**

1. **Creación Automática:**
   - Al crear el primer reporte de un barrio, se crea automáticamente un ciclo
   - Numeración secuencial automática (Ciclo 1, 2, 3...)

2. **Cálculo de Progreso:**
   - Porcentaje de completación en tiempo real
   - Velocidad promedio de trabajo
   - Estimación de fecha de finalización

3. **Completado Automático:**
   - Al alcanzar 100% de territorios, el ciclo se completa automáticamente
   - Se crea automáticamente el siguiente ciclo

4. **Prevención de Duplicados:**
   - Verificación automática de territorios ya trabajados en el ciclo actual
   - Alertas de territorios duplicados

### **📊 Métricas Avanzadas:**

- **Progreso por Barrio:** Seguimiento individual de cada barrio
- **Velocidad de Trabajo:** Territorios por día
- **Tendencias:** Análisis de patrones de trabajo
- **Estimaciones:** Fechas proyectadas de finalización

---

## 🔧 **INTEGRACIÓN CON FRONTEND**

### **Cambios Implementados:**

1. **mapas.js:**
   - ✅ Eliminado campo `estado` del formulario
   - ✅ Integración con `/api/reportes/barrio/{barrio}`
   - ✅ Carga automática de ciclo activo
   - ✅ Visualización de progreso en tiempo real

2. **mapa_reporte.js:**
   - ✅ Eliminada lógica de detección de estados
   - ✅ Simplificado flujo de envío de reportes
   - ✅ Parámetros de URL actualizados

3. **reportes.js:**
   - ✅ Actualizado para usar nuevos endpoints
   - ✅ Manejo de filtros mejorado
   - ✅ Compatibilidad con Clean Architecture

### **Flujo de Usuario Actualizado:**

```
1. Usuario completa formulario (sin estado) → reportes.html
2. Selecciona territorios en mapa → mapa.html
3. Sistema crea reporte automáticamente → Backend Clean Architecture
4. Backend gestiona ciclo automáticamente → Sin intervención manual
5. Usuario ve progreso actualizado → Tiempo real
```

---

## 🏥 **HEALTH CHECKS Y MONITOREO**

### **GET /api/health**
**Health check general del sistema**

```json
{
  "status": "OK",
  "timestamp": "2025-01-15T10:30:00Z",
  "database": "Connected",
  "container": {
    "status": "healthy",
    "dependencies": {
      "supabase": { "status": "healthy" },
      "reporteRepository": { "status": "healthy", "instance": true },
      "cicloRepository": { "status": "healthy", "instance": true },
      "progresoRepository": { "status": "healthy", "instance": true },
      "reporteService": { "status": "healthy", "instance": true },
      "cicloService": { "status": "healthy", "instance": true },
      "progresoService": { "status": "healthy", "instance": true }
    }
  },
  "environment": "development",
  "version": "2.0.0",
  "architecture": "Clean Architecture"
}
```

---

## 🔒 **SEGURIDAD Y VALIDACIONES**

### **Validaciones Implementadas:**

1. **Entidades de Dominio:**
   - ✅ Validación de campos requeridos
   - ✅ Validación de tipos de datos
   - ✅ Normalización de datos
   - ✅ Validación de formatos (fechas, UUIDs)

2. **Casos de Uso:**
   - ✅ Validaciones de negocio
   - ✅ Verificación de barrios válidos
   - ✅ Prevención de duplicados
   - ✅ Validación de capitanes

3. **Controladores HTTP:**
   - ✅ Validación de parámetros
   - ✅ Manejo de errores estructurado
   - ✅ Respuestas consistentes
   - ✅ Logging detallado

---

## 📈 **PERFORMANCE Y OPTIMIZACIÓN**

### **Optimizaciones Implementadas:**

1. **Inyección de Dependencias:**
   - Patrón Singleton para repositorios
   - Reutilización de conexiones
   - Gestión eficiente de memoria

2. **Consultas Optimizadas:**
   - Índices en campos frecuentemente consultados
   - Consultas específicas por barrio
   - Paginación automática

3. **Caché y Estado:**
   - Estado en memoria para datos frecuentes
   - Invalidación automática de caché
   - Consultas incrementales

---

## 🚨 **MANEJO DE ERRORES**

### **Estructura de Respuestas de Error:**

```json
{
  "success": false,
  "error": "Descripción del error",
  "message": "Mensaje amigable para el usuario",
  "timestamp": "2025-01-15T10:30:00Z",
  "details": {
    "field": "campo_con_error",
    "code": "VALIDATION_ERROR"
  }
}
```

### **Códigos de Estado HTTP:**

- `200` - Operación exitosa
- `201` - Recurso creado exitosamente
- `400` - Error de validación o datos inválidos
- `404` - Recurso no encontrado
- `500` - Error interno del servidor

---

## 🔄 **MIGRACIÓN Y COMPATIBILIDAD**

### **Compatibilidad con Sistema Anterior:**

- ✅ **Datos existentes:** Totalmente compatible
- ✅ **URLs del frontend:** Mantenidas
- ✅ **Flujo de usuario:** Simplificado pero familiar
- ✅ **Funcionalidades:** Todas preservadas y mejoradas

### **Beneficios de la Migración:**

1. **Automatización:** Gestión automática de ciclos
2. **Precisión:** Eliminación de errores manuales
3. **Escalabilidad:** Arquitectura preparada para crecimiento
4. **Mantenibilidad:** Código más limpio y organizado
5. **Performance:** Consultas optimizadas
6. **Monitoreo:** Health checks en múltiples niveles

---

## 🛠️ **DESARROLLO Y TESTING**

### **Estructura de Tests:**

```
📁 tests/
├── unit/
│   └── entities/        # Tests de entidades
├── integration/         # Tests de APIs
└── setup.js            # Configuración global
```

### **Comandos de Testing:**

```bash
# Tests unitarios
npm run test:unit

# Tests de integración
npm run test:integration

# Cobertura de código
npm run test:coverage

# Todos los tests
npm test
```

---

## 📞 **SOPORTE Y CONTACTO**

### **Para Desarrolladores:**

- **Documentación técnica:** Este archivo
- **Health checks:** `/api/health` y `/api/ciclos/health`
- **Logs:** Consola del servidor con emojis descriptivos
- **Debug:** Variables de entorno de desarrollo

### **Para Usuarios:**

- **Interfaz simplificada:** Sin campos de estado manual
- **Feedback automático:** Notificaciones de progreso
- **Validaciones en tiempo real:** Prevención de errores
- **Visualización mejorada:** Progreso y métricas claras

---

## 🎉 **CONCLUSIÓN**

**Map Tracker JW** ahora cuenta con una arquitectura robusta, escalable y automatizada que:

- ✅ **Elimina errores manuales** en la gestión de ciclos
- ✅ **Automatiza el tracking** de progreso territorial
- ✅ **Proporciona métricas avanzadas** en tiempo real
- ✅ **Mantiene compatibilidad** con el sistema anterior
- ✅ **Facilita el mantenimiento** con Clean Architecture
- ✅ **Mejora la experiencia** del usuario final

**¡El sistema está listo para escalar y crecer con las necesidades del equipo!** 🚀

---

*Documentación generada el: 19 de Agosto, 2025*  
*Versión del sistema: 2.0.0*  
*Arquitectura: Clean Architecture*