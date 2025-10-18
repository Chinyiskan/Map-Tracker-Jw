// backend/domain/usecases/GestionarCiclo.js
// Caso de uso para gestionar ciclos - Lógica de negocio de ciclos

import Ciclo from '../entities/Ciclo.js';

class GestionarCiclo {
  constructor(cicloRepository, progresoRepository) {
    this.cicloRepository = cicloRepository;
    this.progresoRepository = progresoRepository;
  }
  
  /**
   * Procesar reporte y actualizar ciclo
   * @param {Object} params - Parámetros
   * @param {string} params.barrio - Nombre del barrio
   * @param {Array} params.manzanas - Array de manzanas reportadas
   * @param {string} params.reporteId - ID del reporte
   * @returns {Object} Información del ciclo actualizado
   */
  async procesarReporte({ barrio, manzanas, reporteId }) {
    try {
      console.log(`🔄 Procesando reporte para ciclo de ${barrio}`);
      
      // 1. Obtener o crear ciclo activo
      let ciclo = await this.obtenerOCrearCicloActivo(barrio);
      
      // 2. Registrar progreso de territorios
      const territoriosRegistrados = await this.registrarTerritorios({
        cicloId: ciclo.id,
        territorios: manzanas,
        reporteId
      });
      
      // 3. Calcular nuevo progreso
      const nuevoProgreso = await this.calcularProgresoCiclo(ciclo.id);
      
      // 4. Actualizar ciclo con nuevo progreso
      ciclo = await this.actualizarProgresoCiclo(ciclo.id, nuevoProgreso);
      
      // 5. Verificar si ciclo está completo
      if (ciclo.progreso_porcentaje >= 100) {
        await this.completarCiclo(ciclo.id, barrio);
      }
      
      console.log(`✅ Ciclo procesado: ${ciclo.progreso_porcentaje.toFixed(1)}% completado`);
      
      return {
        ciclo: ciclo,
        territorios_registrados: territoriosRegistrados.length,
        progreso_anterior: nuevoProgreso.progreso_anterior,
        progreso_actual: ciclo.progreso_porcentaje,
        ciclo_completado: ciclo.estado === 'completado'
      };
      
    } catch (error) {
      console.error('❌ Error en GestionarCiclo.procesarReporte:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener ciclo activo o crear uno nuevo
   * @param {string} barrio - Nombre del barrio
   * @returns {Object} Ciclo activo
   */
  async obtenerOCrearCicloActivo(barrio) {
    try {
      // Intentar obtener ciclo activo
      let ciclo = await this.cicloRepository.obtenerCicloActivo(barrio);
      
      if (!ciclo) {
        console.log(`🆕 Creando nuevo ciclo para ${barrio}`);
        ciclo = await this.crearNuevoCiclo(barrio);
      } else {
        console.log(`📊 Usando ciclo existente ${ciclo.numero_ciclo} para ${barrio}`);
      }
      
      return ciclo;
      
    } catch (error) {
      console.error('❌ Error obteniendo/creando ciclo:', error.message);
      throw error;
    }
  }
  
  /**
   * Crear nuevo ciclo para un barrio
   * @param {string} barrio - Nombre del barrio
   * @param {number} numeroCiclo - Número del ciclo (opcional)
   * @returns {Object} Nuevo ciclo creado
   */
  async crearNuevoCiclo(barrio, numeroCiclo = null) {
    try {
      // Obtener total de territorios para el barrio
      const totalTerritorios = await this.obtenerTotalTerritorios(barrio);
      
      // Determinar número de ciclo
      if (!numeroCiclo) {
        const ultimoCiclo = await this.cicloRepository.obtenerUltimoCiclo(barrio);
        numeroCiclo = ultimoCiclo ? ultimoCiclo.numero_ciclo + 1 : 1;
      }
      
      // Crear entidad de ciclo
      const nuevoCiclo = new Ciclo({
        barrio,
        total_territorios: totalTerritorios,
        numero_ciclo: numeroCiclo
      });
      
      // Persistir en base de datos
      const cicloCreado = await this.cicloRepository.crear(nuevoCiclo);
      
      console.log(`✅ Ciclo ${numeroCiclo} creado para ${barrio} con ${totalTerritorios} territorios`);
      
      return cicloCreado;
      
    } catch (error) {
      console.error('❌ Error creando nuevo ciclo:', error.message);
      throw error;
    }
  }
  
  /**
   * Registrar territorios trabajados en el ciclo
   * @param {Object} params - Parámetros
   * @returns {Array} Territorios registrados
   */
  async registrarTerritorios({ cicloId, territorios, reporteId }) {
    try {
      console.log(`📍 Registrando ${territorios.length} territorios en ciclo`);
      
      const territoriosRegistrados = [];
      
      for (const territorio of territorios) {
        try {
          // Verificar si ya existe en este ciclo
          const existe = await this.progresoRepository.existeTerritorio(cicloId, territorio);
          
          if (!existe) {
            const progreso = await this.progresoRepository.crear({
              ciclo_id: cicloId,
              territorio: territorio.trim().toUpperCase(),
              reporte_id: reporteId
            });
            
            territoriosRegistrados.push(progreso);
            console.log(`✅ Territorio ${territorio} registrado`);
          } else {
            console.log(`⚠️ Territorio ${territorio} ya existe en este ciclo`);
          }
        } catch (error) {
          console.error(`❌ Error registrando territorio ${territorio}:`, error.message);
          // Continuar con los demás territorios
        }
      }
      
      return territoriosRegistrados;
      
    } catch (error) {
      console.error('❌ Error registrando territorios:', error.message);
      throw error;
    }
  }
  
  /**
   * Calcular progreso actual del ciclo
   * @param {string} cicloId - ID del ciclo
   * @returns {Object} Información de progreso
   */
  async calcularProgresoCiclo(cicloId) {
    try {
      // Obtener ciclo actual
      const ciclo = await this.cicloRepository.obtenerPorId(cicloId);
      if (!ciclo) {
        throw new Error('Ciclo no encontrado');
      }
      
      const progresoAnterior = ciclo.progreso_porcentaje;
      
      // Contar territorios completados
      const territoriosCompletados = await this.progresoRepository.contarPorCiclo(cicloId);
      
      // Calcular nuevo progreso
      const cicloEntity = Ciclo.fromDatabase(ciclo);
      const nuevoProgreso = cicloEntity.calcularProgreso(territoriosCompletados);
      
      return {
        territorios_completados: territoriosCompletados,
        total_territorios: ciclo.total_territorios,
        progreso_anterior: progresoAnterior,
        progreso_actual: nuevoProgreso,
        incremento: nuevoProgreso - progresoAnterior
      };
      
    } catch (error) {
      console.error('❌ Error calculando progreso:', error.message);
      throw error;
    }
  }
  
  /**
   * Actualizar progreso del ciclo en base de datos
   * @param {string} cicloId - ID del ciclo
   * @param {Object} progresoInfo - Información de progreso
   * @returns {Object} Ciclo actualizado
   */
  async actualizarProgresoCiclo(cicloId, progresoInfo) {
    try {
      const datosActualizacion = {
        territorios_completados: progresoInfo.territorios_completados,
        progreso_porcentaje: progresoInfo.progreso_actual
      };
      
      const cicloActualizado = await this.cicloRepository.actualizar(cicloId, datosActualizacion);
      
      return cicloActualizado;
      
    } catch (error) {
      console.error('❌ Error actualizando progreso del ciclo:', error.message);
      throw error;
    }
  }
  
  /**
   * Completar ciclo y crear el siguiente
   * @param {string} cicloId - ID del ciclo a completar
   * @param {string} barrio - Nombre del barrio
   */
  async completarCiclo(cicloId, barrio) {
    try {
      console.log(`🎉 Completando ciclo para ${barrio}`);
      
      // Marcar ciclo como completado
      await this.cicloRepository.completar(cicloId);
      
      // Crear siguiente ciclo
      const siguienteCiclo = await this.crearNuevoCiclo(barrio);
      
      console.log(`🆕 Ciclo ${siguienteCiclo.numero_ciclo} iniciado para ${barrio}`);
      
      return siguienteCiclo;
      
    } catch (error) {
      console.error('❌ Error completando ciclo:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener total de territorios para un barrio
   * @param {string} barrio - Nombre del barrio
   * @returns {number} Total de territorios
   */
  async obtenerTotalTerritorios(barrio) {
    // Mapeo de territorios por barrio (datos de configuración)
    const territoriosPorBarrio = {
      'Alcalá': 50,
      'Acacios': 45,
      'Ciudad Jardín': 60,
      'Guaimaral': 55,
      'La Mar y Gratamira': 40,
      'Niza': 65,
      'Prados Norte': 35,
      'Próceres': 42,
      'San Eduardo': 25,
      'Santa Elena': 38,
      'Tasajero': 48,
      'Zulima': 52
    };
    
    const total = territoriosPorBarrio[barrio];
    if (!total) {
      throw new Error(`Total de territorios no configurado para barrio: ${barrio}`);
    }
    
    return total;
  }
}

export default GestionarCiclo;