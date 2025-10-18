// backend/infrastructure/web/routes/diagnostico.js
// Rutas de diagnóstico para verificar configuración en producción

import express from 'express';

const router = express.Router();

/**
 * Endpoint de diagnóstico para verificar variables de entorno
 * IMPORTANTE: Solo para debugging temporal, remover en producción
 */
router.get('/env-check', (req, res) => {
  try {
    console.log('🔍 [DIAGNOSTICO] Verificando variables de entorno');
    
    const envStatus = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      hostname: req.hostname,
      url: req.originalUrl,
      variables: {
        SUPABASE_URL: process.env.SUPABASE_URL ? 'CONFIGURADA' : 'FALTANTE',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'CONFIGURADA' : 'FALTANTE',
        ADMIN_USERNAME: process.env.ADMIN_USERNAME ? 'CONFIGURADA' : 'FALTANTE',
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'CONFIGURADA' : 'FALTANTE',
        EMAIL_DESTINO: process.env.EMAIL_DESTINO ? 'CONFIGURADA' : 'FALTANTE',
        EMAIL_USER: process.env.EMAIL_USER ? 'CONFIGURADA' : 'FALTANTE',
        EMAIL_PASS: process.env.EMAIL_PASS ? 'CONFIGURADA' : 'FALTANTE',
        SMTP_HOST: process.env.SMTP_HOST ? 'CONFIGURADA' : 'FALTANTE',
        SMTP_PORT: process.env.SMTP_PORT ? 'CONFIGURADA' : 'FALTANTE'
      },
      supabase_url_preview: process.env.SUPABASE_URL ? 
        process.env.SUPABASE_URL.substring(0, 30) + '...' : 'NO CONFIGURADA',
      service_key_preview: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
        process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...' : 'NO CONFIGURADA'
    };
    
    console.log('🔍 [DIAGNOSTICO] Estado de variables:', envStatus);
    
    res.json({
      success: true,
      message: 'Diagnóstico de variables de entorno',
      data: envStatus
    });
    
  } catch (error) {
    console.error('❌ [DIAGNOSTICO] Error en verificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error en diagnóstico',
      error: error.message
    });
  }
});

/**
 * Endpoint de diagnóstico para probar conectividad con Supabase
 */
router.get('/supabase-test', async (req, res) => {
  try {
    console.log('🔍 [DIAGNOSTICO] Probando conectividad con Supabase');
    
    // Importar dinámicamente el cliente de Supabase
    const { createClient } = await import('@supabase/supabase-js');
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Variables de Supabase no configuradas',
        missing: {
          SUPABASE_URL: !process.env.SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY: !process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      });
    }
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Probar una consulta simple
    const { data, error } = await supabase
      .from('ciclos')
      .select('id, barrio')
      .limit(1);
    
    if (error) {
      console.error('❌ [DIAGNOSTICO] Error en Supabase:', error);
      return res.status(500).json({
        success: false,
        message: 'Error de conectividad con Supabase',
        error: error.message
      });
    }
    
    console.log('✅ [DIAGNOSTICO] Conectividad con Supabase exitosa');
    
    res.json({
      success: true,
      message: 'Conectividad con Supabase exitosa',
      data: {
        connected: true,
        timestamp: new Date().toISOString(),
        test_query_result: data ? 'SUCCESS' : 'NO_DATA'
      }
    });
    
  } catch (error) {
    console.error('❌ [DIAGNOSTICO] Error en test de Supabase:', error);
    res.status(500).json({
      success: false,
      message: 'Error en test de Supabase',
      error: error.message
    });
  }
});

export default router;