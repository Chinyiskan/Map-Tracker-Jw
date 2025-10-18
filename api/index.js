// api/index.js
// Servidor simplificado para Vercel con APIs de base de datos restauradas

const express = require('express');
const cors = require('cors');
const path = require('path');

// Configuración de Supabase
const { createClient } = require('@supabase/supabase-js');

// Configurar cliente Supabase con SERVICE_ROLE_KEY para operaciones del backend
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Validación crítica de variables de entorno
if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    console.error('🚨 ERROR CRÍTICO: Variables de entorno de Supabase no configuradas');
    console.error('Variables faltantes:', {
        SUPABASE_URL: !supabaseUrl ? 'FALTANTE' : 'OK',
        SUPABASE_SERVICE_ROLE_KEY: !supabaseServiceKey ? 'FALTANTE' : 'OK',
        SUPABASE_ANON_KEY: !supabaseAnonKey ? 'FALTANTE' : 'OK'
    });
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const app = express();

// Configuración CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://map-tracker-jw.vercel.app',
    'https://map-tracker-jw-git-main.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Ruta de autenticación simplificada
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Validar credenciales
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (username === adminUsername && password === adminPassword) {
    res.json({ 
      success: true, 
      token: 'valid-token',
      message: 'Autenticación exitosa'
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Credenciales incorrectas' 
    });
  }
});

// Ruta de validación de token
app.post('/api/auth/validate', (req, res) => {
  const { token } = req.body;
  
  if (token === 'valid-token') {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false });
  }
});

// Endpoint de configuración para el frontend
app.get('/api/config', (req, res) => {
  res.json({
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: supabaseAnonKey
  });
});

// Rutas de debug para Vercel
app.get('/api/env-check', (req, res) => {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    ADMIN_USERNAME: process.env.ADMIN_USERNAME ? 'set' : 'not set',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'set' : 'not set',
    SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'using default',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'using default',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'set' : 'using default'
  };
  
  res.json({
    status: 'Environment check',
    variables: envVars,
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// RUTAS API DE BASE DE DATOS - REPORTES
// ==========================================

// GET /api/reportes - Obtener todos los reportes
app.get('/api/reportes', async (req, res) => {
  try {
    const { barrio, fecha_inicio, fecha_fin } = req.query;
    
    let query = supabase
      .from('reportes')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Aplicar filtros si existen
    if (barrio) {
      query = query.eq('barrio', barrio);
    }
    
    if (fecha_inicio && fecha_fin) {
      query = query
        .gte('fecha', fecha_inicio)
        .lte('fecha', fecha_fin);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Error al obtener reportes: ${error.message}`);
    }
    
    res.json({
      success: true,
      data: data || []
    });
  } catch (err) {
    console.error('❌ Error en GET /api/reportes:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener reportes',
      message: err.message
    });
  }
});

// POST /api/reportes - Crear nuevo reporte
app.post('/api/reportes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reportes')
      .insert([req.body])
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error al crear reporte: ${error.message}`);
    }
    
    res.json({
      success: true,
      data: data
    });
  } catch (err) {
    console.error('❌ Error en POST /api/reportes:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error al crear reporte',
      message: err.message
    });
  }
});

// PUT /api/reportes/:id - Actualizar reporte
app.put('/api/reportes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('reportes')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error al actualizar reporte: ${error.message}`);
    }
    
    res.json({
      success: true,
      data: data
    });
  } catch (err) {
    console.error('❌ Error en PUT /api/reportes:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar reporte',
      message: err.message
    });
  }
});

// DELETE /api/reportes/:id - Eliminar reporte
app.delete('/api/reportes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('reportes')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Error al eliminar reporte: ${error.message}`);
    }
    
    res.json({
      success: true,
      message: 'Reporte eliminado correctamente'
    });
  } catch (err) {
    console.error('❌ Error en DELETE /api/reportes:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar reporte',
      message: err.message
    });
  }
});

// ==========================================
// RUTAS API DE BASE DE DATOS - SALIDAS
// ==========================================

// GET /api/salidas - Obtener todas las salidas
app.get('/api/salidas', async (req, res) => {
  try {
    const { capitan_id, barrio_asignado, dia_semana } = req.query;
    
    let query = supabase
      .from('salidas_predicacion')
      .select(`
        *,
        capitanes (
          id,
          nombre,
          apellido,
          telefono
        )
      `)
      .order('created_at', { ascending: false });
    
    // Aplicar filtros si existen
    if (capitan_id) {
      query = query.eq('capitan_id', capitan_id);
    }
    
    if (barrio_asignado) {
      query = query.eq('barrio_asignado', barrio_asignado);
    }
    
    if (dia_semana) {
      query = query.eq('dia_semana', dia_semana);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Error al obtener salidas: ${error.message}`);
    }
    
    res.json({
      success: true,
      data: data || []
    });
  } catch (err) {
    console.error('❌ Error en GET /api/salidas:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener salidas',
      message: err.message
    });
  }
});

// POST /api/salidas - Crear nueva salida
app.post('/api/salidas', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('salidas_predicacion')
      .insert([req.body])
      .select(`
        *,
        capitanes (
          id,
          nombre,
          apellido,
          telefono
        )
      `)
      .single();
    
    if (error) {
      throw new Error(`Error al crear salida: ${error.message}`);
    }
    
    res.json({
      success: true,
      data: data
    });
  } catch (err) {
    console.error('❌ Error en POST /api/salidas:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error al crear salida',
      message: err.message
    });
  }
});

// PUT /api/salidas/:id - Actualizar salida
app.put('/api/salidas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('salidas_predicacion')
      .update(req.body)
      .eq('id', id)
      .select(`
        *,
        capitanes (
          id,
          nombre,
          apellido,
          telefono
        )
      `)
      .single();
    
    if (error) {
      throw new Error(`Error al actualizar salida: ${error.message}`);
    }
    
    res.json({
      success: true,
      data: data
    });
  } catch (err) {
    console.error('❌ Error en PUT /api/salidas:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar salida',
      message: err.message
    });
  }
});

// DELETE /api/salidas/:id - Eliminar salida
app.delete('/api/salidas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('salidas_predicacion')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Error al eliminar salida: ${error.message}`);
    }
    
    res.json({
      success: true,
      message: 'Salida eliminada correctamente'
    });
  } catch (err) {
    console.error('❌ Error en DELETE /api/salidas:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar salida',
      message: err.message
    });
  }
});

// ==========================================
// RUTAS API DE BASE DE DATOS - CAPITANES
// ==========================================

// GET /api/capitanes - Obtener todos los capitanes
app.get('/api/capitanes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('capitanes')
      .select('*')
      .order('nombre', { ascending: true });
    
    if (error) {
      throw new Error(`Error al obtener capitanes: ${error.message}`);
    }
    
    res.json({
      success: true,
      data: data || []
    });
  } catch (err) {
    console.error('❌ Error en GET /api/capitanes:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener capitanes',
      message: err.message
    });
  }
});

// POST /api/capitanes - Crear nuevo capitán
app.post('/api/capitanes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('capitanes')
      .insert([req.body])
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error al crear capitán: ${error.message}`);
    }
    
    res.json({
      success: true,
      data: data
    });
  } catch (err) {
    console.error('❌ Error en POST /api/capitanes:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error al crear capitán',
      message: err.message
    });
  }
});

// PUT /api/capitanes/:id - Actualizar capitán
app.put('/api/capitanes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('capitanes')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error al actualizar capitán: ${error.message}`);
    }
    
    res.json({
      success: true,
      data: data
    });
  } catch (err) {
    console.error('❌ Error en PUT /api/capitanes:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar capitán',
      message: err.message
    });
  }
});

// DELETE /api/capitanes/:id - Eliminar capitán
app.delete('/api/capitanes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('capitanes')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Error al eliminar capitán: ${error.message}`);
    }
    
    res.json({
      success: true,
      message: 'Capitán eliminado correctamente'
    });
  } catch (err) {
    console.error('❌ Error en DELETE /api/capitanes:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar capitán',
      message: err.message
    });
  }
});

// ==========================================
// RUTAS API ADICIONALES
// ==========================================

// GET /api/progreso - Obtener progreso general
app.get('/api/progreso', async (req, res) => {
  try {
    const [reportes, salidas, capitanes] = await Promise.all([
      supabase.from('reportes').select('count', { count: 'exact', head: true }),
      supabase.from('salidas_predicacion').select('count', { count: 'exact', head: true }),
      supabase.from('capitanes').select('count', { count: 'exact', head: true })
    ]);
    
    const estadisticas = {
      totalReportes: reportes.count || 0,
      totalSalidas: salidas.count || 0,
      totalCapitanes: capitanes.count || 0
    };
    
    res.json({
      success: true,
      data: estadisticas
    });
  } catch (err) {
    console.error('❌ Error en GET /api/progreso:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener progreso',
      message: err.message
    });
  }
});

// GET /api/barrios - Obtener lista de barrios únicos
app.get('/api/barrios', async (req, res) => {
  try {
    // Obtener barrios únicos de reportes y salidas
    const [reportesBarrios, salidasBarrios] = await Promise.all([
      supabase.from('reportes').select('barrio').not('barrio', 'is', null),
      supabase.from('salidas_predicacion').select('barrio_asignado').not('barrio_asignado', 'is', null)
    ]);
    
    const barriosSet = new Set();
    
    // Agregar barrios de reportes
    if (reportesBarrios.data) {
      reportesBarrios.data.forEach(item => {
        if (item.barrio) barriosSet.add(item.barrio);
      });
    }
    
    // Agregar barrios de salidas
    if (salidasBarrios.data) {
      salidasBarrios.data.forEach(item => {
        if (item.barrio_asignado) barriosSet.add(item.barrio_asignado);
      });
    }
    
    const barrios = Array.from(barriosSet).sort();
    
    res.json({
      success: true,
      data: barrios
    });
  } catch (err) {
    console.error('❌ Error en GET /api/barrios:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener barrios',
      message: err.message
    });
  }
});

// Manejo de errores
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Exportar para Vercel
module.exports = app;