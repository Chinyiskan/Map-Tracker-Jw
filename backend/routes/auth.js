// backend/routes/auth.js
// Rutas de autenticación para el panel de administración

import express from 'express';
import crypto from 'crypto';

const router = express.Router();

/**
 * POST /api/auth/login
 * Autenticación de administrador
 */
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Debug logs
    console.log('🔐 Intento de login:');
    console.log('  - Usuario recibido:', username);
    console.log('  - Contraseña recibida:', password);
    console.log('  - Usuario esperado:', process.env.ADMIN_USERNAME);
    console.log('  - Contraseña esperada:', process.env.ADMIN_PASSWORD);
    
    // Validar que se envíen los campos requeridos
    if (!username || !password) {
      console.log('❌ Campos faltantes');
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      });
    }
    
    // Verificar credenciales contra variables de entorno
    if (username === process.env.ADMIN_USERNAME && 
        password === process.env.ADMIN_PASSWORD) {
      console.log('✅ Credenciales correctas');
      
      // Generar token simple pero seguro
      const token = generateSecureToken();
      
      res.json({
        success: true,
        token: token,
        message: 'Autenticación exitosa'
      });
    } else {
      // Credenciales incorrectas
      console.log('❌ Credenciales incorrectas');
      res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos'
      });
    }
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/auth/validate
 * Validar token de sesión
 */
router.post('/validate', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token requerido'
      });
    }
    
    if (isValidToken(token)) {
      res.json({
        success: true,
        message: 'Token válido'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
  } catch (error) {
    console.error('Error validando token:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * Generar token seguro para la sesión
 * @returns {string} Token codificado
 */
function generateSecureToken() {
  const timestamp = Date.now();
  const randomValue = Math.random().toString(36).substring(2);
  const tokenData = `admin_${timestamp}_${randomValue}`;
  
  return Buffer.from(tokenData).toString('base64');
}

/**
 * Validar si un token es válido
 * @param {string} token - Token a validar
 * @returns {boolean} True si es válido
 */
function isValidToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    
    // Verificar formato del token
    if (!decoded.startsWith('admin_')) {
      return false;
    }
    
    // Extraer timestamp del token
    const parts = decoded.split('_');
    if (parts.length < 2) {
      return false;
    }
    
    const timestamp = parseInt(parts[1]);
    const now = Date.now();
    
    // Token válido por 24 horas (86400000 ms)
    const tokenAge = now - timestamp;
    const maxAge = 24 * 60 * 60 * 1000;
    
    return tokenAge < maxAge;
  } catch (error) {
    return false;
  }
}

export default router;