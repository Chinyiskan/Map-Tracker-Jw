
// Importar utilidades JSON
import { JSONUtils } from './json-utils.js';

// Configuración inicial
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  
  // Cargar capitanes en el dropdown
  cargarCapitanesDropdown();
  
  const btnIniciar = document.getElementById('btn-iniciar');
  if (btnIniciar) {
    btnIniciar.addEventListener('click', () => {
      window.location.href = 'reportes.html';
    });
  }
  
  const btnConsultar = document.getElementById('btn-consultar');
  if (btnConsultar) {
    btnConsultar.addEventListener('click', () => {
      window.location.href = 'consulta.html';
    });
  }
  const form = document.getElementById('datos-form');
  const btnVolver = document.getElementById('btn-volver-home');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const capitanSelect = document.getElementById('capitan-select');
      const nombreCapitan = capitanSelect ? capitanSelect.options[capitanSelect.selectedIndex]?.text : '';
      const fecha = document.getElementById('fecha-reporte').value;
      const estado = document.getElementById('estado-reporte').value;
      const barrioSelect = document.getElementById('barrio-select');
      const barrio = barrioSelect ? barrioSelect.value : null;
      
      if (!capitanSelect?.value || !fecha || !estado || !barrio) {
        alert('Por favor complete todos los campos');
        return;
      }
      
      // Guardar datos del formulario
      localStorage.setItem('nombreCapitan', nombreCapitan);
      localStorage.setItem('fechaReporte', fecha);
      localStorage.setItem('estadoReporte', estado);
      
      // Guardar barrio seleccionado
      localStorage.setItem('barrio', barrio);
      
      // Ir directamente al mapa
      window.location.href = 'mapa.html';
    });
  }
  if (btnVolver) {
    btnVolver.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }
  const barriosList = document.getElementById('barrios-list');
  const btnVolverDatos = document.getElementById('btn-volver-datos');
  if (barriosList) {
    // Listado de barrios basado en los SVGs presentes
    const barrios = [
      { nombre: 'Acacios', archivo: 'Acacios.svg' },
      { nombre: 'Alcala', archivo: 'Alcala.svg' },
      { nombre: 'Ciudad Jardin', archivo: 'Ciudad Jardin.svg' },
      { nombre: 'Guaimaral', archivo: 'Guaimaral.svg' },
      { nombre: 'La Mar y Gratamira', archivo: 'La Mar y Gratamira.svg' },
      { nombre: 'Niza', archivo: 'Niza.svg' },
      { nombre: 'Prados Norte', archivo: 'Prados Norte.svg' },
      { nombre: 'Proceres', archivo: 'Proceres.svg' },
      { nombre: 'San Eduardo', archivo: 'San Eduardo.svg' },
      { nombre: 'Santa Elena', archivo: 'Santa Elena.svg' },
      { nombre: 'Tasajero', archivo: 'Tasajero.svg' },
      { nombre: 'Zulima', archivo: 'Zulima.svg' }
    ].sort((a, b) => a.nombre.localeCompare(b.nombre));
    barrios.forEach(barrio => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-barrio';
      btn.textContent = barrio.nombre;
      btn.addEventListener('click', () => {
        JSONUtils.setToStorage('barrio', barrio);
        window.location.href = 'mapa.html';
      });
      barriosList.appendChild(btn);
    });
  }
  if (btnVolverDatos) {
    btnVolverDatos.addEventListener('click', () => {
      window.location.href = 'reportes.html';
    });
  }
  const btnAdmin = document.getElementById('btn-admin');
  if (btnAdmin) {
    btnAdmin.addEventListener('click', () => {
      window.location.href = 'login.html';
    });
  }
  
  // Poblar dropdown de barrios en reportes.html
  const barrioSelect = document.getElementById('barrio-select');
  if (barrioSelect) {
    const barrios = [
      { nombre: 'Acacios', archivo: 'Acacios.svg' },
      { nombre: 'Alcala', archivo: 'Alcala.svg' },
      { nombre: 'Ciudad Jardin', archivo: 'Ciudad Jardin.svg' },
      { nombre: 'Guaimaral', archivo: 'Guaimaral.svg' },
      { nombre: 'La Mar y Gratamira', archivo: 'La Mar y Gratamira.svg' },
      { nombre: 'Niza', archivo: 'Niza.svg' },
      { nombre: 'Prados Norte', archivo: 'Prados Norte.svg' },
      { nombre: 'Proceres', archivo: 'Proceres.svg' },
      { nombre: 'San Eduardo', archivo: 'San Eduardo.svg' },
      { nombre: 'Santa Elena', archivo: 'Santa Elena.svg' },
      { nombre: 'Tasajero', archivo: 'Tasajero.svg' },
      { nombre: 'Zulima', archivo: 'Zulima.svg' }
    ].sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    barrios.forEach(barrio => {
      const option = document.createElement('option');
      option.value = JSONUtils.safeStringify(barrio);
      option.textContent = barrio.nombre;
      barrioSelect.appendChild(option);
    });
  }
  
  // Poblar dropdown de capitanes en reportes.html
  const capitanSelect = document.getElementById('capitan-select');
  if (capitanSelect) {
    cargarCapitanesDropdown();
  }
});

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  setThemeIcon(theme);
}
function setThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  
  // Agregar animación de cambio
  btn.classList.add('changing');
  
  // Remover la animación después de completarse
  setTimeout(() => {
    btn.classList.remove('changing');
  }, 600);
}
function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  // Cargar preferencia
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

// Función para cargar capitanes en el dropdown
async function cargarCapitanesDropdown() {
  console.log('🔄 Iniciando carga de capitanes...');
  
  try {
    const select = document.getElementById('capitan-select');
    if (!select) {
      console.warn('⚠️ Elemento capitan-select no encontrado');
      return;
    }
    
    console.log('📡 Haciendo fetch a /api/capitanes...');
    
    // Usar la nueva API del backend
    const response = await fetch('/api/capitanes');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('📊 Respuesta recibida:', result);
    
    if (!result.success) {
      console.error('❌ Error en la respuesta:', result.error);
      return;
    }
    
    if (!result.data || !Array.isArray(result.data)) {
      console.error('❌ Datos de capitanes inválidos:', result.data);
      return;
    }
    
    // Limpiar opciones existentes
    select.innerHTML = '<option value="" disabled selected>Selecciona un capitán</option>';
    
    // Agregar capitanes
    result.data.forEach(capitan => {
      const option = document.createElement('option');
      option.value = capitan.id;
      option.textContent = `${capitan.nombre} ${capitan.apellido}`;
      select.appendChild(option);
    });
    
    console.log(`✅ ${result.data.length} capitanes cargados exitosamente`);
    
  } catch (error) {
    console.error('❌ Error al cargar capitanes:', error);
    
    // Mostrar mensaje de error al usuario
    const select = document.getElementById('capitan-select');
    if (select) {
      select.innerHTML = '<option value="" disabled selected>Error al cargar capitanes</option>';
    }
  }
}