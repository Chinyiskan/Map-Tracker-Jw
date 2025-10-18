// scripts/testResumenMensual.js
// Script para probar manualmente la generación y envío del resumen mensual

const { generarYEnviarResumenMensual } = require('../frontend/js/resumenMensual');

/**
 * Función para ejecutar una prueba del resumen mensual
 * @param {number} [mesAnterior=0] - Número de meses a restar de la fecha actual (0 = mes actual)
 */
async function ejecutarPrueba(mesAnterior = 0) {
  // Crear una fecha personalizada
  const fechaPrueba = new Date();
  
  // Si se especifica un mes anterior, ajustar la fecha
  if (mesAnterior > 0) {
    fechaPrueba.setMonth(fechaPrueba.getMonth() - mesAnterior);
  }
  
  console.log('='.repeat(50));
  console.log(`PRUEBA MANUAL: Resumen para ${fechaPrueba.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`);
  console.log('='.repeat(50));
  
  try {
    // Ejecutar el proceso con la fecha personalizada
    await generarYEnviarResumenMensual(fechaPrueba);
    console.log('Prueba completada.');
  } catch (error) {
    console.error('Error durante la prueba:', error);
  }
}

// Obtener argumentos de la línea de comandos
const args = process.argv.slice(2);
const mesAnterior = args.length > 0 ? parseInt(args[0], 10) : 0;

// Ejecutar la prueba
console.log(`Iniciando prueba manual del resumen mensual${mesAnterior > 0 ? ` para hace ${mesAnterior} mes(es)` : ' para el mes actual'}...`);
executarPrueba(mesAnterior);