// api/index.js
// Servidor simplificado para Vercel

const express = require('express');
const cors = require('cors');
const path = require('path');

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

// Rutas de debug para Vercel
app.get('/api/env-check', (req, res) => {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    ADMIN_USERNAME: process.env.ADMIN_USERNAME ? 'set' : 'not set',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'set' : 'not set'
  };
  
  res.json({
    status: 'Environment check',
    variables: envVars,
    timestamp: new Date().toISOString()
  });
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