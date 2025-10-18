import type { UUID, Result } from './utils.d.ts';
import type { Reporte, ReporteDB, Ciclo } from './entities.d.ts';

// Caso de uso: CrearReporte
export interface CrearReporteInput extends Omit<Reporte, 'toDatabase' | 'getManzanasAsString'> {}

export interface CrearReporteOutput {
  reporte: ReporteDB & { id: UUID };
  ciclo: {
    id: UUID;
    barrio: string;
    numero_ciclo: number;
    estado: string;
    fecha_inicio: string;
    fecha_fin: string | null;
  };
  mensaje: string;
}

export type CrearReporteResult = Result<CrearReporteOutput>;

// Caso de uso: CalcularProgreso
export interface ProgresoMetricas {
  territorios_totales: number;
  territorios_completados: number;
  territorios_restantes: number;
  progreso_porcentaje: number;
  dias_transcurridos: number;
  velocidad_promedio: number;
  dias_estimados_restantes: number | null;
  fecha_estimada_finalizacion: string | null;
  estado_progreso: string;
}

export interface CalcularProgresoOutput {
  ciclo: Pick<Ciclo, 'barrio' | 'numero_ciclo' | 'estado' | 'fecha_inicio' | 'fecha_fin'> & { id: UUID };
  progreso: ProgresoMetricas;
  territorios: Record<string, Array<{ territorio: string; fecha_trabajado: string }>>;
}

export type CalcularProgresoResult = Result<CalcularProgresoOutput>;