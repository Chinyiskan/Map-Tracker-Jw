import type { UUID, Nullable, ServiceResponse } from './utils.d.ts';
import type { Reporte, Ciclo, ProgresoTerritorio, Capitan, Salida } from './entities.d.ts';

// Interfaces de Servicios de Aplicación (sin impacto en runtime)

export interface IReporteService {
  crearReporte(datosReporte: Record<string, unknown>): Promise<ServiceResponse<Reporte>>;
  obtenerReportesPorBarrio(barrio: string, opciones?: Record<string, unknown>): Promise<ServiceResponse<Reporte[]>>;
  obtenerReportePorId(id: string): Promise<ServiceResponse<Nullable<Reporte>>>;
  obtenerReportesPorCapitan(nombreCapitan: string, opciones?: Record<string, unknown>): Promise<ServiceResponse<Reporte[]>>;
  obtenerReportesPorRango(fechaInicio: string, fechaFin: string, opciones?: Record<string, unknown>): Promise<ServiceResponse<Reporte[]>>;
  actualizarReporte(id: string, datosActualizacion: Partial<Reporte>): Promise<ServiceResponse<Reporte>>;
  eliminarReporte(id: string): Promise<ServiceResponse<{ id: string; eliminado: boolean } | null>>;
  obtenerEstadisticas(opciones?: Record<string, unknown>): Promise<ServiceResponse<Record<string, unknown>>>;
  obtenerEstadisticasMensuales(fechaInicio: string, fechaFin: string, opciones?: Record<string, unknown>): Promise<ServiceResponse<{ estadisticas_por_mes: unknown[]; resumen: Record<string, unknown>; rango: { fechaInicio: string; fechaFin: string } }>>;
  validarDatosReporte(datosReporte: Record<string, unknown>): Promise<ServiceResponse<{ valido: boolean; error?: string }>>;
  contarReportesPorBarrio(barrio: string, opciones?: Record<string, unknown>): Promise<ServiceResponse<{ barrio: string; count: number }>>;
  obtenerTodosLosReportes(filtros?: Record<string, unknown>): Promise<ServiceResponse<Reporte[]>>;
}

export interface ICicloService {
  procesarReporte(params: Record<string, unknown>): Promise<ServiceResponse<Record<string, unknown>>>;
  obtenerCicloActivo(barrio: string): Promise<ServiceResponse<Nullable<Ciclo>>>;
  crearNuevoCiclo(barrio: string, opciones?: { numeroCiclo?: Nullable<number> }): Promise<ServiceResponse<Ciclo>>;
  obtenerProgresoCiclo(cicloId: string): Promise<ServiceResponse<Record<string, unknown>>>;
  obtenerProgresoBarrio(barrio: string): Promise<ServiceResponse<Record<string, unknown>>>;
  obtenerProgresoTodosBarrios(opciones?: { fechaInicio?: string; fechaFin?: string }): Promise<ServiceResponse<unknown[]>>;
  invalidarCacheProgreso(barrio?: Nullable<string>): Promise<ServiceResponse<{ invalidado: boolean }>>;
  obtenerEstadisticasCache(): Promise<ServiceResponse<Record<string, unknown>>>;
  completarCiclo(cicloId: string, opciones?: Record<string, unknown>): Promise<ServiceResponse<Record<string, unknown>>>;
  pausarCiclo(cicloId: string): Promise<ServiceResponse<Record<string, unknown>>>;
  reactivarCiclo(cicloId: string): Promise<ServiceResponse<Record<string, unknown>>>;
  obtenerHistorialCiclos(barrio: string, opciones?: Record<string, unknown>): Promise<ServiceResponse<Ciclo[]>>;
  obtenerCiclosActivos(): Promise<ServiceResponse<Ciclo[]>>;
  obtenerEstadisticasGenerales(): Promise<ServiceResponse<Record<string, unknown>>>;
  obtenerEstadisticasCiclos(opciones?: Record<string, unknown>): Promise<ServiceResponse<Record<string, unknown>>>;
}

export interface IProgresoService {
  registrarTerritorios(params: { cicloId: string; territorios: string[]; reporteId: string }): Promise<ServiceResponse<{ territorios_registrados: unknown[]; territorios_existentes: string[]; errores: Array<{ territorio: string; error: string }>; total_procesados: number; total_registrados: number }>>;
  calcularProgreso(cicloId: string): Promise<ServiceResponse<{ territorios_completados: number; ciclo_id: string }>>;
  obtenerProgresoPorCiclo(cicloId: string, opciones?: Record<string, unknown>): Promise<ServiceResponse<ProgresoTerritorio[]>>;
  obtenerProgresoPorReporte(reporteId: string): Promise<ServiceResponse<ProgresoTerritorio[]>>;
  obtenerHistorialTerritorio(territorio: string, opciones?: Record<string, unknown>): Promise<ServiceResponse<ProgresoTerritorio[]>>;
  obtenerProgresoPorRango(fechaInicio: string, fechaFin: string, opciones?: Record<string, unknown>): Promise<ServiceResponse<ProgresoTerritorio[]>>;
  verificarTerritorioEnCiclo(cicloId: string, territorio: string): Promise<ServiceResponse<{ existe: boolean; ciclo_id: string; territorio: string }>>;
  actualizarProgreso(id: string, datosActualizacion: Partial<ProgresoTerritorio>): Promise<ServiceResponse<ProgresoTerritorio>>;
  eliminarProgreso(id: string): Promise<ServiceResponse<{ id: string; eliminado: boolean } | null>>;
  obtenerEstadisticas(opciones?: Record<string, unknown>): Promise<ServiceResponse<Record<string, unknown>>>;
  obtenerTerritoriosMasTrabajados(opciones?: Record<string, unknown>): Promise<ServiceResponse<unknown[]>>;
  contarTerritoriosPorCiclo(cicloId: string): Promise<ServiceResponse<{ ciclo_id: string; count: number }>>;
}

export interface ICapitanService {
  getAllCapitanes(filters?: Record<string, unknown>): Promise<ServiceResponse<Record<string, unknown>[], { total: number; filters: Record<string, unknown>; distribution: Record<string, unknown> }>>;
  getCapitanById(id: string): Promise<ServiceResponse<Record<string, unknown> | null>>;
  createCapitan(capitanData: Record<string, unknown>): Promise<ServiceResponse<Record<string, unknown>>>;
  updateCapitan(id: string, updateData: Record<string, unknown>): Promise<ServiceResponse<Record<string, unknown>>>;
  deleteCapitan(id: string): Promise<ServiceResponse<null>>;
  searchCapitanes(searchTerm: string): Promise<ServiceResponse<Record<string, unknown>[]>>;
  getStats(): Promise<ServiceResponse<Record<string, unknown>>>;
  validateCapitanData(capitanData: Record<string, unknown>): Promise<ServiceResponse<{ isValid: boolean; errors?: Record<string, string> }>>;
}

export interface ISalidaService {
  getAllSalidas(filters?: Record<string, unknown>): Promise<ServiceResponse<Record<string, unknown>[], { total: number; filters: Record<string, unknown>; distribution: Record<string, unknown> }>>;
  getSalidaById(id: string): Promise<ServiceResponse<Record<string, unknown> | null>>;
  createSalida(salidaData: Record<string, unknown>): Promise<ServiceResponse<Record<string, unknown>>>;
  updateSalida(id: string, updateData: Record<string, unknown>): Promise<ServiceResponse<Record<string, unknown>>>;
  deleteSalida(id: string): Promise<ServiceResponse<null>>;
  getSalidasByCapitan(capitanId: string): Promise<ServiceResponse<Record<string, unknown>[]>>;
  getStats(): Promise<ServiceResponse<Record<string, unknown>>>;
  changeStatus(id: string, nuevoEstado: string): Promise<ServiceResponse<Record<string, unknown>>>;
}