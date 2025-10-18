# 🔧 Troubleshooting - Problemas en Producción

## 🚨 Error de Login en Vercel

### Síntomas
- ✅ Login funciona perfectamente en desarrollo local
- ❌ Login falla en producción con "Error de conexión"
- 🌐 El error ocurre específicamente en Vercel

### Causa Principal
**Variables de entorno no configuradas en Vercel**

Las credenciales de administrador (`ADMIN_USERNAME` y `ADMIN_PASSWORD`) no están configuradas en el panel de Vercel.

### Solución Rápida

1. **Verificar el problema:**
   ```
   https://tu-app.vercel.app/api/env-check
   ```
   Este endpoint te mostrará qué variables faltan.

2. **Configurar variables en Vercel:**
   - Ve a [vercel.com](https://vercel.com) → tu proyecto
   - Settings → Environment Variables
   - Agrega las variables faltantes (ver lista abajo)
   - Redesplega la aplicación

3. **Variables críticas requeridas:**
   ```
   ADMIN_USERNAME=Admin
   ADMIN_PASSWORD=Jw_1914
   SUPABASE_URL=https://sornquimztfbrcxwjirl.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=[tu_clave_supabase]
   NODE_ENV=production
   ```

### Verificación Post-Solución

1. **Endpoint de verificación:**
   ```
   GET https://tu-app.vercel.app/api/env-check
   ```

2. **Respuesta esperada:**
   ```json
   {
     "status": "OK",
     "message": "Todas las variables de entorno están configuradas correctamente",
     "configuredVariables": 9,
     "missingVariables": []
   }
   ```

3. **Probar login:**
   ```
   https://tu-app.vercel.app/admin
   Usuario: Admin
   Contraseña: Jw_1914
   ```

---

## 🔍 Otros Problemas Comunes

### Error 500 en APIs

**Síntomas:**
- APIs devuelven error 500
- Logs muestran errores de conexión a base de datos

**Solución:**
1. Verificar variables de Supabase:
   ```
   SUPABASE_URL=https://sornquimztfbrcxwjirl.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=[clave_correcta]
   ```

2. Verificar que la clave de Supabase sea la **service_role_key**, no la anon key.

### Error de CORS

**Síntomas:**
- Errores de CORS en la consola del navegador
- Requests bloqueados por política de origen

**Solución:**
1. Verificar configuración en `vercel.json`
2. Asegurar que las rutas API estén correctamente configuradas
3. Verificar headers de CORS en el servidor

### Emails no se envían

**Síntomas:**
- Formularios se envían pero no llegan emails
- Error 500 en endpoints de email

**Solución:**
1. Configurar variables de email:
   ```
   EMAIL_DESTINO=admin@empresa.com
   EMAIL_USER=noreply@empresa.com
   EMAIL_PASS=secure_app_password
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   ```

2. Verificar que `EMAIL_PASS` sea una contraseña de aplicación, no la contraseña normal de Gmail.

---

## 🛠️ Herramientas de Diagnóstico

### Endpoints de Verificación

1. **Health Check:**
   ```
   GET /api/health
   ```

2. **Verificación de Variables:**
   ```
   GET /api/env-check
   ```

3. **Health Check Detallado:**
   ```
   GET /api/health/detailed
   ```

4. **Información del Sistema:**
   ```
   GET /api/info
   ```

### Logs en Vercel

1. Ve a tu proyecto en Vercel
2. Functions → Ver logs de las funciones
3. Busca errores relacionados con variables de entorno

### Debugging Local vs Producción

| Aspecto | Local | Producción |
|---------|-------|------------|
| Variables | `.env` file | Panel de Vercel |
| Logs | Terminal | Vercel Functions |
| Base de datos | Misma Supabase | Misma Supabase |
| Autenticación | Mismo usuario/pass | Debe configurarse en Vercel |

---

## 📞 Pasos de Escalación

### Nivel 1: Verificación Básica
1. ✅ Verificar `/api/env-check`
2. ✅ Confirmar variables en Vercel
3. ✅ Redesplegar aplicación

### Nivel 2: Verificación Avanzada
1. ✅ Revisar logs de Vercel Functions
2. ✅ Probar endpoints individualmente
3. ✅ Verificar configuración de `vercel.json`

### Nivel 3: Debugging Profundo
1. ✅ Revisar código de autenticación
2. ✅ Verificar middleware de seguridad
3. ✅ Analizar configuración de CORS

---

## 📚 Documentación Relacionada

- [Configuración de Vercel](./CONFIGURACION_VERCEL_PRODUCCION.md)
- [Configuración de Entorno](./CONFIGURACION_ENTORNO.md)
- [README Principal](../README.md)

---

## 🆘 Contacto de Soporte

Si después de seguir estos pasos el problema persiste:

1. **Recopilar información:**
   - URL del endpoint `/api/env-check`
   - Screenshots del error
   - Logs de Vercel Functions

2. **Verificar configuración:**
   - Variables de entorno en Vercel
   - Configuración de `vercel.json`
   - Estado de la base de datos Supabase

3. **Documentar el problema:**
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Información del entorno