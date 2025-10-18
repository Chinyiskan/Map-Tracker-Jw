import type { UUID } from './utils';
import type {
  Reporte,
  ReporteDB,
  Ciclo,
  CicloDB,
  ProgresoTerritorio,
  ProgresoTerritorioDB,
  Capitan,
  CapitanDB,
  Salida,
  SalidaDB,
} from './entities';

export interface IReporteRepository {
  crear(input: Reporte): Promise<ReporteDB & { id: UUID }>;
  obtenerPorBarrio(barrio: string, opciones?: Record<string, any>): Promise<Array<ReporteDB & { id: UUID }>>;
  obtenerPorId(id: UUID): Promise<(ReporteDB & { id: UUID }) | null>;
  obtenerPorCapitan(nombreCapitan: string, opciones?: Record<string, any>): Promise<Array<ReporteDB & { id: UUID }>>;
  obtenerPorRangoFechas(fechaInicio: string, fechaFin: string, opciones?: Record<string, any>): Promise<Array<ReporteDB & { id: UUID }>>;
  obtenerEstadisticasMensuales(fechaInicio: string, fechaFin: string, opciones?: Record<string, any>): Promise<any[]>;
  actualizar(id: UUID, patch: Partial<ReporteDB>): Promise<ReporteDB & { id: UUID }>;
  eliminar(id: UUID): Promise<void>;
  contarPorBarrio(barrio: string, opciones?: Record<string, any>): Promise<number>;
  obtenerEstadisticas(opciones?: Record<string, any>): Promise<any[]>;
  obtenerTodos(opciones?: Record<string, any>): Promise<Array<ReporteDB & { id: UUID }>>;
  existe(criterios: Partial<ReporteDB>): Promise<boolean>;
}

export interface ICicloRepository {
  crear(input: Ciclo): Promise<CicloDB & { id: UUID }>;
  obtenerCicloActivo(barrio: string): Promise<(CicloDB & { id: UUID }) | null>;
  obtenerPorId(id: UUID): Promise<(CicloDB & { id: UUID }) | null>;
  obtenerUltimoCiclo(barrio: string): Promise<(CicloDB & { id: UUID }) | null>;
  obtenerPorBarrio(barrio: string, opciones?: Record<string, any>): Promise<Array<CicloDB & { id: UUID }>>;
  actualizar(id: UUID, patch: Partial<CicloDB>): Promise<CicloDB & { id: UUID }>;
  completar(id: UUID, fechaFin?: string | null): Promise<CicloDB & { id: UUID }>;
  pausar(id: UUID): Promise<CicloDB & { id: UUID }>;
  reactivar(id: UUID): Promise<CicloDB & { id: UUID }>;
  obtenerCiclosActivos(): Promise<Array<CicloDB & { id: UUID }>>;
  obtenerEstadisticas(opciones?: Record<string, any>): Promise<any[]>;
  obtenerRankingBarriosOptimizado(opciones?: Record<string, any>): Promise<any[]>;
  existe(criterios: Partial<CicloDB>): Promise<boolean>;
  eliminar(id: UUID): Promise<void>;
}

export interface IProgresoRepository {
  crear(input: ProgresoTerritorioDB): Promise<ProgresoTerritorioDB & { id: UUID }>;
  obtenerPorCiclo(cicloId: UUID, opciones?: Record<string, any>): Promise<Array<ProgresoTerritorioDB & { id: UUID }>>;
  contarPorCiclo(cicloId: UUID): Promise<number>;
  existeTerritorio(cicloId: UUID, territorio: string): Promise<boolean>;
  obtenerPorReporte(reporteId: UUID): Promise<Array<ProgresoTerritorioDB & { id: UUID }>>;
  obtenerPorTerritorio(territorio: string, opciones?: Record<string, any>): Promise<any[]>;
  obtenerPorRangoFechas(fechaInicio: string, fechaFin: string, opciones?: Record<string, any>): Promise<any[]>;
  obtenerEstadisticasOptimizadas(fechaInicio: string, fechaFin: string, opciones?: Record<string, any>): Promise<any[]>;
  obtenerProgresoPorBarrioOptimizado(fechaInicio: string, fechaFin: string): Promise<any[]>;
  actualizar(id: UUID, patch: Partial<ProgresoTerritorioDB>): Promise<ProgresoTerritorioDB & { id: UUID }>;
  eliminar(id: UUID): Promise<void>;
  eliminarPorCiclo(cicloId: UUID): Promise<void>;
  obtenerEstadisticas(opciones?: Record<string, any>): Promise<any[]>;
  obtenerTerritoriosMasTrabajados(opciones?: Record<string, any>): Promise<any[]>;
}

export interface ICapitanRepository {
  findAll(filters?: Record<string, any>): Promise<Capitan[]>;
  findById(id: UUID): Promise<Capitan | null>;
  create(input: Capitan): Promise<Capitan>;
  update(id: UUID, patch: Partial<CapitanDB>): Promise<Capitan>;
  delete(id: UUID): Promise<void>;
  findByNombreCompleto(nombre: string, apellido: string): Promise<Capitan | null>;
  getStats(): Promise<any>;
  existe(criterios: Partial<CapitanDB>): Promise<boolean>;
}

export interface ISalidaRepository {
  findAll(filters?: Record<string, any>): Promise<Salida[]>;
  findById(id: UUID): Promise<Salida | null>;
  create(input: Salida): Promise<Salida>;
  update(id: UUID, patch: Partial<SalidaDB>): Promise<Salida>;
  delete(id: UUID): Promise<void>;
  findByCapitan(capitanId: UUID): Promise<Salida[]>;
  findByBarrio(barrio: string): Promise<Salida[]>;
  getStats(): Promise<any>;
  hasTimeConflict(capitanId: UUID, diaSemana: string, hora: string, excludeId?: UUID | null): Promise<boolean>;
}

export interface IManzanasRepository {
  obtenerTotalManzanasPorBarrio(barrio: string): Promise<number>;
  obtenerResumenTodosBarrios(): Promise<Record<string, { total: number; auto_descubiertas: number; manuales: number; primera_manzana: string | null; ultima_manzana: string | null }>>;
  obtenerManzanasDeBarrio(barrio: string): Promise<Array<{ manzana: string; auto_descubierta: boolean; created_at: string }>>;
  inicializarAutoDescubrimientoMasivo(): Promise<boolean>;
  verificarTablaReferencia(): Promise<boolean>;
  obtenerEstadisticasAutoDescubrimiento(): Promise<{ total_barrios: number; total_manzanas: number; auto_descubiertas: number; manuales: number; porcentaje_auto: number; primera_deteccion?: string; ultima_deteccion?: string }>;
}