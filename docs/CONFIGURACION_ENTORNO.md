# Configuración de Variables de Entorno

## 📋 **RESUMEN**

Este documento describe la configuración de variables de entorno requeridas para el funcionamiento seguro del sistema Map Tracker JW.

---

## 🔧 **VARIABLES REQUERIDAS**

### **🗄️ Configuración de Supabase**

```bash
# URL de tu proyecto Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co

# Clave de servicio de Supabase (service_role)
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

**Dónde obtener:**
1. Accede a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a Settings > API
3. Copia la URL del proyecto
4. Copia la clave `service_role` (⚠️ **NUNCA** la clave `anon`)

### **👤 Configuración de Autenticación Admin**

```bash
# Credenciales del administrador
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_password_seguro
```

**Recomendaciones de seguridad:**
- Usa una contraseña fuerte (mínimo 12 caracteres)
- Incluye mayúsculas, minúsculas, números y símbolos
- No uses información personal

### **📧 Configuración de Correo Electrónico**

```bash
# Destinatario de reportes automáticos
EMAIL_DESTINO=admin@tuempresa.com

# Cuenta de correo para envío (remitente)
EMAIL_USER=noreply@tuempresa.com

# Contraseña o App Password del correo remitente
EMAIL_PASS=tu_app_password

# Servidor SMTP
SMTP_HOST=smtp.gmail.com

# Puerto SMTP
SMTP_PORT=587
```

**Configuración para Gmail:**
1. Habilita la verificación en 2 pasos
2. Genera una "Contraseña de aplicación"
3. Usa esa contraseña en `EMAIL_PASS`

**Configuración para otros proveedores:**
- **Outlook/Hotmail:** `smtp-mail.outlook.com:587`
- **Yahoo:** `smtp.mail.yahoo.com:587`
- **Custom SMTP:** Consulta la documentación de tu proveedor

---

## 📁 **CONFIGURACIÓN DEL ARCHIVO .env**

### **Ubicación**
El archivo `.env` debe estar en la raíz del proyecto:
```
Map Tracker Jw/
├── .env                 ← Aquí
├── backend/
├── frontend/
└── ...
```

### **Ejemplo Completo**
```bash
# Configuración de Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Configuración de autenticación admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_password_seguro

# Configuración de correo electrónico
EMAIL_DESTINO=admin@tu-dominio.com
EMAIL_USER=noreply@tu-dominio.com
EMAIL_PASSWORD=tu_app_password_aqui
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

---

## 🔒 **SEGURIDAD**

### **⚠️ IMPORTANTE**
- **NUNCA** subas el archivo `.env` al repositorio
- **NUNCA** compartas las credenciales por medios inseguros
- **SIEMPRE** usa contraseñas únicas y seguras
- **REVISA** regularmente el acceso a las cuentas

### **✅ Buenas Prácticas**
1. **Backup seguro:** Guarda una copia del `.env` en un lugar seguro
2. **Rotación de credenciales:** Cambia las contraseñas periódicamente
3. **Acceso limitado:** Solo el personal autorizado debe conocer las credenciales
4. **Monitoreo:** Revisa los logs de acceso regularmente

### **🚨 En caso de compromiso**
Si sospechas que las credenciales han sido comprometidas:

1. **Inmediatamente:**
   - Cambia todas las contraseñas
   - Revoca las claves de API
   - Genera nuevas credenciales

2. **Actualiza:**
   - El archivo `.env`
   - Las configuraciones en producción
   - Notifica al equipo

---

## 🧪 **VALIDACIÓN**

El sistema incluye validación automática de variables de entorno:

### **Al iniciar el servidor**
```bash
🔍 Validando variables de entorno...
✅ Todas las variables de entorno están configuradas correctamente
✅ Configuración de correo electrónico validada
✅ Configuración de Supabase validada

📋 Resumen de configuración del entorno:
   • Entorno: development
   • Supabase: ✅ Configurado
   • Correo: ✅ Configurado
   • Admin: ✅ Configurado
   • Variables: 10/10 configuradas
```

### **Errores comunes**

**Variable faltante:**
```bash
❌ Variables de entorno faltantes o vacías: EMAIL_PASS, SMTP_HOST
💡 Asegúrate de que todas las variables estén definidas en el archivo .env
```

**Formato inválido:**
```bash
❌ EMAIL_DESTINO tiene un formato inválido: admin@
❌ SMTP_PORT debe ser un número válido, recibido: abc
```

---

## 🚀 **DESPLIEGUE**

### **Desarrollo Local**
1. Copia el archivo `.env.example` (si existe)
2. Renómbralo a `.env`
3. Completa todas las variables
4. Ejecuta `npm start`

### **Producción**
1. **NO** uses el archivo `.env` en producción
2. Configura las variables en tu plataforma de hosting:
   - **Vercel:** Project Settings > Environment Variables
   - **Heroku:** Config Vars
   - **Railway:** Variables
   - **Netlify:** Site Settings > Environment Variables

### **Variables por Entorno**

| Variable | Desarrollo | Producción |
|----------|------------|------------|
| `SUPABASE_URL` | Proyecto de desarrollo | Proyecto de producción |
| `EMAIL_DESTINO` | Tu email personal | Email corporativo |
| `ADMIN_PASSWORD` | Contraseña simple | Contraseña compleja |

---

## 📞 **SOPORTE**

Si tienes problemas con la configuración:

1. **Revisa este documento** completamente
2. **Verifica** que todas las variables estén definidas
3. **Comprueba** los formatos y valores
4. **Consulta** los logs del servidor para errores específicos

### **Contacto**
- **Documentación técnica:** `/docs/`
- **Issues:** Repositorio del proyecto
- **Soporte:** Equipo de desarrollo

---

**Última actualización:** $(date)  
**Versión:** 1.0.0  
**Estado:** ✅ Implementado en Sprint 1