// backend/config/db.js
// Configuración de base de datos para el backend

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Validar que las variables de entorno estén configuradas
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL no está configurada en las variables de entorno');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada en las variables de entorno');
}

// Configuración de Supabase para el backend (servidor)
// Usa SERVICE_ROLE_KEY para operaciones administrativas
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente de Supabase para el backend con permisos administrativos
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Configuración de la base de datos
export const dbConfig = {
  url: supabaseUrl,
  serviceKey: supabaseServiceKey,
  // Configuraciones adicionales
  options: {
    schema: 'public',
    headers: { 'x-my-custom-header': 'map-tracker-jw' },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
};

// Función para probar la conexión
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('reportes')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error al conectar con Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Conexión exitosa con Supabase');
    console.log(`📊 Tabla 'reportes' disponible`);
    return true;
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    return false;
  }
}

// Exportar por defecto el cliente de Supabase
export default supabase;