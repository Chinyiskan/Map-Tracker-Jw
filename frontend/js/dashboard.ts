/**
 * Dashboard TypeScript - Migración completa del panel de control
 * Incluye tipado estricto para todas las funciones y APIs
 */

// --- Protección de acceso ---
if (!sessionStorage.getItem('admin_logged')) {
  window.location.href = 'login.html';
}

// --- Importaciones tipadas ---
import { UI } from './utils/ui.js';
import { supabase } from './supabase.js';
import { BarriosProgressChart } from './barrios-progress-chart.js';
import type { 
  ApiResponse, 
  ReporteAPI, 
  CicloProgresoAPI,
  DashboardFilters,
  DateRange,
  BarrioDesequilibrio,
  BarriosProgressChartConfig,
  ChartInstance
} from './types/index.js';

// --- Configuración de API ---
const API_BASE: string = '/api';

/**
 * Función para obtener estado desde el reporte (sin cálculos)
 */
function calculateEstadoFromData(reporte: ReporteAPI): string {
  if (reporte.estado && reporte.estado !== reporte.barrio) {
    return reporte.estado;
  }
  return 'Sin estado';
}

/**
 * Utilidades de fechas tipadas
 */
function getDateRange(periodo: DashboardFilters['periodo']): DateRange {
  const now = new Date();
  let start: Date;
  const end = new Date(now);
  
  if (periodo === 'mes') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (periodo === 'semana') {
    const day = now.getDay() || 7;
    start = new Date(now);
    start.setDate(now.getDate() - day + 1);
  } else if (periodo === 'año') {
    start = new Date(now.getFullYear(), 0, 1);
  } else {
    start = new Date(2000, 0, 1);
  }
  
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };
}

/**
 * Cargar barrios únicos con tipado estricto
 */
async function cargarBarrios(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE}/reportes`);
    const result: ApiResponse<ReporteAPI[]> = await response.json();
    
    if (!result.success) {
      UI.showNotification('Error al cargar barrios', 'error');
      return [];
    }
    
    const barrios = result.data?.map(r => r.barrio) || [];
    const uniqueBarrios = Array.from(new Set(barrios));
    return uniqueBarrios.sort();
  } catch (error) {
    console.error('Error al cargar barrios:', error);
    UI.showNotification('Error de conexión al cargar barrios', 'error');
    return [];
  }
}

/**
 * Poblar filtros con barrios disponibles
 */
async function poblarFiltros(): Promise<void> {
  const barrios = await cargarBarrios();
  const selects = [document.getElementById('descarga-barrio') as HTMLSelectElement];
  
  selects.forEach(sel => {
    if (sel) {
      sel.innerHTML = '<option value="">Todos</option>' +
        barrios.map(b => `<option value="${b}">${b}</option>`).join('');
    }
  });
}

/**
 * Obtener reportes con filtros tipados
 */
async function obtenerReportes(filters: DashboardFilters): Promise<ReporteAPI[]> {
  try {
    const { start, end } = getDateRange(filters.periodo);
    
    // Construir parámetros de consulta (sin estado, se filtra localmente)
    const params = new URLSearchParams({
      start_date: start,
      end_date: end
    });
    
    if (filters.barrio) {
      params.append('barrio', filters.barrio);
    }
    
    const response = await fetch(`${API_BASE}/reportes?${params}`);
    const result: ApiResponse<ReporteAPI[]> = await response.json();
    
    if (!result.success) {
      console.error('API error:', result.error);
      UI.showNotification('Error al obtener reportes', 'error');
      return [];
    }
    
    let reportes = result.data || [];
    
    // Filtrar por estado usando el campo estado de la base de datos
    if (filters.estado) {
      reportes = reportes.filter(reporte => reporte.estado === filters.estado);
    }
    
    // Ordenar por fecha descendente
    const ordenados = reportes.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
    console.log('API data ordenada y filtrada:', ordenados);
    return ordenados;
  } catch (error) {
    console.error('Error al obtener reportes:', error);
    UI.showNotification('Error de conexión al obtener reportes', 'error');
    return [];
  }
}

// Paleta de colores para gráficas (tipada)
const coloresGraficaBarrios: string[] = [
  'rgba(116, 185, 255, 0.8)',  // Azul principal
  'rgba(138, 43, 226, 0.8)',   // Púrpura vibrante
  'rgba(255, 107, 107, 0.8)',  // Rojo coral
  'rgba(72, 219, 251, 0.8)',   // Cian brillante
  'rgba(255, 159, 67, 0.8)',   // Naranja suave
  'rgba(129, 236, 236, 0.8)',  // Turquesa
  'rgba(255, 118, 117, 0.8)',  // Rosa coral
  'rgba(162, 155, 254, 0.8)',  // Lavanda
  'rgba(255, 177, 66, 0.8)',   // Ámbar
  'rgba(85, 239, 196, 0.8)',   // Verde menta
  'rgba(255, 121, 198, 0.8)',  // Rosa vibrante
  'rgba(129, 207, 224, 0.8)',  // Azul cielo
  'rgba(255, 195, 113, 0.8)',  // Dorado suave
  'rgba(186, 220, 88, 0.8)',   // Verde lima
  'rgba(223, 230, 233, 0.8)',  // Gris claro
  'rgba(116, 185, 255, 0.6)'   // Azul secundario
];

// Colores con efecto hover más intenso
const PALETA_BARRIOS_HOVER: string[] = [
  'rgba(116, 185, 255, 1.0)',
  'rgba(138, 43, 226, 1.0)',
  'rgba(255, 107, 107, 1.0)',
  'rgba(72, 219, 251, 1.0)',
  'rgba(255, 159, 67, 1.0)',
  'rgba(129, 236, 236, 1.0)',
  'rgba(255, 118, 117, 1.0)',
  'rgba(162, 155, 254, 1.0)',
  'rgba(255, 177, 66, 1.0)',
  'rgba(85, 239, 196, 1.0)',
  'rgba(255, 121, 198, 1.0)',
  'rgba(129, 207, 224, 1.0)',
  'rgba(255, 195, 113, 1.0)',
  'rgba(186, 220, 88, 1.0)',
  'rgba(223, 230, 233, 1.0)',
  'rgba(116, 185, 255, 0.8)'
];

// Instancia global del nuevo componente (tipada)
let barriosProgressChart: ChartInstance | null = null;

/**
 * Función actualizada para usar el nuevo componente de gráfico de barras horizontales
 * Implementación con diseño moderno y colores pastel
 */
async function actualizarGraficaBarrios(reportes?: ReporteAPI[]): Promise<void> {
  console.log('🎯 Actualizando gráfico de progreso por barrios...');
  
  try {
    // Destruir instancia anterior si existe
    if (barriosProgressChart) {
      barriosProgressChart.destroy();
      barriosProgressChart = null;
    }
    
    // Crear nueva instancia con configuración optimizada
    const config: BarriosProgressChartConfig = {
      // Configuración de API optimizada
      api: {
        endpoint: '/api/ciclos/progreso',
        timeout: 8000 // 8 segundos para permitir carga completa
      },
      
      // Tema coherente con la aplicación
      theme: 'light',
      
      // Animaciones habilitadas
      animations: true,
      
      // Auto-refresh cada 30 segundos
      autoRefresh: true,
      refreshInterval: 30000,
      
      // Mostrar estadísticas
      showStats: true
    };
    
    barriosProgressChart = new BarriosProgressChart('grafica-barrios-container', config);
    
    console.log('✅ Nuevo gráfico de progreso inicializado correctamente');
    
  } catch (error) {
    console.error('❌ Error inicializando gráfico de progreso:', error);
    
    // Mostrar mensaje de error en el contenedor
    const container = document.getElementById('grafica-barrios-container');
    if (container) {
      container.innerHTML = `
        <div class="text-center p-lg text-muted">
          <p class="text-error">Error al cargar el gráfico de progreso</p>
          <small>${(error as Error).message}</small>
          <button onclick="actualizarGraficaBarrios()" class="btn btn--sm btn--secondary mt-sm">
            Reintentar
          </button>
        </div>
      `;
    }
  }
}

/**
 * Utilidades para grid color según tema
 */
function getGridColor(): string {
  // Color de grid para tema oscuro
  return 'rgba(255, 255, 255, 0.1)';
}

function getTextColor(): string {
  return 'rgba(255, 255, 255, 0.8)';
}

// Doughnut chart de progreso mensual (tipado)
let chartMes: ChartInstance | null = null;

function actualizarGraficaMes(manzanasMes: number, totalTeorico: number): void {
  console.log('actualizarGraficaMes llamada con:', manzanasMes, 'manzanas de', totalTeorico, 'total');
  
  const canvas = document.getElementById('grafica-mes') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas grafica-mes no encontrado');
    return;
  }
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('No se pudo obtener el contexto 2D del canvas');
    return;
  }
  
  const porcentaje = Math.min(100, Math.round((manzanasMes / totalTeorico) * 100));
  const data = [manzanasMes, Math.max(0, totalTeorico - manzanasMes)];
  const colores = [ 
    'rgba(116, 185, 255, 0.8)',  // Azul principal
    'rgba(255, 255, 255, 0.1)'   // Gris translúcido para restantes
  ];
  const coloresHover = [
    'rgba(116, 185, 255, 1.0)',
    'rgba(255, 255, 255, 0.15)'
  ];
  
  if (chartMes) {
    chartMes.destroy();
  }
  
  chartMes = new window.Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Reportadas', 'Restantes'],
      datasets: [{
        data,
        backgroundColor: colores,
        hoverBackgroundColor: coloresHover,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 2,
        hoverBorderWidth: 3
      }]
    },
    options: {
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'rgba(255, 255, 255, 0.9)',
          bodyColor: 'rgba(255, 255, 255, 0.8)',
          borderColor: 'rgba(116, 185, 255, 0.5)',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: function(context: any) {
              return context.label + ': ' + context.parsed + ' manzanas';
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        duration: 1200,
        easing: 'easeOutQuart'
      }
    },
    plugins: [{
      id: 'center-label',
      afterDraw(chart: any) {
        const {ctx, chartArea: {width, height}} = chart;
        ctx.save();
        ctx.font = 'bold 2.2em sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(116, 185, 255, 1.0)';
        ctx.shadowColor = 'rgba(116, 185, 255, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText(porcentaje + '%', width/2, height/2);
        ctx.restore();
      }
    }]
  });
}

/**
 * Mostrar desequilibrio territorial con tipado completo
 */
async function mostrarDesequilibrioTerritorial(reportes: ReporteAPI[]): Promise<void> {
  const container = document.getElementById('desequilibrio-territorial');
  if (!container) {
    console.warn('⚠️ Contenedor desequilibrio-territorial no encontrado');
    return;
  }

  try {
    console.log('🔍 Calculando desequilibrio territorial optimizado...');
    
    // Obtener datos de progreso de ciclos desde la API optimizada
    const response = await fetch('/api/ciclos/progreso');
    const result: ApiResponse<CicloProgresoAPI[]> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error('No se pudieron obtener datos de progreso de ciclos');
    }
    
    // Obtener fecha actual para cálculos
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1;
    const añoActual = fechaActual.getFullYear();
    
    // Procesar cada barrio con datos de actividad del mes actual
    const barriosData: BarrioDesequilibrio[] = await Promise.all(result.data.map(async (barrio) => {
      try {
        // Obtener reportes del mes actual para este barrio
        const reportesResponse = await fetch(`/api/reportes?barrio=${encodeURIComponent(barrio.barrio)}&periodo=mes`);
        const reportesResult: ApiResponse<ReporteAPI[]> = await reportesResponse.json();
        
        let territoriosDelMesActual = 0;
        
        if (reportesResult.success && reportesResult.data) {
          // Filtrar reportes del mes actual
          const reportesDelMes = reportesResult.data.filter(reporte => {
            const fechaReporte = new Date(reporte.fecha);
            return fechaReporte.getMonth() + 1 === mesActual && 
                   fechaReporte.getFullYear() === añoActual;
          });
          
          // Contar territorios únicos trabajados en el mes actual
          const territoriosUnicos = new Set<string>();
          reportesDelMes.forEach(reporte => {
            if (reporte.manzanas) {
              const manzanas = reporte.manzanas.toString().split(',');
              manzanas.forEach(manzana => {
                territoriosUnicos.add(manzana.trim());
              });
            }
          });
          
          territoriosDelMesActual = territoriosUnicos.size;
        }
        
        const totalTerritorios = barrio.total_territorios || 1;
        
        // Frecuencia esperada: aproximadamente 1/3 del territorio por mes (ciclo de 3 meses)
        const frecuenciaEsperada = totalTerritorios / 3;
        
        // Calcular desviación basada en actividad del mes actual
        const desviacion = frecuenciaEsperada > 0 ? 
          (territoriosDelMesActual - frecuenciaEsperada) / frecuenciaEsperada : -1;
        
        // Determinar estado basado en la actividad del mes actual
        let estado: BarrioDesequilibrio['estado'] = '🟢'; // Normal
        let descripcion = 'predicación equilibrada';
        
        if (territoriosDelMesActual === 0) {
          estado = '🔴';
          descripcion = 'muy poca predicación';
        } else if (desviacion > 0.5) {
          estado = '🟡';
          descripcion = 'exceso de predicación';
        }
        
        return {
          barrio: barrio.barrio,
          frecuenciaMensual: territoriosDelMesActual,
          frecuenciaEsperada: Math.round(frecuenciaEsperada * 10) / 10,
          progresoPorcentaje: barrio.progreso_porcentaje || 0,
          territoriosCompletados: barrio.territorios_completados || 0,
          totalTerritorios,
          diasTranscurridos: barrio.dias_transcurridos || 0,
          estado,
          descripcion,
          desviacion,
          territoriosDelMesActual
        };
        
      } catch (error) {
        console.warn(`⚠️ Error obteniendo reportes para ${barrio.barrio}:`, error);
        
        // Fallback: sin actividad en el mes actual
        return {
          barrio: barrio.barrio,
          frecuenciaMensual: 0,
          frecuenciaEsperada: Math.round((barrio.total_territorios || 1) / 3 * 10) / 10,
          progresoPorcentaje: barrio.progreso_porcentaje || 0,
          territoriosCompletados: barrio.territorios_completados || 0,
          totalTerritorios: barrio.total_territorios || 1,
          diasTranscurridos: barrio.dias_transcurridos || 0,
          estado: '🔴' as const,
          descripcion: 'muy poca predicación',
          desviacion: -1,
          territoriosDelMesActual: 0
        };
      }
    }));
   
    // Ordenar por desviación (más problemáticos primero)
    const clasificados = barriosData.sort((a, b) => {
      // Primero los rojos, luego amarillos, luego verdes
      if (a.estado !== b.estado) {
        const orden = { '🔴': 0, '🟡': 1, '🟢': 2 };
        return orden[a.estado] - orden[b.estado];
      }
      // Dentro del mismo estado, ordenar por desviación absoluta
      return Math.abs(b.desviacion) - Math.abs(a.desviacion);
    });
    
    // Renderizar resultados
    if (clasificados.length === 0) {
      container.innerHTML = '<li class="text-center text-muted">No hay datos de ciclos disponibles</li>';
      return;
    }
    
    container.innerHTML = clasificados.map(b => {
        const actividadTexto = b.territoriosDelMesActual > 0 ? 
          `${b.territoriosDelMesActual} territorios` : 
          'Sin actividad';
        
        return `<li class="desequilibrio-${b.estado === '🟢' ? 'normal' : b.estado === '🟡' ? 'alto' : 'bajo'}">
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-xs">
              ${b.estado} <strong>${b.barrio}</strong>
            </span>
            <span class="text-sm text-secondary">${actividadTexto}</span>
          </div>
        </li>`;
      }).join('');
    
  } catch (error) {
    console.error('❌ Error al calcular desequilibrio territorial:', error);
    
    // Fallback a lógica antigua si falla la nueva
    console.log('🔄 Usando fallback con lógica de reportes...');
    mostrarDesequilibrioFallback(reportes, container);
  }
}

/**
 * Función de fallback con la lógica anterior (tipada)
 */
function mostrarDesequilibrioFallback(reportes: ReporteAPI[], container: HTMLElement): void {
  // Unificar nombres de barrio para el ranking
  function normalizarBarrio(nombre: string): string {
    return nombre.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  }
  
  const barrioMap: Record<string, ReporteAPI[]> = {};
  reportes.forEach(r => {
    const norm = normalizarBarrio(r.barrio);
    if (!barrioMap[norm]) barrioMap[norm] = [];
    barrioMap[norm].push(r);
  });
  
  const barrios = Object.keys(barrioMap);
  const conteos = barrios.map(b => ({
    barrio: b,
    cantidad: barrioMap[b].length
  }));
  
  const total = conteos.reduce((acc, b) => acc + b.cantidad, 0);
  const promedio = barrios.length ? total / barrios.length : 0;
  
  const clasificados = conteos.map(b => {
    const desviacion = promedio ? (b.cantidad - promedio) / promedio : 0;
    let estado: '🟢' | '🟡' | '🔴' = '🟢'; // Normal
    if (desviacion > 0.2) estado = '🟡';
    else if (desviacion < -0.2) estado = '🔴';
    return { ...b, estado };
  }).sort((a, b) => b.cantidad - a.cantidad);
  
  container.innerHTML = clasificados.map(b =>
    `<li class="desequilibrio-${b.estado === '🟢' ? 'normal' : b.estado === '🟡' ? 'alto' : 'bajo'}">${b.estado} <strong>${b.barrio}</strong>: ${b.cantidad} reportes (fallback)</li>`
  ).join('');
}

/**
 * Actualizar tabla de descarga con tipado
 */
async function actualizarTablaDescarga(): Promise<void> {
  const barrioElement = document.getElementById('descarga-barrio') as HTMLSelectElement;
  const periodoElement = document.getElementById('descarga-periodo') as HTMLSelectElement;
  const estadoElement = document.getElementById('descarga-estado') as HTMLSelectElement;
  
  const filters: DashboardFilters = {
    barrio: barrioElement?.value || undefined,
    periodo: (periodoElement?.value as DashboardFilters['periodo']) || 'mes',
    estado: estadoElement?.value || undefined
  };
  
  const reportes = await obtenerReportes(filters);
  
  // Actualizar la tabla usando AdminManager
  if (window.AdminManager && typeof window.AdminManager._renderReportesTable === 'function') {
    window.AdminManager._renderReportesTable(reportes);
  }
  
  // Configurar botón de exportar con modal de parámetros
  const btnExportar = document.getElementById('btn-exportar-pdf') as HTMLButtonElement;
  if (btnExportar) {
    btnExportar.onclick = () => mostrarModalExportacion();
  }
}

/**
 * Función para configurar event listeners específicos de dashboard
 */
function setupDashboardEventListeners(): void {
  // Event listeners para los filtros de descarga (auto-reload según mejores prácticas UX)
  const filtroBarrio = document.getElementById('descarga-barrio') as HTMLSelectElement;
  const filtroPeriodo = document.getElementById('descarga-periodo') as HTMLSelectElement;
  const filtroEstado = document.getElementById('descarga-estado') as HTMLSelectElement;
  
  if (filtroBarrio) {
    filtroBarrio.addEventListener('change', actualizarTablaDescarga);
  }
  
  if (filtroPeriodo) {
    filtroPeriodo.addEventListener('change', actualizarTablaDescarga);
  }
  
  if (filtroEstado) {
    filtroEstado.addEventListener('change', actualizarTablaDescarga);
  }
}

/**
 * Función placeholder para modal de exportación
 */
function mostrarModalExportacion(): void {
  console.log('Modal de exportación - función pendiente de implementación');
  UI.showNotification('Función de exportación en desarrollo', 'info');
}

// Exportar funciones principales para uso global
(window as any).actualizarGraficaBarrios = actualizarGraficaBarrios;
(window as any).setupDashboardEventListeners = setupDashboardEventListeners;
(window as any).actualizarTablaDescarga = actualizarTablaDescarga;
(window as any).mostrarDesequilibrioTerritorial = mostrarDesequilibrioTerritorial;
// Exportaciones explícitas para módulos TypeScript
export {
  calculateEstadoFromData,
  getDateRange,
  cargarBarrios,
  poblarFiltros,
  obtenerReportes,
  actualizarGraficaBarrios,
  actualizarGraficaMes,
  mostrarDesequilibrioTerritorial as mostrarDesequilibrio,
  actualizarTablaDescarga,
  setupDashboardEventListeners
};
