// backend/domain/usecases/CrearReporte.js
// Caso de uso para crear reportes - Orquesta la lógica de negocio

import Reporte from '../entities/Reporte.js';

class CrearReporte {
  constructor(reporteRepository, cicloService, progresoService) {
    this.reporteRepository = reporteRepository;
    this.cicloService = cicloService;
    this.progresoService = progresoService;
  }
  
  /**
   * Ejecutar caso de uso de crear reporte
   * @param {Object} datosReporte - Datos del reporte
   * @returns {Object} Reporte creado con información de ciclo
   */
  async ejecutar(datosReporte) {
    try {
      // 1. Validar y crear entidad de reporte
      const reporte = new Reporte(datosReporte);
      
      // 2. Validar fecha del reporte
      if (!reporte.isValidDate()) {
        throw new Error('La fecha del reporte no puede ser futura');
      }
      
      // 3. Guardar reporte (data pura)
      console.log('📝 Creando reporte para:', reporte.barrio);
      const reporteCreado = await this.reporteRepository.crear(reporte);
      
      // 4. Procesar lógica de ciclos (separada)
      console.log('🔄 Procesando ciclo para:', reporte.barrio);
      const cicloInfo = await this.cicloService.procesarReporte({
        barrio: reporte.barrio,
        manzanas: reporte.manzanas,
        reporteId: reporteCreado.id
      });
      
      // 5. Retornar resultado completo
      return {
        reporte: reporteCreado,
        ciclo: cicloInfo,
        mensaje: 'Reporte creado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error en CrearReporte.ejecutar:', error.message);
      throw error;
    }
  }
  
  /**
   * Validar datos antes de crear reporte
   * @param {Object} datosReporte - Datos a validar
   * @returns {Object} Datos validados
   */
  async validarDatos(datosReporte) {
    try {
      // Crear entidad para validar (sin persistir)
      const reporte = new Reporte(datosReporte);
      
      // Validaciones adicionales de negocio
      await this._validarCapitanExiste(reporte.nombre_capitan);
      await this._validarBarrioValido(reporte.barrio);
      await this._validarManzanasFormato(reporte.manzanas);
      
      return {
        valido: true,
        datos: reporte.toDatabase()
      };
      
    } catch (error) {
      return {
        valido: false,
        error: error.message
      };
    }
  }
  
  /**
   * Validar que el capitán existe (validación de negocio)
   * @param {string} nombreCapitan - Nombre del capitán
   * @private
   */
  async _validarCapitanExiste(nombreCapitan) {
    // TODO: Implementar validación con repositorio de capitanes
    // Por ahora, validación básica
    if (nombreCapitan.length < 3) {
      throw new Error('El nombre del capitán debe tener al menos 3 caracteres');
    }
  }
  
  /**
   * Validar que el barrio es válido
   * @param {string} barrio - Nombre del barrio
   * @private
   */
  async _validarBarrioValido(barrio) {
    const barriosValidos = [
      'Alcalá', 'Acacios', 'Ciudad Jardín', 'Guaimaral',
      'La Mar y Gratamira', 'Niza', 'Prados Norte', 'Próceres',
      'San Eduardo', 'Santa Elena', 'Tasajero', 'Zulima'
    ];
    
    if (!barriosValidos.includes(barrio)) {
      throw new Error(`El barrio '${barrio}' no es válido`);
    }
  }
  
  /**
   * Validar formato de manzanas
   * @param {Array} manzanas - Array de manzanas
   * @private
   */
  async _validarManzanasFormato(manzanas) {
    if (manzanas.length === 0) {
      throw new Error('Debe reportar al menos una manzana');
    }
    
    if (manzanas.length > 50) {
      throw new Error('No se pueden reportar más de 50 manzanas a la vez');
    }
    
    // Validar formato de cada manzana
    const formatoValido = /^[A-Z]{1,3}-\d{1,4}$/i;
    const manzanasInvalidas = manzanas.filter(manzana => 
      !formatoValido.test(manzana.trim())
    );
    
    if (manzanasInvalidas.length > 0) {
      throw new Error(`Manzanas con formato inválido: ${manzanasInvalidas.join(', ')}`);
    }
    
    // Validar que no haya duplicados
    const manzanasUnicas = new Set(manzanas.map(m => m.trim().toUpperCase()));
    if (manzanasUnicas.size !== manzanas.length) {
      throw new Error('No se pueden reportar manzanas duplicadas');
    }
  }
}

export default CrearReporte;