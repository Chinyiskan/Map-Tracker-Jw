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