// Importar utilidades JSON
import { JSONUtils } from './json-utils.js';

// Configuración inicial
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  
  // Botones de la pantalla principal (Home)
  const btnInformar = document.getElementById('btn-informar');
  if (btnInformar) {
    btnInformar.addEventListener('click', () => {
      window.location.href = 'reportes.html';
    });
  }
  
  const btnConsultar = document.getElementById('btn-consultar');
  if (btnConsultar) {
    btnConsultar.addEventListener('click', () => {
      window.location.href = 'consulta.html';
    });
  }
  
  const btnVolverHome = document.getElementById('btn-volver-home');
  if (btnVolverHome) {
    btnVolverHome.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  // Barrios listados para grids
  const barrios = [
    { nombre: 'Acacios', archivo: 'Acacios.svg' },
    { nombre: 'Alcalá', archivo: 'Alcala.svg' },
    { nombre: 'Ciudad Jardín', archivo: 'Ciudad Jardin.svg' },
    { nombre: 'Guaimaral', archivo: 'Guaimaral.svg' },
    { nombre: 'La Mar y Gratamira', archivo: 'La Mar y Gratamira.svg' },
    { nombre: 'Niza', archivo: 'Niza.svg' },
    { nombre: 'Prados Norte', archivo: 'Prados Norte.svg' },
    { nombre: 'Próceres', archivo: 'Proceres.svg' },
    { nombre: 'San Eduardo', archivo: 'San Eduardo.svg' },
    { nombre: 'Santa Elena', archivo: 'Santa Elena.svg' },
    { nombre: 'Tasajero', archivo: 'Tasajero.svg' },
    { nombre: 'Zulima', archivo: 'Zulima.svg' }
  ].sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Población de cuadrícula para informar (Crear Reporte)
  const gridInformar = document.getElementById('barrios-grid-informar');
  if (gridInformar) {
    gridInformar.innerHTML = ''; // Limpiar
    barrios.forEach(barrio => {
      const btn = document.createElement('button');
      btn.className = 'btn-barrio';
      btn.textContent = barrio.nombre;
      btn.addEventListener('click', () => {
        // Guardar barrio en caché para compatibilidad legacy si es necesario
        JSONUtils.setToStorage('barrio', barrio);
        // Ir a mapa en modo reporte
        window.location.href = `mapa.html?modo=reporte&barrio=${encodeURIComponent(barrio.nombre)}`;
      });
      gridInformar.appendChild(btn);
    });
  }

  // Población de cuadrícula para consultar
  const gridConsultar = document.getElementById('barrios-grid-consultar');
  if (gridConsultar) {
    gridConsultar.innerHTML = ''; // Limpiar
    barrios.forEach(barrio => {
      const btn = document.createElement('button');
      btn.className = 'btn-barrio';
      btn.textContent = barrio.nombre;
      btn.addEventListener('click', () => {
        // Ir a mapa en modo consulta
        window.location.href = `mapa.html?modo=consulta&barrio=${encodeURIComponent(barrio.nombre)}`;
      });
      gridConsultar.appendChild(btn);
    });

    // Configuración de vista de Registro Completo
    const btnVerRegistro = document.getElementById('btn-ver-registro');
    const btnRegresarBarrios = document.getElementById('btn-regresar-barrios');
    const vistaBarrios = document.getElementById('vista-barrios');
    const vistaRegistro = document.getElementById('vista-registro');
    const card = document.getElementById('consulta-card');
    const title = document.getElementById('consulta-title');
    const subtitle = document.getElementById('consulta-subtitle');
    const searchInput = document.getElementById('buscar-registro');
    const barrioSelect = document.getElementById('filtro-barrio-registro');

    if (btnVerRegistro && btnRegresarBarrios && vistaBarrios && vistaRegistro) {
      btnVerRegistro.addEventListener('click', async () => {
        vistaBarrios.classList.add('hidden');
        vistaRegistro.classList.remove('hidden');
        if (card) card.style.maxWidth = '1000px';
        if (title) title.textContent = 'Registro Completo';
        if (subtitle) subtitle.textContent = 'Historial de todos los reportes de manzanas registrados';
        
        await cargarRegistroCompleto();
      });
      
      btnRegresarBarrios.addEventListener('click', () => {
        vistaRegistro.classList.add('hidden');
        vistaBarrios.classList.remove('hidden');
        if (card) card.style.maxWidth = '700px';
        if (title) title.textContent = 'Consultar Territorios';
        if (subtitle) subtitle.textContent = 'Elige el barrio que deseas consultar para revisar el estado actual de los mapas';
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', filtrarYRenderizarRegistro);
    }
    if (barrioSelect) {
      barrioSelect.addEventListener('change', filtrarYRenderizarRegistro);
    }

    async function cargarRegistroCompleto() {
      const tableBody = document.getElementById('tabla-registro-body');
      if (!tableBody) return;
      
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="table-cell" style="text-align: center; padding: var(--space-xl); color: var(--text-secondary);">
            Cargando base de datos...
          </td>
        </tr>
      `;
      
      try {
        const response = await fetch('/api/reportes');
        const result = await response.json();
        if (result.success) {
          allReports = result.data || [];
          poblarFiltroBarrios();
          filtrarYRenderizarRegistro();
        } else {
          tableBody.innerHTML = `
            <tr>
              <td colspan="6" class="table-cell" style="text-align: center; padding: var(--space-xl); color: var(--error);">
                Error al cargar los datos: ${result.error || 'Desconocido'}
              </td>
            </tr>
          `;
        }
      } catch (error) {
        console.error('Error al cargar registro:', error);
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" class="table-cell" style="text-align: center; padding: var(--space-xl); color: var(--error);">
              Error de conexión al cargar la base de datos.
            </td>
          </tr>
        `;
      }
    }

    function poblarFiltroBarrios() {
      if (!barrioSelect) return;
      const barriosUnicos = [...new Set(allReports.map(r => r.barrio).filter(Boolean))].sort();
      barrioSelect.innerHTML = '<option value="">Todos los barrios</option>' + 
        barriosUnicos.map(b => `<option value="${b}">${b}</option>`).join('');
    }

    function filtrarYRenderizarRegistro() {
      const tableBody = document.getElementById('tabla-registro-body');
      const infoElement = document.getElementById('registro-info');
      
      if (!tableBody) return;
      
      const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
      const selectedBarrio = barrioSelect ? barrioSelect.value : '';
      
      let filtered = allReports;
      
      if (selectedBarrio) {
        filtered = filtered.filter(r => r.barrio === selectedBarrio);
      }
      
      if (searchQuery) {
        filtered = filtered.filter(r => {
          const capitan = formatCapitanName(r).toLowerCase();
          const obs = (r.observaciones || '').toLowerCase();
          const manzanas = (r.manzanas || '').toLowerCase();
          return capitan.includes(searchQuery) || obs.includes(searchQuery) || manzanas.includes(searchQuery);
        });
      }
      
      if (filtered.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" class="table-cell" style="text-align: center; padding: var(--space-xl); color: var(--text-secondary);">
              No se encontraron registros coincidentes
            </td>
          </tr>
        `;
        if (infoElement) infoElement.textContent = 'Mostrando 0 de ' + allReports.length + ' registros';
        return;
      }
      
      tableBody.innerHTML = filtered.map(reporte => `
        <tr>
          <td class="table-cell">${formatDate(reporte.fecha)}</td>
          <td class="table-cell">${reporte.barrio || '-'}</td>
          <td class="table-cell manzanas-cell" data-manzanas="${reporte.manzanas || ''}">
            ${formatManzanas(reporte.manzanas)}
          </td>
          <td class="table-cell">${formatCapitanName(reporte)}</td>
          <td class="table-cell">${renderStatusBadge(calculateEstadoFromData(reporte))}</td>
          <td class="table-cell table-cell--mobile-hidden">${formatObservaciones(reporte.observaciones)}</td>
        </tr>
      `).join('');
      
      if (infoElement) {
        infoElement.textContent = `Mostrando ${filtered.length} de ${allReports.length} registros`;
      }
      
      setupManzanasTooltips();
    }
  }
});

// --- FUNCIONES PARA LA VISTA DE REGISTRO COMPLETO ---
let allReports = [];

function formatDate(fecha) {
  if (!fecha) return '-';
  try {
    const parts = fecha.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return fecha;
  }
}

function formatCapitanName(reporte) {
  if (reporte.nombre_capitan) return reporte.nombre_capitan;
  if (reporte.nombre && reporte.apellido) return `${reporte.nombre} ${reporte.apellido}`;
  return reporte.nombre || reporte.capitan || '-';
}

function formatManzanas(manzanas) {
  if (!manzanas) return '-';
  if (typeof manzanas === 'string') {
    const manzanasArray = manzanas.split(',').map(m => m.trim()).filter(m => m);
    if (manzanasArray.length > 3) {
      return `${manzanasArray.slice(0, 3).join(', ')} +${manzanasArray.length - 3}`;
    }
    return manzanasArray.join(', ');
  }
  return manzanas.toString();
}

function formatObservaciones(observaciones) {
  if (!observaciones) return '-';
  if (observaciones.length > 30) {
    return `${observaciones.substring(0, 30)}...`;
  }
  return observaciones;
}

function calculateEstadoFromData(reporte) {
  if (reporte.estado && reporte.estado.trim() !== '' && reporte.estado !== reporte.barrio) {
    const estadoNormalizado = reporte.estado.toLowerCase();
    if (estadoNormalizado === 'iniciado') return 'Iniciado';
    if (estadoNormalizado === 'en_progreso' || estadoNormalizado === 'progreso') return 'Progreso';
    if (estadoNormalizado === 'finalizado') return 'Finalizado';
    return reporte.estado;
  }
  return 'Sin estado';
}

function renderStatusBadge(estado) {
  if (!estado) {
    return '<span class="status-badge status-badge--default">Sin estado</span>';
  }
  const estadoLower = estado.toLowerCase();
  let badgeClass = 'status-badge--default';
  if (estadoLower.includes('iniciado') || estadoLower.includes('inicio')) {
    badgeClass = 'status-badge--iniciado';
  } else if (estadoLower.includes('progreso') || estadoLower.includes('proceso')) {
    badgeClass = 'status-badge--progreso';
  } else if (estadoLower.includes('finalizado') || estadoLower.includes('completo') || estadoLower.includes('terminado')) {
    badgeClass = 'status-badge--finalizado';
  }
  return `<span class="status-badge ${badgeClass}">${estado}</span>`;
}

function setupManzanasTooltips() {
  const cells = document.querySelectorAll('#tabla-registro-body .manzanas-cell');
  cells.forEach(cell => {
    const manzanasCompletas = cell.getAttribute('data-manzanas');
    if (!manzanasCompletas) return;
    const array = manzanasCompletas.split(',').map(m => m.trim()).filter(m => m);
    if (array.length <= 3) return;
    
    cell.style.cursor = 'pointer';
    cell.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllTooltips();
      
      const overlay = document.createElement('div');
      overlay.className = 'manzanas-tooltip-overlay';
      overlay.innerHTML = `
        <div class="manzanas-tooltip-content">
          <div class="manzanas-tooltip-header">
            <button class="manzanas-tooltip-close">×</button>
          </div>
          <div class="manzanas-tooltip-body">
            ${array.join(', ')}
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      setTimeout(() => overlay.classList.add('active'), 10);
      
      const closeBtn = overlay.querySelector('.manzanas-tooltip-close');
      closeBtn.addEventListener('click', () => {
        closeAllTooltips();
      });
      
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeAllTooltips();
      });
    });
  });
}

function closeAllTooltips() {
  const overlays = document.querySelectorAll('.manzanas-tooltip-overlay');
  overlays.forEach(overlay => {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  });
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  setThemeIcon(theme);
}

function setThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  
  btn.classList.add('changing');
  setTimeout(() => {
    btn.classList.remove('changing');
  }, 600);
}

function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  
  let theme = localStorage.getItem('theme');
  if (!theme) {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  setTheme(theme);
  
  btn.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  });
}