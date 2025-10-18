// DTOs para requests y responses de endpoints clave
// Nota: mantener estos tipos sincronizados con validaciones y controladores
import type { ErrorCode, ValidationIssue } from './utils.d.ts';

// Genérico de respuesta HTTP consistente con ServiceResponse
export type HttpSuccess<T> = { success: true; data: T; message?: string; metadata?: any; total?: number; count?: number; barrio?: string; opciones?: any };
export type HttpError = { success: false; error: string; message?: string; code?: ErrorCode; issues?: ValidationIssue[]; data?: any; details?: any };
export type HttpResponse<T> = HttpSuccess<T> | HttpError;

// Reportes
export interface CrearReporteBody {
  fecha: string; // ISO date
  barrio: string;
  capitanId: number;
  descripcion?: string;
  estado?: 'pendiente' | 'procesado' | 'error';
}

export interface ReporteDTO {
  id: number;
  fecha: string;
  barrio: string;
  capitanId: number;
  descripcion?: string;
  estado: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ObtenerReportesQuery {
  desde?: string; // ISO date
  hasta?: string; // ISO date
  barrio?: string;
  capitanId?: number;
  pagina?: number;
  limite?: number;
}

// Ciclos
export interface CrearCicloBody {
  nombre: string;
  fechaInicio?: string; // ISO date
  numeroCiclo?: number;
}

export interface CicloResumenDTO {
  id: number;
  nombre: string;
  estado: 'activo' | 'pausado' | 'completado';
  fechaInicio: string;
  fechaFin?: string;
}

// Salidas
export interface CrearSalidaBody {
  fecha: string;
  barrio: string;
  capitanId: number;
  observaciones?: string;
}

export interface SalidaDTO {
  id: number;
  fecha: string;
  barrio: string;
  capitanId: number;
  estado: string;
}

// Capitanes
export interface CrearCapitanBody {
  nombre: string;
  telefono?: string;
  email?: string;
  barrio?: string;
}

export interface CapitanDTO {
  id: number;
  nombre: string;
  telefono?: string;
  email?: string;
  barrio?: string;
  activo: boolean;
}