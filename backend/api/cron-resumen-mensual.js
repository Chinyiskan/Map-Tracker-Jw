// api/cron-resumen-mensual.js
// Endpoint para ejecutar el resumen mensual desde Vercel Cron Jobs
// Convertido a ES Modules para consistencia arquitectónica

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

// Configuración de Supabase usando variables de entorno
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validar que las variables estén configuradas
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Las variables SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configuradas en el archivo .env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Configuración del correo electrónico usando variables de entorno
const EMAIL_DESTINO = process.env.EMAIL_DESTINO;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;

// Validar que las variables de correo estén configuradas
if (!EMAIL_DESTINO || !EMAIL_USER || !EMAIL_PASS || !SMTP_HOST || !SMTP_PORT) {
  throw new Error('Las variables de correo EMAIL_DESTINO, EMAIL_USER, EMAIL_PASS, SMTP_HOST y SMTP_PORT deben estar configuradas en el archivo .env');
}

const transporter = nodemailer.createTransporter({
  host: SMTP_HOST,
  port: parseInt(SMTP_PORT),
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

/**
 * Obtiene el primer y último día del mes actual o especificado
 * @param {Date} [fecha=new Date()] - Fecha opcional para calcular el rango
 * @returns {Object} Objeto con fechas de inicio y fin en formato ISO
 */
function obtenerRangoMes(fecha = new Date()) {
  const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
  
  return {
    inicio: primerDia.toISOString().split('T')[0],
    fin: ultimoDia.toISOString().split('T')[0]
  };
}

/**
 * Obtiene el nombre del mes en español
 * @param {number} mes - Número del mes (0-11)
 * @returns {string} Nombre del mes en español
 */
function obtenerNombreMes(mes) {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return meses[mes];
}

/**
 * Obtiene todos los reportes del mes desde Supabase
 * @param {Object} rango - Objeto con fechas inicio y fin
 * @returns {Promise<Array>} Promesa que resuelve a un array de reportes
 */
async function obtenerReportesMes(rango) {
  try {
    const { data, error } = await supabase
      .from('reportes')
      .select('*')
      .gte('fecha', rango.inicio)
      .lte('fecha', rango.fin)
      .order('fecha', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener reportes:', error);
    return [];
  }
}

/**
 * Genera un archivo Excel con los reportes organizados por barrio
 * @param {Array} reportes - Array de reportes desde Supabase
 * @param {string} mesAño - String con el mes y año para el nombre del archivo
 * @returns {string} Ruta del archivo Excel generado
 */
function generarExcel(reportes, mesAño) {
  // Crear un nuevo libro de Excel
  const workbook = XLSX.utils.book_new();
  
  // Agrupar reportes por barrio
  const reportesPorBarrio = {};
  
  reportes.forEach(reporte => {
    const barrio = reporte.barrio;
    if (!reportesPorBarrio[barrio]) {
      reportesPorBarrio[barrio] = [];
    }
    
    // Manejar nueva estructura con manzanas como array
    const manzanas = Array.isArray(reporte.manzanas) ? reporte.manzanas : [reporte.manzanas || reporte.manzana || ''];
    const nombreCapitan = reporte.nombre_capitan || reporte.nombre || '';
    
    manzanas.forEach(manzana => {
      reportesPorBarrio[barrio].push({
        'Fecha': reporte.fecha,
        'Capitán': nombreCapitan,
        'Manzana': manzana,
        'Estado': reporte.estado || ''
      });
    });
  });
  
  // Crear una hoja para cada barrio
  Object.keys(reportesPorBarrio).forEach(barrio => {
    const worksheet = XLSX.utils.json_to_sheet(reportesPorBarrio[barrio]);
    XLSX.utils.book_append_sheet(workbook, worksheet, barrio);
  });
  
  // Usar directorio temporal del sistema
  const tempDir = os.tmpdir();
  
  // Guardar el archivo
  const filePath = path.join(tempDir, `Reporte_Mensual_${mesAño.replace(' ', '_')}.xlsx`);
  XLSX.writeFile(workbook, filePath);
  
  return filePath;
}

/**
 * Envía el archivo Excel por correo electrónico
 * @param {string} filePath - Ruta del archivo Excel generado
 * @param {string} mesAño - String con el mes y año para el asunto
 * @returns {Promise<boolean>} Promesa que resuelve a true si se envió correctamente
 */
async function enviarCorreo(filePath, mesAño) {
  try {
    const info = await transporter.sendMail({
      from: '"Sistema de Reportes" <tu-correo@gmail.com>',
      to: EMAIL_DESTINO,
      subject: `Resumen mensual - ${mesAño}`,
      text: `Adjunto encontrará el resumen mensual de reportes para ${mesAño}.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #16a085;">Resumen Mensual de Reportes</h2>
          <p>Hola,</p>
          <p>Adjunto encontrará el resumen mensual de reportes para <strong>${mesAño}</strong>.</p>
          <p>Este archivo contiene todos los reportes organizados por barrio, con detalles de fecha, capitán y manzana.</p>
          <p>Saludos cordiales,<br>Sistema Automático de Reportes</p>
        </div>
      `,
      attachments: [
        {
          filename: path.basename(filePath),
          path: filePath
        }
      ]
    });
    
    console.log('Correo enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error al enviar correo:', error);
    return false;
  } finally {
    // Eliminar el archivo temporal después de enviarlo
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Error al eliminar archivo temporal:', err);
    }
  }
}

/**
 * Función principal que ejecuta todo el proceso
 * @param {Date} [fechaPersonalizada=null] - Fecha opcional para pruebas
 */
async function generarYEnviarResumenMensual(fechaPersonalizada = null) {
  try {
    console.log('Iniciando generación de resumen mensual...');
    
    // Usar fecha actual o personalizada
    const fecha = fechaPersonalizada || new Date();
    const rango = obtenerRangoMes(fecha);
    const mesAño = `${obtenerNombreMes(fecha.getMonth())} ${fecha.getFullYear()}`;
    
    console.log(`Generando resumen para: ${mesAño}`);
    console.log(`Rango de fechas: ${rango.inicio} al ${rango.fin}`);
    
    // Obtener reportes
    const reportes = await obtenerReportesMes(rango);
    console.log(`Se encontraron ${reportes.length} reportes`);
    
    if (reportes.length === 0) {
      console.log('No hay reportes para este período. No se enviará correo.');
      return false;
    }
    
    // Generar Excel
    const filePath = generarExcel(reportes, mesAño);
    console.log(`Archivo Excel generado: ${filePath}`);
    
    // Enviar correo
    const enviado = await enviarCorreo(filePath, mesAño);
    
    if (enviado) {
      console.log('Proceso completado exitosamente.');
      return true;
    } else {
      console.error('El proceso completó con errores.');
      return false;
    }
  } catch (error) {
    console.error('Error en el proceso de resumen mensual:', error);
    return false;
  }
}

// Endpoint para Vercel Serverless Function - ES Modules
export default async function cronResumenMensual(req, res) {
  // Verificar si es una solicitud autorizada (opcional)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const resultado = await generarYEnviarResumenMensual();
    if (resultado) {
      return res.status(200).json({ success: true, message: 'Resumen mensual generado y enviado correctamente' });
    } else {
      return res.status(200).json({ success: false, message: 'No se generó el resumen mensual (posiblemente no hay datos)' });
    }
  } catch (error) {
    console.error('Error en el endpoint de resumen mensual:', error);
    return res.status(500).json({ error: 'Error al generar el resumen mensual', details: error.message });
  }
}

// Exportar también la función principal para uso interno
export { generarYEnviarResumenMensual };