// js/auth.js
// Autenticación segura usando API del backend
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const errorDiv = document.getElementById('login-error');
    const submitBtn = form?.querySelector('button[type="submit"]');
    if (!form)
        return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const usuario = document.getElementById('usuario').value.trim();
        const password = document.getElementById('password').value;
        // Validación básica
        if (!usuario || !password) {
            mostrarError('Por favor complete todos los campos');
            return;
        }
        // Deshabilitar botón durante la petición
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M14 2A12 12 0 0 0 2 14" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur="1s" repeatCount="indefinite"/>
          </path>
        </svg>
        Verificando...
      `;
        }
        try {
            // Realizar petición de autenticación al backend
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: usuario,
                    password: password
                })
            });
            const data = await response.json();
            if (data.success) {
                // Autenticación exitosa
                sessionStorage.setItem('admin_token', data.token);
                sessionStorage.setItem('admin_logged', '1');
                // Redirigir al panel de administración
                window.location.href = 'admin.html';
            }
            else {
                // Credenciales incorrectas
                mostrarError(data.message || 'Usuario o contraseña incorrectos');
                limpiarFormulario();
            }
        }
        catch (error) {
            console.error('Error de autenticación:', error);
            mostrarError('Error de conexión. Intente nuevamente.');
            limpiarFormulario();
        }
        finally {
            // Rehabilitar botón
            if (submitBtn) {
                submitBtn.disabled = false;
                // Restaurar contenido original del botón con icono
                submitBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 17L15 12L10 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M15 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Ingresar
        `;
            }
        }
    });
    /**
     * Mostrar mensaje de error
     * @param {string} mensaje - Mensaje a mostrar
     */
    function mostrarError(mensaje) {
        if (errorDiv) {
            const messageElement = errorDiv.querySelector('.alert__message');
            if (messageElement) {
                messageElement.textContent = mensaje;
            }
            else {
                // Fallback para compatibilidad
                errorDiv.textContent = mensaje;
            }
            errorDiv.style.display = 'block';
        }
    }
    /**
     * Limpiar formulario después de error
     */
    function limpiarFormulario() {
        const passwordField = document.getElementById('password');
        if (passwordField) {
            passwordField.value = '';
            passwordField.focus();
        }
    }
});
//# sourceMappingURL=auth.js.map