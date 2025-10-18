// Interfaces TypeScript para controladores HTTP de la aplicación
// Ahora tipamos explícitamente req/res con Express para mejorar DX.
import type { Request, Response } from 'express';

export interface IHttpController {
  healthCheck?(req: Request, res: Response): Promise<void>;
}

export interface IReporteController extends IHttpController {
  crear(req: Request, res: Response): Promise<void>;
  obtenerTodos(req: Request, res: Response): Promise<void>;
  obtenerEstadisticas(req: Request, res: Response): Promise<void>;
  validarDatos(req: Request, res: Response): Promise<void>;
  obtenerPorRango(req: Request, res: Response): Promise<void>;
  obtenerPorBarrio(req: Request, res: Response): Promise<void>;
  contarPorBarrio(req: Request, res: Response): Promise<void>;
  obtenerPorCapitan(req: Request, res: Response): Promise<void>;
  obtenerPorId(req: Request, res: Response): Promise<void>;
  actualizar(req: Request, res: Response): Promise<void>;
  eliminar(req: Request, res: Response): Promise<void>;
}

export interface ICicloController extends IHttpController {
  obtenerProgresoTodos(req: Request, res: Response): Promise<void>;
  obtenerCiclosActivos(req: Request, res: Response): Promise<void>;
  obtenerEstadisticasGenerales(req: Request, res: Response): Promise<void>;
  obtenerEstadisticasCiclos(req: Request, res: Response): Promise<void>;
  obtenerCicloActivo(req: Request, res: Response): Promise<void>;
  obtenerProgresoBarrio(req: Request, res: Response): Promise<void>;
  obtenerHistorial(req: Request, res: Response): Promise<void>;
  crearNuevoCiclo(req: Request, res: Response): Promise<void>;
  obtenerProgresoCiclo(req: Request, res: Response): Promise<void>;
  completarCiclo(req: Request, res: Response): Promise<void>;
  pausarCiclo(req: Request, res: Response): Promise<void>;
  reactivarCiclo(req: Request, res: Response): Promise<void>;
}

export interface ISalidaController extends IHttpController {
  getAllSalidas(req: Request, res: Response): Promise<void>;
  getConfig(req: Request, res: Response): Promise<void>;
  getStats(req: Request, res: Response): Promise<void>;
  validateSalidaData(req: Request, res: Response): Promise<void>;
  getSalidasByCapitan(req: Request, res: Response): Promise<void>;
  getSalidasByBarrio(req: Request, res: Response): Promise<void>;
  getSalidaById(req: Request, res: Response): Promise<void>;
  createSalida(req: Request, res: Response): Promise<void>;
  updateSalida(req: Request, res: Response): Promise<void>;
  changeStatus(req: Request, res: Response): Promise<void>;
  deleteSalida(req: Request, res: Response): Promise<void>;
}

export interface ICapitanController extends IHttpController {
  getAllCapitanes(req: Request, res: Response): Promise<void>;
  getCapitanById(req: Request, res: Response): Promise<void>;
  createCapitan(req: Request, res: Response): Promise<void>;
  updateCapitan(req: Request, res: Response): Promise<void>;
  deleteCapitan(req: Request, res: Response): Promise<void>;
  searchCapitanes(req: Request, res: Response): Promise<void>;
  getStats(req: Request, res: Response): Promise<void>;
  validateCapitanData(req: Request, res: Response): Promise<void>;
  getConfig(req: Request, res: Response): Promise<void>;
}

export interface IManzanasController extends IHttpController {
  obtenerResumen(req: Request, res: Response): Promise<void>;
  obtenerEstadisticas(req: Request, res: Response): Promise<void>;
  inicializarAutoDescubrimiento(req: Request, res: Response): Promise<void>;
  obtenerManzanasBarrio(req: Request, res: Response): Promise<void>;
}

export interface IOptimizacionController extends IHttpController {
  getEstadisticasGlobales(req: Request, res: Response): Promise<void>;
  getRankingBarrios(req: Request, res: Response): Promise<void>;
  getTendenciasTemporales(req: Request, res: Response): Promise<void>;
  getCorrelacionReportesProgreso(req: Request, res: Response): Promise<void>;
  getAnalisisPerformance(req: Request, res: Response): Promise<void>;
  getInfo(req: Request, res: Response): Promise<void>;
}