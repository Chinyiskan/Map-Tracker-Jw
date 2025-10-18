import type { Nullable, UUID } from './utils.d.ts';

// Estado manual del reporte (alineado con UI: Iniciado/En progreso/Finalizado)
export type EstadoReporte = 'Iniciado' | 'En progreso' | 'Finalizado';

export interface Reporte {
  nombre_capitan: string;
  fecha: string; // ISO-8601 (YYYY-MM-DD)
  barrio: string;
  manzanas: string[]; // Normalizadas p.ej. ["Z-174","Z-175"]
  estado: Nullable<EstadoReporte>;
  observaciones: Nullable<string>;
  salida_id: Nullable<UUID>;
  // Métodos de entidad (presentes en la implementación JS)
  getManzanasAsString(): string;
  toDatabase(): ReporteDB;
}

export interface ReporteDB {
  nombre_capitan: string;
  fecha: string;
  barrio: string;
  manzanas: string; // CSV p.ej. "Z-174,Z-175"
  estado: Nullable<EstadoReporte>;
  observaciones: Nullable<string>;
  salida_id: Nullable<UUID>;
}

export interface Ciclo {
  barrio: string;
  numero_ciclo: number;
  total_territorios: number;
  territorios_completados: number;
  progreso_porcentaje: number;
  estado: 'activo' | 'pausado' | 'finalizado' | string;
  fecha_inicio: string; // ISO date
  fecha_fin: Nullable<string>;
  toDatabase(): CicloDB;
}

export interface CicloDB {
  barrio: string;
  numero_ciclo: number;
  fecha_inicio: string;
  fecha_fin: Nullable<string>;
  total_territorios: number;
  territorios_completados: number;
  progreso_porcentaje: number;
  estado: string;
}

export interface ProgresoTerritorio {
  ciclo_id: UUID;
  territorio: string; // p.ej. "Z-174"
  fecha_trabajado: string; // ISO date
  reporte_id: UUID;
  toDatabase(): ProgresoTerritorioDB;
}

export interface ProgresoTerritorioDB {
  ciclo_id: UUID;
  territorio: string;
  fecha_trabajado: string;
  reporte_id: UUID;
}

export interface Capitan {
  id: Nullable<UUID>;
  nombre: string;
  apellido: string;
  telefono: Nullable<string>;
  email: Nullable<string>;
  created_at: Date;
  updated_at: Date;
  getNombreCompleto(): string;
  getIniciales(): string;
  toPlainObject(): Record<string, unknown>;
  toApiResponse(): Record<string, unknown>;
}

export interface Salida {
  id: Nullable<UUID>;
  capitan_id: UUID;
  barrio_asignado: string;
  dia_semana: string; // validar en capa de app
  hora: string; // HH:MM
  estado: 'activo' | 'pausado' | 'completado' | string;
  observaciones: string;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  getSummary(): string;
  toPlainObject(): Record<string, unknown>;
}