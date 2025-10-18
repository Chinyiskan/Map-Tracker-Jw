# 🚀 Configuración de Vercel para Producción

## 🔴 PROBLEMA CRÍTICO IDENTIFICADO

**Error en producción**: "Error de conexión. Intente nuevamente." en el login.

**Causa**: Las variables de entorno de autenticación no están configuradas en Vercel.

---

## 📋 Variables de Entorno Requeridas en Vercel

Para que la aplicación funcione correctamente en producción, **TODAS** estas variables deben estar configuradas en el panel de Vercel:

### 🔐 Autenticación (CRÍTICAS)
```
ADMIN_USERNAME=Admin
ADMIN_PASSWORD=Jw_1914
```

### 🗄️ Base de Datos
```
SUPABASE_URL=https://sornquimztfbrcxwjirl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcm5xdWltenRmYnJjeHdqaXJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5Mzk0OCwiZXhwIjoyMDY4NjY5OTQ4fQ.wRCnpSyB89wEXkKJgQc8_liS3AByfOCfUiEY1y8FIQQ
```

### 📧 Correo Electrónico
```
EMAIL_DESTINO=admin@empresa.com
EMAIL_USER=noreply@empresa.com
EMAIL_PASS=secure_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### 🌍 Entorno
```
NODE_ENV=production
```

---

## 🛠️ Guía Paso a Paso para Configurar Variables en Vercel

### Paso 1: Acceder al Panel de Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto "Map Tracker JW"

### Paso 2: Navegar a Configuración
1. En el dashboard del proyecto, haz clic en **"Settings"**
2. En el menú lateral, selecciona **"Environment Variables"**

### Paso 3: Agregar Variables de Entorno
Para cada variable de la lista anterior:

1. Haz clic en **"Add New"**
2. En **"Name"**, ingresa el nombre de la variable (ej: `ADMIN_USERNAME`)
3. En **"Value"**, ingresa el valor correspondiente (ej: `Admin`)
4. En **"Environment"**, selecciona:
   - ✅ **Production** (obligatorio)
   - ✅ **Preview** (recomendado)
   - ✅ **Development** (opcional)
5. Haz clic en **"Save"**

### Paso 4: Verificar Configuración
Después de agregar todas las variables, deberías ver:

```
✅ ADMIN_USERNAME
✅ ADMIN_PASSWORD
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
✅ EMAIL_DESTINO
✅ EMAIL_USER
✅ EMAIL_PASS
✅ SMTP_HOST
✅ SMTP_PORT
✅ NODE_ENV
```

### Paso 5: Redesplegar la Aplicación
1. Ve a la pestaña **"Deployments"**
2. Haz clic en **"Redeploy"** en el último deployment
3. Selecciona **"Use existing Build Cache"** ❌ (desmarcado)
4. Haz clic en **"Redeploy"**

---

## 🔍 Verificación Post-Despliegue

### 1. Verificar Variables de Entorno
Accede a tu aplicación en producción y verifica que las variables estén cargadas:
```
https://tu-app.vercel.app/api/health
```

### 2. Probar Login
1. Ve a: `https://tu-app.vercel.app/admin`
2. Ingresa las credenciales:
   - **Usuario**: `Admin`
   - **Contraseña**: `Jw_1914`
3. El login debería funcionar correctamente

---

## 🚨 Troubleshooting

### Error: "Error de conexión. Intente nuevamente."
**Causa**: Variables de entorno faltantes o incorrectas.

**Solución**:
1. Verifica que TODAS las variables estén configuradas en Vercel
2. Asegúrate de que los valores sean exactamente iguales a los del archivo `.env`
3. Redesplega la aplicación después de agregar variables

### Error: "Usuario o contraseña incorrectos"
**Causa**: Variables `ADMIN_USERNAME` o `ADMIN_PASSWORD` incorrectas.

**Solución**:
1. Verifica que `ADMIN_USERNAME=Admin` (con mayúscula)
2. Verifica que `ADMIN_PASSWORD=Jw_1914` (exactamente así)
3. Redesplega después de corregir

### Error: "Internal Server Error"
**Causa**: Variables de Supabase incorrectas.

**Solución**:
1. Verifica `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
2. Asegúrate de que no haya espacios extra
3. Verifica que la clave de servicio sea válida

---

## 📝 Checklist de Verificación

Antes de considerar el problema resuelto, verifica:

- [ ] Todas las 10 variables están configuradas en Vercel
- [ ] Los valores son exactamente iguales a los del archivo `.env`
- [ ] Las variables están habilitadas para "Production"
- [ ] Se realizó un redespliegue completo (sin caché)
- [ ] El login funciona en producción
- [ ] No hay errores en los logs de Vercel

---

## 🔗 Enlaces Útiles

- [Documentación de Variables de Entorno en Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
- [Panel de Vercel](https://vercel.com/dashboard)
- [Logs de Vercel](https://vercel.com/docs/concepts/observability/runtime-logs)

---

## ⚡ Solución Rápida

Si tienes prisa, copia y pega estas variables en Vercel:

```
ADMIN_USERNAME=Admin
ADMIN_PASSWORD=Jw_1914
SUPABASE_URL=https://sornquimztfbrcxwjirl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcm5xdWltenRmYnJjeHdqaXJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5Mzk0OCwiZXhwIjoyMDY4NjY5OTQ4fQ.wRCnpSyB89wEXkKJgQc8_liS3AByfOCfUiEY1y8FIQQ
EMAIL_DESTINO=admin@empresa.com
EMAIL_USER=noreply@empresa.com
EMAIL_PASS=secure_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
NODE_ENV=production
```

**¡Importante!** Después de agregar las variables, **SIEMPRE** redesplega la aplicación.

---

## 📋 Variables de Entorno Requeridas en Vercel

Para que la aplicación funcione correctamente en producción, **TODAS** estas variables deben estar configuradas en el panel de Vercel:

### 🔐 Autenticación (CRÍTICAS)
```
ADMIN_USERNAME=Admin
ADMIN_PASSWORD=Jw_1914
```

### 🗄️ Base de Datos
```
SUPABASE_URL=https://sornquimztfbrcxwjirl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcm5xdWltenRmYnJjeHdqaXJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5Mzk0OCwiZXhwIjoyMDY4NjY5OTQ4fQ.wRCnpSyB89wEXkKJgQc8_liS3AByfOCfUiEY1y8FIQQ
```

### 📧 Correo Electrónico
```
EMAIL_DESTINO=admin@empresa.com
EMAIL_USER=noreply@empresa.com
EMAIL_PASS=secure_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### 🌍 Entorno
```
NODE_ENV=production
```

---

## 🛠️ Guía Paso a Paso para Configurar Variables en Vercel

### Paso 1: Acceder al Panel de Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto "Map Tracker JW"

### Paso 2: Navegar a Configuración
1. En el dashboard del proyecto, haz clic en **"Settings"**
2. En el menú lateral, selecciona **"Environment Variables"**

### Paso 3: Agregar Variables de Entorno
Para cada variable de la lista anterior:

1. Haz clic en **"Add New"**
2. En **"Name"**, ingresa el nombre de la variable (ej: `ADMIN_USERNAME`)
3. En **"Value"**, ingresa el valor correspondiente (ej: `Admin`)
4. En **"Environment"**, selecciona:
   - ✅ **Production** (obligatorio)
   - ✅ **Preview** (recomendado)
   - ✅ **Development** (opcional)
5. Haz clic en **"Save"**

### Paso 4: Verificar Configuración
Después de agregar todas las variables, deberías ver:

```
✅ ADMIN_USERNAME
✅ ADMIN_PASSWORD
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
✅ EMAIL_DESTINO
✅ EMAIL_USER
✅ EMAIL_PASS
✅ SMTP_HOST
✅ SMTP_PORT
✅ NODE_ENV
```

### Paso 5: Redesplegar la Aplicación
1. Ve a la pestaña **"Deployments"**
2. Haz clic en **"Redeploy"** en el último deployment
3. Selecciona **"Use existing Build Cache"** ❌ (desmarcado)
4. Haz clic en **"Redeploy"**

---

## 🔍 Verificación Post-Despliegue

### 1. Verificar Variables de Entorno
Accede a tu aplicación en producción y verifica que las variables estén cargadas:
```
https://tu-app.vercel.app/api/health
```

### 2. Probar Login
1. Ve a: `https://tu-app.vercel.app/admin`
2. Ingresa las credenciales:
   - **Usuario**: `Admin`
   - **Contraseña**: `Jw_1914`
3. El login debería funcionar correctamente

---

## 🚨 Troubleshooting

### Error: "Error de conexión. Intente nuevamente."
**Causa**: Variables de entorno faltantes o incorrectas.

**Solución**:
1. Verifica que TODAS las variables estén configuradas en Vercel
2. Asegúrate de que los valores sean exactamente iguales a los del archivo `.env`
3. Redesplega la aplicación después de agregar variables

### Error: "Usuario o contraseña incorrectos"
**Causa**: Variables `ADMIN_USERNAME` o `ADMIN_PASSWORD` incorrectas.

**Solución**:
1. Verifica que `ADMIN_USERNAME=Admin` (con mayúscula)
2. Verifica que `ADMIN_PASSWORD=Jw_1914` (exactamente así)
3. Redesplega después de corregir

### Error: "Internal Server Error"
**Causa**: Variables de Supabase incorrectas.

**Solución**:
1. Verifica `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
2. Asegúrate de que no haya espacios extra
3. Verifica que la clave de servicio sea válida

---

## 📝 Checklist de Verificación

Antes de considerar el problema resuelto, verifica:

- [ ] Todas las 10 variables están configuradas en Vercel
- [ ] Los valores son exactamente iguales a los del archivo `.env`
- [ ] Las variables están habilitadas para "Production"
- [ ] Se realizó un redespliegue completo (sin caché)
- [ ] El login funciona en producción
- [ ] No hay errores en los logs de Vercel

---

## 🔗 Enlaces Útiles

- [Documentación de Variables de Entorno en Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
- [Panel de Vercel](https://vercel.com/dashboard)
- [Logs de Vercel](https://vercel.com/docs/concepts/observability/runtime-logs)

---

## ⚡ Solución Rápida

Si tienes prisa, copia y pega estas variables en Vercel:

```
ADMIN_USERNAME=Admin
ADMIN_PASSWORD=Jw_1914
SUPABASE_URL=https://sornquimztfbrcxwjirl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcm5xdWltenRmYnJjeHdqaXJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5Mzk0OCwiZXhwIjoyMDY4NjY5OTQ4fQ.wRCnpSyB89wEXkKJgQc8_liS3AByfOCfUiEY1y8FIQQ
EMAIL_DESTINO=admin@empresa.com
EMAIL_USER=noreply@empresa.com
EMAIL_PASS=secure_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
NODE_ENV=production
```

**¡Importante!** Después de agregar las variables, **SIEMPRE** redesplega la aplicación.