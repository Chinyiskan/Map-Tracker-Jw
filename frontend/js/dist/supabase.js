// js/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
// Variables globales para la configuración
let SUPABASE_URL = null;
let SUPABASE_ANON_KEY = null;
let supabase = null;
// Función para obtener la configuración desde el backend
async function loadSupabaseConfig() {
    try {
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error(`Error al obtener configuración: ${response.status}`);
        }
        const config = await response.json();
        SUPABASE_URL = config.SUPABASE_URL;
        SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY;
        // Validar que las variables estén configuradas
        if (!SUPABASE_URL) {
            throw new Error('SUPABASE_URL no está configurado en el backend');
        }
        if (!SUPABASE_ANON_KEY) {
            throw new Error('SUPABASE_ANON_KEY no está configurado en el backend');
        }
        // Crear cliente Supabase
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Configuración de Supabase cargada correctamente');
        return supabase;
    }
    catch (error) {
        console.error('❌ Error al cargar configuración de Supabase:', error);
        // Fallback a configuración por defecto si falla
        SUPABASE_URL = 'https://sornquimztfbrcxwjirl.supabase.co';
        SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcm5xdWltenRmYnJjeHdqaXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTM5NDgsImV4cCI6MjA2ODY2OTk0OH0.XjvHo7-QnN1i3lt6PSnUig-2RMD7Jt7XtnT8yzEMQYw';
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('⚠️ Usando configuración de fallback para Supabase');
        return supabase;
    }
}
// Función para obtener el cliente Supabase (lazy loading)
async function getSupabaseClient() {
    if (!supabase) {
        await loadSupabaseConfig();
    }
    return supabase;
}
// Inicializar configuración inmediatamente
const supabasePromise = loadSupabaseConfig();
// Exportar cliente y funciones
export { getSupabaseClient, supabasePromise };
// Exportar cliente directamente (se inicializa de forma asíncrona)
export { supabase };
// Exportar constantes para uso en otros módulos
export { SUPABASE_URL, SUPABASE_ANON_KEY };
//# sourceMappingURL=supabase.js.map