/**
 * Gestión Principal de la Aplicación - TypeScript
 * Migrado desde main.js con tipado estricto
 */

import { JSONUtils } from './utils/json-utils.js';
import { 
  Capitan, 
  BarrioOption, 
  ApiResponse 
} from './types/index.js';

// ==========================================
// INTERFACES ESPECÍFICAS PARA MAIN.TS
// ==========================================

interface BarrioData {
  nombre: string;
  archivo: string;
}

interface FormElements {
  capitanSelect: HTMLSelectElement | null;
  fechaReporte: HTMLInputElement | null;
  estadoReporte: HTMLSelectElement | null;
  barrioSelect: HTMLSelectElement | null;
}

interface ThemeType {
  theme: 'light' | 'dark';
}

// ==========================================
// CONFIGURACIÓN INICIAL
// ==========================================

document.addEventListener('DOMContentLoaded', (): void => {
  initThemeToggle();
  
  // Cargar capitanes en el dropdown
  cargarCapitanesDropdown();
  
  const btnIniciar: HTMLButtonElement | null = document.getElementById('btn-iniciar') as HTMLButtonElement;
  if (btnIniciar) {
    btnIniciar.addEventListener('click', (): void => {
      window.location.href = 'reportes.html';
    });
  }
  
  const btnConsultar: HTMLButtonElement | null = document.getElementById('btn-consultar') as HTMLButtonElement;
  if (btnConsultar) {
    btnConsultar.addEventListener('click', (): void => {
      window.location.href = 'consulta.html';
    });
  }

  const form: HTMLFormElement | null = document.getElementById('datos-form') as HTMLFormElement;
  const btnVolver: HTMLButtonElement | null = document.getElementById('btn-volver-home') as HTMLButtonElement;
  
  if (form) {
    form.addEventListener('submit', (e: Event): void => {
      e.preventDefault();
      
      const formElements: FormElements = {
        capitanSelect: document.getElementById('capitan-select') as HTMLSelectElement,
        fechaReporte: document.getElementById('fecha-reporte') as HTMLInputElement,
        estadoReporte: document.getElementById('estado-reporte') as HTMLSelectElement,
        barrioSelect: document.getElementById('barrio-select') as HTMLSelectElement
      };
      
      const nombreCapitan: string = formElements.capitanSelect?.options[formElements.capitanSelect.selectedIndex]?.text || '';
      const fecha: string = formElements.fechaReporte?.value || '';
      const estado: string = formElements.estadoReporte?.value || '';
      const barrio: string | null = formElements.barrioSelect?.value || null;
      
      if (!formElements.capitanSelect?.value || !fecha || !estado || !barrio) {
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
    btnVolver.addEventListener('click', (): void => {
      window.location.href = 'index.html';
    });
  }

  const barriosList: HTMLElement | null = document.getElementById('barrios-list');
  const btnVolverDatos: HTMLButtonElement | null = document.getElementById('btn-volver-datos') as HTMLButtonElement;
  
  if (barriosList) {
    // Listado de barrios basado en los SVGs presentes
    const barrios: BarrioData[] = [
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
    ].sort((a: BarrioData, b: BarrioData): number => a.nombre.localeCompare(b.nombre));

    barrios.forEach((barrio: BarrioData): void => {
      const btn: HTMLButtonElement = document.createElement('button');
      btn.className = 'btn btn-barrio';
      btn.textContent = barrio.nombre;
      btn.addEventListener('click', (): void => {
        JSONUtils.setToStorage('barrio', barrio);
        window.location.href = 'mapa.html';
      });
      barriosList.appendChild(btn);
    });
  }

  if (btnVolverDatos) {
    btnVolverDatos.addEventListener('click', (): void => {
      window.location.href = 'reportes.html';
    });
  }

  const btnAdmin: HTMLButtonElement | null = document.getElementById('btn-admin') as HTMLButtonElement;
  if (btnAdmin) {
    btnAdmin.addEventListener('click', (): void => {
      window.location.href = 'login.html';
    });
  }
  
  // Poblar dropdown de barrios en reportes.html
  const barrioSelect: HTMLSelectElement | null = document.getElementById('barrio-select') as HTMLSelectElement;
  if (barrioSelect) {
    const barrios: BarrioData[] = [
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
    ].sort((a: BarrioData, b: BarrioData): number => a.nombre.localeCompare(b.nombre));
    
    barrios.forEach((barrio: BarrioData): void => {
      const option: HTMLOptionElement = document.createElement('option');
      option.value = JSONUtils.safeStringify(barrio);
      option.textContent = barrio.nombre;
      barrioSelect.appendChild(option);
    });
  }
  
  // Poblar dropdown de capitanes en reportes.html
  const capitanSelect: HTMLSelectElement | null = document.getElementById('capitan-select') as HTMLSelectElement;
  if (capitanSelect) {
    cargarCapitanesDropdown();
  }
});

// ==========================================
// FUNCIONES DE TEMA
// ==========================================

function setTheme(theme: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  setThemeIcon(theme);
}

function setThemeIcon(theme: 'light' | 'dark'): void {
  const btn: HTMLButtonElement | null = document.getElementById('theme-toggle') as HTMLButtonElement;
  if (!btn) return;
  
  // Agregar animación de cambio
  btn.classList.add('changing');
  
  // Remover la animación después de completarse
  setTimeout((): void => {
    btn.classList.remove('changing');
  }, 600);
}

function initThemeToggle(): void {
  const btn: HTMLButtonElement | null = document.getElementById('theme-toggle') as HTMLButtonElement;
  if (!btn) return;

  // Cargar preferencia
  let theme: 'light' | 'dark' = localStorage.getItem('theme') as 'light' | 'dark';
  if (!theme) {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  setTheme(theme);
  
  btn.addEventListener('click', (): void => {
    const currentTheme: string | null = document.documentElement.getAttribute('data-theme');
    const newTheme: 'light' | 'dark' = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  });
}

// ==========================================
// FUNCIÓN PARA CARGAR CAPITANES
// ==========================================

async function cargarCapitanesDropdown(): Promise<void> {
  console.log('🔄 Iniciando carga de capitanes...');
  
  try {
    const select: HTMLSelectElement | null = document.getElementById('capitan-select') as HTMLSelectElement;
    if (!select) {
      console.warn('⚠️ Elemento capitan-select no encontrado');
      return;
    }
    
    console.log('📡 Haciendo fetch a /api/capitanes...');
    
    // Usar la nueva API del backend
    const response: Response = await fetch('/api/capitanes');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result: ApiResponse<Capitan[]> = await response.json();
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
    result.data.forEach((capitan: Capitan): void => {
      const option: HTMLOptionElement = document.createElement('option');
      option.value = capitan.id;
      option.textContent = `${capitan.nombre} ${capitan.apellido || ''}`.trim();
      select.appendChild(option);
    });
    
    console.log(`✅ ${result.data.length} capitanes cargados exitosamente`);
    
  } catch (error: unknown) {
    console.error('❌ Error al cargar capitanes:', error);
    
    // Mostrar mensaje de error al usuario
    const select: HTMLSelectElement | null = document.getElementById('capitan-select') as HTMLSelectElement;
    if (select) {
      select.innerHTML = '<option value="" disabled selected>Error al cargar capitanes</option>';
    }
  }
}