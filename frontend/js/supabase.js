// js/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Configuración de Supabase para el frontend (navegador)
// IMPORTANTE: Estas variables deben ser configuradas en el servidor o mediante variables de entorno
// Para desarrollo local, crear un archivo .env con estas variables
const SUPABASE_URL = window.SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'tu-anon-key-aqui';

// Validar que las variables estén configuradas
if (!SUPABASE_URL || SUPABASE_URL === 'https://tu-proyecto.supabase.co') {
  console.error('⚠️ SUPABASE_URL no está configurado correctamente');
}

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'tu-anon-key-aqui') {
  console.error('⚠️ SUPABASE_ANON_KEY no está configurado correctamente');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exportar constantes para uso en otros módulos
export { SUPABASE_URL, SUPABASE_ANON_KEY };