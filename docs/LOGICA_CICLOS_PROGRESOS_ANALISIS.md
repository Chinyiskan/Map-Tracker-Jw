# Análisis de Lógica Existente de Ciclos y Progresos

## 📋 Documentación de la Lógica Actual del Div

### 🔍 **Ubicación del Componente Original:**
- **Archivo:** `frontend/js/mapas.js`
- **Métodos principales:** `_showBarrioProgress()` y `_showBarrioProgressCleanArchitecture()`
- **Contenedor HTML:** `<div id="barrio-progress" class="mb-sm"></div>` en `mapa.html`

### 🏗️ **Estructura de Datos Utilizada:**

```javascript
// Estado del componente
const state = {
  currentBarrio: 'Nombre del barrio',
  territories: [], // Array de territorios del barrio
  reportes: [], // Reportes del barrio
  cicloActivo: {
    numero_ciclo: 1,
    estado: 'activo',
    fecha_inicio: '2024-01-01'
  },
  territoryRealTimeStatus: new Map() // ID -> 'pendiente'|'trabajada'
};
```

### 📊 **Cálculo de Estadísticas:**

```javascript
// Método: _calculateTerritoryStats()
const stats = {
  trabajadas: 0, // Territorios trabajados
  total: territories.length, // Total de territorios
  progress: Math.round((trabajadas / total) * 100), // Porcentaje
  isComplete: progress === 100 // Estado de completitud
};
```

### 🎨 **Estructura Visual del Div:**

```html
<div class="barrio-progress" style="
  background: #ffffff;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
">
  <!-- Header con nombre y estadísticas -->
  <div class="flex justify-between items-center mb-xs">
    <span class="text-sm font-semibold text-primary">{barrio}</span>
    <span class="text-xs text-muted">{trabajadas}/{total} ({progress}%)</span>
  </div>
  
  <!-- Barra de progreso -->
  <div class="progress-bar" style="
    width: 100%;
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
  ">
    <div class="progress-fill" style="
      width: {progress}%;
      height: 100%;
      background: {progressColor};
      transition: width 0.3s ease;
    "></div>
  </div>
  
  <!-- Footer con ciclo y estado -->
  <div class="flex justify-between items-center mt-xs">
    <span class="text-xs text-muted">Ciclo {cicloNumero}</span>
    <span class="text-xs text-muted">
      {isComplete ? '🎉 ¡Completado!' : 'En progreso'}
    </span>
  </div>
</div>
```

### 🎯 **Lógica de Colores:**

```javascript
// Colores dinámicos basados en estado
const backgroundColor = '#ffffff';
const borderColor = '#e5e7eb';
const progressColor = isComplete ? '#10b981' : '#3b82f6';

// Estados:
// - Completado: Verde (#10b981)
// - En progreso: Azul (#3b82f6)
// - Pausado: Amarillo (#f59e0b)
// - Inactivo: Gris (#6b7280)
```

### 🔄 **Lógica de Ciclos:**

```javascript
// Información del ciclo activo
let cicloNumero = 1;
let estadoCiclo = 'activo';

if (cicloActivo) {
  cicloNumero = cicloActivo.numero_ciclo || 1;
  estadoCiclo = cicloActivo.estado || 'activo';
}

// Estados de ciclo:
// - 'activo': Ciclo en progreso
// - 'completado': Ciclo terminado
// - 'pausado': Ciclo pausado
// - 'sin_ciclo': Sin ciclo definido
```

### 📱 **Características Responsive:**

1. **Flexbox Layout:** Uso de `flex justify-between items-center`
2. **Espaciado Consistente:** `mb-xs`, `mt-xs` para márgenes
3. **Tipografía Escalable:** `text-sm`, `text-xs` para diferentes tamaños
4. **Colores Semánticos:** Uso de clases como `text-primary`, `text-muted`

### 🔧 **Funcionalidades Clave a Reutilizar:**

1. **Cálculo de Progreso:**
   ```javascript
   const progress = total > 0 ? Math.round((trabajadas / total) * 100) : 0;
   ```

2. **Detección de Completitud:**
   ```javascript
   const isComplete = progress === 100;
   ```

3. **Manejo de Estados:**
   ```javascript
   const estadoTexto = isComplete ? '🎉 ¡Completado!' : 'En progreso';
   ```

4. **Transiciones Suaves:**
   ```css
   transition: width 0.3s ease;
   ```

### 🎨 **Design System Utilizado:**

- **Espaciado:** Sistema de espacios consistente (`12px` padding)
- **Bordes:** `border-radius: 6px` para esquinas redondeadas
- **Sombras:** `box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1)`
- **Colores:** Paleta coherente con el design system de la app
- **Tipografía:** Font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

### 📊 **Datos de Entrada Requeridos:**

```javascript
// Datos mínimos necesarios para el componente
const datosRequeridos = {
  barrio: 'string', // Nombre del barrio
  territorios: {
    trabajadas: 'number', // Territorios completados
    total: 'number' // Total de territorios
  },
  ciclo: {
    numero: 'number', // Número del ciclo actual
    estado: 'string' // Estado del ciclo
  },
  progreso: 'number' // Porcentaje de progreso (0-100)
};
```

### 🔄 **Flujo de Actualización:**

1. **Obtener datos del barrio**
2. **Calcular estadísticas de progreso**
3. **Determinar estado del ciclo**
4. **Generar HTML dinámico**
5. **Aplicar estilos y transiciones**
6. **Insertar en el DOM**

### 🎯 **Objetivos para la Nueva Implementación:**

1. **Mantener la misma lógica de cálculos**
2. **Preservar la estética visual**
3. **Mejorar la arquitectura del código**
4. **Añadir responsividad mobile-first**
5. **Implementar en canvas para mejor rendimiento**
6. **Modularizar para reutilización**
7. **Añadir pruebas unitarias**
8. **Documentar completamente**

---

**Fecha de análisis:** $(date)
**Estado:** Documentación completa de la lógica existente
**Próximo paso:** Diseñar nueva arquitectura del componente