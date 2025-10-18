// resumenMensual.js
// Script para generar y enviar reportes mensuales automáticamente

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const ExcelJS = require('exceljs');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');

// Configuración de Supabase usando variables de entorno
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validar que las variables estén configuradas
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Las variables SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configuradas en el archivo .env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Configuración del correo electrónico usando variables de entorno
const EMAIL_DESTINO = process.env.EMAIL_DESTINO || 'admin@ejemplo.com';
const transporter = nodemailer.createTransport({
  // Configurar según el proveedor de correo que uses
  // Las credenciales deben estar en variables de entorno por seguridad
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Variable de entorno requerida
    pass: process.env.EMAIL_PASSWORD // Variable de entorno requerida (usar App Password para Gmail)
  }
});

// Validar configuración de email
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.warn('⚠️ Variables de entorno EMAIL_USER y EMAIL_PASSWORD no configuradas. El envío de correos no funcionará.');
}

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
 * @returns {Promise<string>} Ruta del archivo Excel generado
 */
async function generarExcel(reportes, mesAño) {
  // Crear un nuevo libro de Excel con ExcelJS
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Reportes JW';
  workbook.created = new Date();
  
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
    const worksheet = workbook.addWorksheet(barrio);
    
    // Configurar columnas
    worksheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 12 },
      { header: 'Capitán', key: 'capitan', width: 20 },
      { header: 'Manzana', key: 'manzana', width: 10 },
      { header: 'Estado', key: 'estado', width: 12 }
    ];
    
    // Agregar datos
    reportesPorBarrio[barrio].forEach(reporte => {
      worksheet.addRow({
        fecha: reporte.Fecha,
        capitan: reporte.Capitán,
        manzana: reporte.Manzana,
        estado: reporte.Estado
      });
    });
    
    // Estilo para el encabezado
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F3FF' }
    };
  });
  
  // Crear directorio temporal si no existe
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Guardar el archivo
  const filePath = path.join(tempDir, `Reporte_Mensual_${mesAño.replace(' ', '_')}.xlsx`);
  await workbook.xlsx.writeFile(filePath);
  
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
      return;
    }
    
    // Generar Excel
    const filePath = await generarExcel(reportes, mesAño);
    console.log(`Archivo Excel generado: ${filePath}`);
    
    // Enviar correo
    const enviado = await enviarCorreo(filePath, mesAño);
    
    if (enviado) {
      console.log('Proceso completado exitosamente.');
    } else {
      console.error('El proceso completó con errores.');
    }
  } catch (error) {
    console.error('Error en el proceso de resumen mensual:', error);
  }
}

// Programar la tarea para ejecutarse el último día de cada mes a las 8:00 AM (hora Colombia)
// El formato cron es: minuto hora día-del-mes mes día-de-la-semana
// Ejecutar los días 28-31 y verificar si es el último día del mes
const cronExpression = '0 8 28-31 * *';

// Función wrapper para verificar si es el último día del mes
function ejecutarSiEsUltimoDia() {
  const hoy = new Date();
  const mañana = new Date(hoy);
  mañana.setDate(hoy.getDate() + 1);
  
  // Si mañana es día 1, entonces hoy es el último día del mes
  if (mañana.getDate() === 1) {
    console.log('Ejecutando resumen mensual - último día del mes');
    generarYEnviarResumenMensual();
  } else {
    console.log('No es el último día del mes, saltando ejecución');
  }
}

// Iniciar el cron job
cron.schedule(cronExpression, ejecutarSiEsUltimoDia, {
  scheduled: true,
  timezone: 'America/Bogota' // Zona horaria de Colombia
});

console.log('Servicio de resumen mensual iniciado. Programado para ejecutarse el último día de cada mes a las 8:00 AM (hora Colombia).');

// Exportar funciones para pruebas
module.exports = {
  generarYEnviarResumenMensual,
  obtenerRangoMes,
  obtenerReportesMes,
  generarExcel,
  enviarCorreo
};