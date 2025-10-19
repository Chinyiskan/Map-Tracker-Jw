// --- Protección de acceso ---
if (!sessionStorage.getItem('admin_logged')) {
    window.location.href = 'login.html';
}
// --- Importar módulos ---
import { UI } from './ui.js';
import { supabase } from './supabase.js';
import { BarriosProgressChart } from './barrios-progress-chart.js';
// --- Configuración de API ---
const API_BASE = '/api';
// Función para obtener estado desde el reporte (sin cálculos)
function calculateEstadoFromData(reporte) {
    if (reporte.estado && reporte.estado !== reporte.barrio) {
        return reporte.estado;
    }
    return 'Sin estado';
}
// --- Utilidades de fechas ---
function getDateRange(periodo) {
    const now = new Date();
    let start, end = new Date(now);
    if (periodo === 'mes')
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (periodo === 'semana') {
        const day = now.getDay() || 7;
        start = new Date(now);
        start.setDate(now.getDate() - day + 1);
    }
    else if (periodo === 'año')
        start = new Date(now.getFullYear(), 0, 1);
    else
        start = new Date(2000, 0, 1);
    return {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10)
    };
}
// --- Cargar barrios únicos ---
async function cargarBarrios() {
    try {
        const response = await fetch(`${API_BASE}/reportes`);
        const result = await response.json();
        if (!result.success) {
            UI.showNotification('Error al cargar barrios', 'error');
            return [];
        }
        return [...new Set(result.data.map(r => r.barrio))].sort();
    }
    catch (error) {
        console.error('Error al cargar barrios:', error);
        UI.showNotification('Error de conexión al cargar barrios', 'error');
        return [];
    }
}
async function poblarFiltros() {
    const barrios = await cargarBarrios();
    const selects = [document.getElementById('descarga-barrio')];
    selects.forEach(sel => {
        if (sel) {
            sel.innerHTML = '<option value="">Todos</option>' +
                barrios.map(b => `<option value="${b}">${b}</option>`).join('');
        }
    });
}
async function obtenerReportes({ barrio, periodo, estado }) {
    try {
        const { start, end } = getDateRange(periodo);
        // Construir parámetros de consulta (sin estado, se filtra localmente)
        const params = new URLSearchParams({
            start_date: start,
            end_date: end
        });
        if (barrio)
            params.append('barrio', barrio);
        const response = await fetch(`${API_BASE}/reportes?${params}`);
        const result = await response.json();
        if (!result.success) {
            console.error('API error:', result.error);
            UI.showNotification('Error al obtener reportes', 'error');
            return [];
        }
        let reportes = result.data || [];
        // Filtrar por estado usando el campo estado de la base de datos
        if (estado) {
            reportes = reportes.filter(reporte => {
                return reporte.estado === estado;
            });
        }
        // Ordenar por fecha descendente
        const ordenados = reportes.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
        console.log('API data ordenada y filtrada:', ordenados);
        return ordenados;
    }
    catch (error) {
        console.error('Error al obtener reportes:', error);
        UI.showNotification('Error de conexión al obtener reportes', 'error');
        return [];
    }
}
// Paleta de colores vivos amigable (Material, ColorBrewer, etc.)
// Paleta de colores para gráficas
const coloresGraficaBarrios = [
    'rgba(116, 185, 255, 0.8)', // Azul principal
    'rgba(138, 43, 226, 0.8)', // Púrpura vibrante
    'rgba(255, 107, 107, 0.8)', // Rojo coral
    'rgba(72, 219, 251, 0.8)', // Cian brillante
    'rgba(255, 159, 67, 0.8)', // Naranja suave
    'rgba(129, 236, 236, 0.8)', // Turquesa
    'rgba(255, 118, 117, 0.8)', // Rosa coral
    'rgba(162, 155, 254, 0.8)', // Lavanda
    'rgba(255, 177, 66, 0.8)', // Ámbar
    'rgba(85, 239, 196, 0.8)', // Verde menta
    'rgba(255, 121, 198, 0.8)', // Rosa vibrante
    'rgba(129, 207, 224, 0.8)', // Azul cielo
    'rgba(255, 195, 113, 0.8)', // Dorado suave
    'rgba(186, 220, 88, 0.8)', // Verde lima
    'rgba(223, 230, 233, 0.8)', // Gris claro
    'rgba(116, 185, 255, 0.6)' // Azul secundario
];
// Colores con efecto hover más intenso
const PALETA_BARRIOS_HOVER = [
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
// Instancia global del nuevo componente
let barriosProgressChart = null;
/**
 * Función actualizada para usar el nuevo componente de gráfico de barras horizontales
 * Implementación con diseño moderno y colores pastel
 */
async function actualizarGraficaBarrios(reportes) {
    console.log('🎯 Actualizando gráfico de progreso por barrios...');
    try {
        // Destruir instancia anterior si existe
        if (barriosProgressChart) {
            barriosProgressChart.destroy();
            barriosProgressChart = null;
        }
        // Crear nueva instancia con configuración optimizada
        barriosProgressChart = new BarriosProgressChart('grafica-barrios-container', {
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
        });
        console.log('✅ Nuevo gráfico de progreso inicializado correctamente');
    }
    catch (error) {
        console.error('❌ Error inicializando gráfico de progreso:', error);
        // Mostrar mensaje de error en el contenedor
        const container = document.getElementById('grafica-barrios-container');
        if (container) {
            container.innerHTML = `
        <div class="text-center p-lg text-muted">
          <p class="text-error">Error al cargar el gráfico de progreso</p>
          <small>${error.message}</small>
          <button onclick="actualizarGraficaBarrios()" class="btn btn--sm btn--secondary mt-sm">
            Reintentar
          </button>
        </div>
      `;
        }
    }
}
// Utilidad para grid color según tema
function getGridColor() {
    // Color de grid para tema oscuro
    return 'rgba(255, 255, 255, 0.1)';
}
function getTextColor() {
    return 'rgba(255, 255, 255, 0.8)';
}
// Doughnut chart de progreso mensual
let chartMes;
function actualizarGraficaMes(manzanasMes, totalTeorico) {
    console.log('actualizarGraficaMes llamada con:', manzanasMes, 'manzanas de', totalTeorico, 'total');
    const canvas = document.getElementById('grafica-mes');
    if (!canvas) {
        console.error('Canvas grafica-mes no encontrado');
        return;
    }
    const ctx = canvas.getContext('2d');
    const porcentaje = Math.min(100, Math.round((manzanasMes / totalTeorico) * 100));
    const data = [manzanasMes, Math.max(0, totalTeorico - manzanasMes)];
    const colores = [
        'rgba(116, 185, 255, 0.8)', // Azul principal
        'rgba(255, 255, 255, 0.1)' // Gris translúcido para restantes
    ];
    const coloresHover = [
        'rgba(116, 185, 255, 1.0)',
        'rgba(255, 255, 255, 0.15)'
    ];
    if (chartMes)
        chartMes.destroy();
    chartMes = new Chart(ctx, {
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
                        label: function (context) {
                            return context.label + ': ' + context.parsed + ' manzanas';
                        }
                    }
                },
                // Etiqueta central personalizada
                beforeDraw: function (chart) {
                    const { width, height, ctx } = chart;
                    ctx.save();
                    ctx.font = 'bold 2.2em sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = 'rgba(116, 185, 255, 1.0)';
                    ctx.shadowColor = 'rgba(116, 185, 255, 0.5)';
                    ctx.shadowBlur = 10;
                    ctx.fillText(porcentaje + '%', width / 2, height / 2);
                    ctx.restore();
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
                afterDraw(chart) {
                    const { ctx, chartArea: { width, height } } = chart;
                    ctx.save();
                    ctx.font = 'bold 2.2em sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = 'rgba(116, 185, 255, 1.0)';
                    ctx.shadowColor = 'rgba(116, 185, 255, 0.5)';
                    ctx.shadowBlur = 10;
                    ctx.fillText(porcentaje + '%', chart.width / 2, chart.height / 2);
                    ctx.restore();
                }
            }]
    });
}
function actualizarProgresoMes(reportes, totalTeorico = 1000) {
    const now = new Date();
    const mes = now.toISOString().slice(0, 7);
    // Mostrar el mes actual en formato largo (ej: Julio 2025)
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesNombre = meses[now.getMonth()] + ' ' + now.getFullYear();
    const mesActualElem = document.getElementById('mes-actual');
    if (mesActualElem)
        mesActualElem.textContent = `(${mesNombre})`;
    // CORREGIDO: Solo contar manzanas del mes actual (se reinicia mensualmente)
    const reportesDelMes = reportes.filter(r => r.fecha.startsWith(mes));
    const manzanasDelMes = new Set();
    reportesDelMes.forEach(reporte => {
        if (reporte.manzanas) {
            const manzanas = reporte.manzanas.split(',').map(m => m.trim()).filter(m => m);
            manzanas.forEach(manzana => manzanasDelMes.add(manzana));
        }
    });
    // Manzanas reportadas este mes (se reinicia cada mes)
    const manzanasEsteMes = manzanasDelMes.size;
    // Calcular porcentaje del progreso mensual
    const porcentaje = Math.min(100, Math.round((manzanasEsteMes / totalTeorico) * 100));
    // Mensaje dinámico para el mes actual
    const mensaje = manzanasEsteMes > 0 ?
        `${manzanasEsteMes} manzanas trabajadas este mes` :
        'Ninguna manzana trabajada este mes';
    document.getElementById('progreso-mes').innerHTML = `
    <div style="font-size:1.3em;font-weight:600;">${mensaje}</div>
    <div style="margin-top:0.5em;">Progreso del mes: <strong>${porcentaje}%</strong></div>
    <div style="background:var(--input-bg);border-radius:8px;height:18px;margin-top:0.7em;">
      <div style="background:var(--accent-color);height:100%;border-radius:8px;width:${porcentaje}%;transition:width 0.5s;"></div>
    </div>`;
    // Calcular manzanas restantes para el mes
    const manzanasRestantes = Math.max(0, totalTeorico - manzanasEsteMes);
    // Mostrar manzanas restantes del mes
    const manzanasRestantesElement = document.getElementById('manzanas-restantes');
    if (manzanasRestantesElement) {
        if (manzanasEsteMes === 0) {
            manzanasRestantesElement.textContent = 'No hay actividad registrada este mes';
        }
        else if (manzanasRestantes > 0) {
            manzanasRestantesElement.textContent = `Quedan ${manzanasRestantes} manzanas por trabajar este mes`;
        }
        else {
            manzanasRestantesElement.textContent = '¡Meta mensual completada! 🎉';
        }
    }
    // Actualizar gráfica con el progreso mensual
    actualizarGraficaMes(manzanasEsteMes, totalTeorico);
}
function actualizarBarriosInactivos(reportes) {
    const diasInactivo = 30;
    const hoy = new Date();
    const barrios = [...new Set(reportes.map(r => r.barrio))];
    const inactivos = barrios.filter(b => {
        const ult = reportes.filter(r => r.barrio === b).map(r => r.fecha).sort().pop();
        if (!ult)
            return true;
        const diff = (hoy - new Date(ult)) / (1000 * 60 * 60 * 24);
        return diff > diasInactivo;
    });
    const ul = document.getElementById('barrios-inactivos');
    ul.innerHTML = inactivos.length ? inactivos.map(b => `<li>${b}</li>`).join('') : '<li>Ninguno 🎉</li>';
}
// FUNCIÓN DESHABILITADA: Esta función causaba conflicto con admin.js
// La tabla de reportes ahora es manejada exclusivamente por AdminManager
/*
function mostrarTabla(reportes) {
  // Esta función ha sido deshabilitada para evitar conflictos
  // con la tabla de reportes manejada por AdminManager
  return;
}
*/
// Función mostrarTabla eliminada para evitar conflictos con AdminManager
// La tabla de reportes es manejada exclusivamente por admin.js
/**
 * Mostrar modal de parámetros para exportación
 */
function mostrarModalExportacion() {
    const modalContent = `
    <div class="export-modal-content">
      <div class="form-group mb-md">
        <label for="export-fecha" class="form-label">Fecha del informe</label>
        <select id="export-fecha" class="form-input form-select" required>
          <option value="" disabled selected>Selecciona el período</option>
          <option value="mes-actual">Mes actual</option>
          <option value="mes-anterior">Mes anterior</option>
          <option value="año-actual">Año actual (2025)</option>
          <option value="año-anterior">Año anterior (2024)</option>
          <option value="todo">Todos los datos</option>
        </select>
      </div>
      
      <div class="form-group mb-md">
        <label for="export-barrio" class="form-label">Barrio</label>
        <select id="export-barrio" class="form-input form-select" required>
          <option value="" selected>Todos los barrios</option>
          <option value="Acacios">Acacios</option>
          <option value="Alcala">Alcala</option>
          <option value="Ciudad Jardin">Ciudad Jardín</option>
          <option value="Guaimaral">Guaimaral</option>
          <option value="La Mar y Gratamira">La Mar y Gratamira</option>
          <option value="Niza">Niza</option>
          <option value="Prados Norte">Prados Norte</option>
          <option value="Proceres">Próceres</option>
          <option value="San Eduardo">San Eduardo</option>
          <option value="Santa Elena">Santa Elena</option>
          <option value="Tasajero">Tasajero</option>
          <option value="Zulima">Zulima</option>
        </select>
      </div>
      
      <div class="text-sm text-secondary mt-md">
        <strong>Nota:</strong> El archivo Excel se generará con los datos filtrados según los parámetros seleccionados.
      </div>
    </div>
  `;
    UI.createModal('Exportar a Excel', modalContent, {
        size: 'medium',
        confirmText: 'Exportar',
        cancelText: 'Cancelar',
        onConfirm: async () => {
            const fechaSeleccionada = document.getElementById('export-fecha').value;
            const barrioSeleccionado = document.getElementById('export-barrio').value;
            if (!fechaSeleccionada) {
                UI.showNotification('Por favor selecciona un período de fecha', 'warning');
                return false; // No cerrar el modal
            }
            // Mostrar indicador de carga
            UI.showNotification('Generando archivo Excel...', 'info', 2000);
            // Obtener reportes filtrados y exportar
            await exportarExcelConFiltros(fechaSeleccionada, barrioSeleccionado);
            return true; // Cerrar el modal
        }
    });
}
/**
 * Exportar Excel con filtros específicos
 */
async function exportarExcelConFiltros(fechaFiltro, barrioFiltro) {
    try {
        // Obtener reportes filtrados
        const filtros = construirFiltrosFecha(fechaFiltro);
        if (barrioFiltro) {
            filtros.barrio = barrioFiltro;
        }
        const reportes = await obtenerReportes(filtros);
        if (!reportes || reportes.length === 0) {
            UI.showNotification('No se encontraron datos para los filtros seleccionados', 'warning');
            return;
        }
        // Exportar con los datos filtrados
        await exportarExcel(reportes, fechaFiltro, barrioFiltro);
    }
    catch (error) {
        console.error('Error al exportar con filtros:', error);
        UI.showNotification('Error al generar el archivo Excel', 'error');
    }
}
/**
 * Construir filtros de fecha según la selección
 */
function construirFiltrosFecha(fechaFiltro) {
    const ahora = new Date();
    const filtros = {};
    switch (fechaFiltro) {
        case 'mes-actual':
            filtros.periodo = 'mes';
            break;
        case 'mes-anterior':
            const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
            filtros.fechaInicio = mesAnterior.toISOString().split('T')[0];
            const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0);
            filtros.fechaFin = finMesAnterior.toISOString().split('T')[0];
            break;
        case 'año-actual':
            filtros.periodo = 'año';
            break;
        case 'año-anterior':
            filtros.fechaInicio = `${ahora.getFullYear() - 1}-01-01`;
            filtros.fechaFin = `${ahora.getFullYear() - 1}-12-31`;
            break;
        case 'todo':
            // Sin filtros de fecha
            break;
    }
    return filtros;
}
async function exportarExcel(reportes, fechaFiltro = '', barrioFiltro = '') {
    if (typeof ExcelJS === 'undefined') {
        UI.showNotification('La librería ExcelJS no está cargada', 'error');
        return;
    }
    try {
        // Crear un nuevo libro de trabajo
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistema de Reportes JW';
        workbook.created = new Date();
        // Crear una hoja de trabajo
        const worksheet = workbook.addWorksheet('Reportes');
        // Configurar las columnas (orden actualizado según la tabla)
        worksheet.columns = [
            { header: 'Fecha', key: 'fecha', width: 15 },
            { header: 'Capitán', key: 'capitan', width: 25 },
            { header: 'Manzanas', key: 'manzanas', width: 30 },
            { header: 'Estado', key: 'estado', width: 15 },
            { header: 'Barrio', key: 'barrio', width: 20 },
            { header: 'Observaciones', key: 'observaciones', width: 40 }
        ];
        // Función auxiliar para formatear manzanas
        function formatManzanasExcel(manzanas) {
            if (!manzanas)
                return '-';
            if (typeof manzanas === 'string') {
                return manzanas.split(',').map(m => m.trim()).filter(m => m).join(', ');
            }
            return manzanas.toString();
        }
        // Función auxiliar para estado en Excel (sin cálculos)
        function calculateEstadoExcel(reporte) {
            return (reporte.estado && reporte.estado !== reporte.barrio) ? reporte.estado : 'Sin estado';
        }
        // Agregar los datos
        reportes.forEach(reporte => {
            worksheet.addRow({
                fecha: reporte.fecha || '-',
                capitan: reporte.nombre_capitan || reporte.nombre || reporte.capitan || '-',
                manzanas: formatManzanasExcel(reporte.manzanas),
                estado: calculateEstadoExcel(reporte),
                barrio: reporte.barrio || '-',
                observaciones: reporte.observaciones || '-'
            });
        });
        // Estilo para el encabezado
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6F3FF' }
        };
        // Generar el archivo y descargarlo
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        // Crear nombre de archivo descriptivo
        const fechaActual = new Date().toISOString().split('T')[0];
        let nombreArchivo = 'reporte_manzanas';
        if (fechaFiltro) {
            const descripcionesFecha = {
                'mes-actual': 'mes_actual',
                'mes-anterior': 'mes_anterior',
                'año-actual': '2025',
                'año-anterior': '2024',
                'todo': 'completo'
            };
            nombreArchivo += `_${descripcionesFecha[fechaFiltro] || fechaFiltro}`;
        }
        if (barrioFiltro) {
            nombreArchivo += `_${barrioFiltro.replace(/\s+/g, '_').toLowerCase()}`;
        }
        nombreArchivo += `_${fechaActual}.xlsx`;
        // Crear enlace de descarga
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        // Mostrar notificación de éxito
        UI.showNotification(`Archivo Excel generado: ${nombreArchivo}`, 'success', 4000);
    }
    catch (error) {
        console.error('Error al exportar Excel:', error);
        UI.showNotification('Error al generar el archivo Excel. Por favor, inténtalo de nuevo.', 'error');
    }
}
async function actualizarDashboard() {
    try {
        // Sin filtros, obtener todos los reportes del mes actual
        const barrio = '';
        const periodo = 'mes';
        const estado = '';
        const reportes = await obtenerReportes({ barrio, periodo, estado });
        console.log('Reportes obtenidos:', reportes);
        await actualizarGraficaBarrios(reportes);
        actualizarProgresoMes(reportes);
        await mostrarDesequilibrio(reportes);
        // ELIMINADO: Notificaciones que causaban duplicados
        // AdminManager ya maneja las notificaciones de inicialización
    }
    catch (error) {
        console.error('Error al actualizar dashboard:', error);
        // ELIMINADO: Notificación de error duplicada
        // AdminManager ya maneja los errores de inicialización
        throw error; // Re-lanzar para que AdminManager lo maneje
    }
}
// Exportar funciones necesarias para AdminManager
export { actualizarGraficaBarrios, actualizarProgresoMes, poblarFiltros, actualizarTablaDescarga, obtenerReportes, setupDashboardEventListeners };
// Función actualizada para mostrar el desequilibrio territorial
// CORREGIDO: Usa nueva lógica de ciclos y frecuencia de trabajo territorial
export async function mostrarDesequilibrio(reportes) {
    const container = document.getElementById('lista-desequilibrio');
    if (!container)
        return;
    try {
        // Actualizar el período mostrado
        const periodoElement = document.getElementById('periodo-desequilibrio');
        if (periodoElement) {
            const fechaActual = new Date();
            const nombreMes = fechaActual.toLocaleDateString('es-ES', { month: 'long' });
            const año = fechaActual.getFullYear();
            periodoElement.textContent = `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${año}`;
        }
        // Mostrar indicador de carga
        container.innerHTML = '<li class="text-center text-muted">Calculando desequilibrio territorial...</li>';
        // Obtener datos de progreso de todos los barrios usando la nueva API
        const response = await fetch('/api/ciclos/progreso');
        if (!response.ok) {
            throw new Error(`Error al obtener datos de ciclos: ${response.status}`);
        }
        const result = await response.json();
        if (!result.success || !result.data) {
            throw new Error('Respuesta inválida del servidor');
        }
        // Calcular frecuencia de trabajo territorial del MES ACTUAL
        const fechaActual = new Date();
        const mesActual = fechaActual.getMonth() + 1; // 1-12
        const añoActual = fechaActual.getFullYear();
        // Obtener reportes del mes actual para cada barrio
        const barriosData = await Promise.all(result.data.map(async (barrio) => {
            try {
                // Obtener reportes del mes actual para este barrio
                const reportesResponse = await fetch(`/api/reportes?barrio=${encodeURIComponent(barrio.barrio)}&periodo=mes`);
                const reportesResult = await reportesResponse.json();
                let territoriosDelMesActual = 0;
                if (reportesResult.success && reportesResult.data) {
                    // Filtrar reportes del mes actual
                    const reportesDelMes = reportesResult.data.filter(reporte => {
                        const fechaReporte = new Date(reporte.fecha);
                        return fechaReporte.getMonth() + 1 === mesActual &&
                            fechaReporte.getFullYear() === añoActual;
                    });
                    // Contar territorios únicos trabajados en el mes actual
                    const territoriosUnicos = new Set();
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
                let estado = '🟢'; // Normal
                let descripcion = 'predicación equilibrada';
                if (territoriosDelMesActual === 0) {
                    estado = '🔴';
                    descripcion = 'muy poca predicación';
                }
                else if (desviacion > 0.5) {
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
            }
            catch (error) {
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
                    estado: '🔴',
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
    }
    catch (error) {
        console.error('❌ Error al calcular desequilibrio territorial:', error);
        // Fallback a lógica antigua si falla la nueva
        console.log('🔄 Usando fallback con lógica de reportes...');
        mostrarDesequilibrioFallback(reportes, container);
    }
}
// Función de fallback con la lógica anterior
function mostrarDesequilibrioFallback(reportes, container) {
    // Unificar nombres de barrio para el ranking
    function normalizarBarrio(nombre) {
        return nombre.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    }
    const barrioMap = {};
    reportes.forEach(r => {
        const norm = normalizarBarrio(r.barrio);
        if (!barrioMap[norm])
            barrioMap[norm] = [];
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
        let estado = '🟢'; // Normal
        if (desviacion > 0.2)
            estado = '🟡';
        else if (desviacion < -0.2)
            estado = '🔴';
        return { ...b, estado };
    }).sort((a, b) => b.cantidad - a.cantidad);
    container.innerHTML = clasificados.map(b => `<li class="desequilibrio-${b.estado === '🟢' ? 'normal' : b.estado === '🟡' ? 'alto' : 'bajo'}">${b.estado} <strong>${b.barrio}</strong>: ${b.cantidad} reportes (fallback)</li>`).join('');
}
async function actualizarTablaDescarga() {
    const barrio = document.getElementById('descarga-barrio').value;
    const periodo = document.getElementById('descarga-periodo').value;
    const estado = document.getElementById('descarga-estado').value;
    const reportes = await obtenerReportes({ barrio, periodo, estado });
    // Actualizar la tabla usando AdminManager
    if (window.AdminManager && typeof window.AdminManager._renderReportesTable === 'function') {
        window.AdminManager._renderReportesTable(reportes);
    }
    // Configurar botón de exportar con modal de parámetros
    document.getElementById('btn-exportar-pdf').onclick = () => mostrarModalExportacion();
}
// ELIMINADO: DOMContentLoaded duplicado que causaba popups repetidos
// AdminManager ya maneja toda la inicialización del panel administrativo
// Esta función se ejecutaba en paralelo con AdminManager.init() causando notificaciones duplicadas
// Función para configurar event listeners específicos de dashboard
function setupDashboardEventListeners() {
    // Event listeners para los filtros de descarga (auto-reload según mejores prácticas UX)
    const filtroBarrio = document.getElementById('descarga-barrio');
    const filtroPeriodo = document.getElementById('descarga-periodo');
    const filtroEstado = document.getElementById('descarga-estado');
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
//# sourceMappingURL=dashboard.js.map