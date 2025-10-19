/**
 * Gestión de Capitanes - TypeScript
 * Migrado desde capitanes.js con tipado estricto
 */

import { 
  CapitanData, 
  SalidaCapitan, 
  CapitanFilters, 
  CapitanFormData, 
  BarrioOption,
  TooltipContainer,
  ApiResponse 
} from './types/index.js';

// Importar dependencias
declare const UI: any;
declare const API_BASE: string;

// Variables globales tipadas
let capitanesCargados: SalidaCapitan[] = [];
let filtrosActivos: CapitanFilters = {};

/**
 * Normalizar nombre para comparaciones
 */
function normalizarNombre(nombre: string): string {
  return nombre.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Comparar nombres normalizados
 */
function compararNombres(nombre1: string, nombre2: string): boolean {
  return normalizarNombre(nombre1) === normalizarNombre(nombre2);
}

/**
 * Inicialización del módulo
 */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('tab-capitanes')) {
    inicializarGestionCapitanes();
  }
});

/**
 * Inicializar gestión de capitanes
 */
function inicializarGestionCapitanes(): void {
  // Event listeners para pestañas
  document.querySelectorAll('.tabs__button').forEach(btn => {
    btn.addEventListener('click', cambiarPestaña);
  });

  // Event listeners para formulario
  document.getElementById('btn-limpiar')?.addEventListener('click', resetearFormulario);

  // Registrar event listener del formulario directamente
  const form = document.getElementById('form-capitan') as HTMLFormElement;
  if (form) {
    form.addEventListener('submit', guardarCapitan);
  }

  // Event listeners para filtros
  document.getElementById('filtro-dia-capitan')?.addEventListener('change', filtrarCapitanes);
  document.getElementById('filtro-horario-capitan')?.addEventListener('change', filtrarCapitanes);

  // Cargar datos iniciales
  cargarCapitanes();
  generarOpcionesBarrios();
  cargarCapitanesDropdown();

  // Inicializar tooltips interactivos
  inicializarTooltips();
}

/**
 * Cambiar pestaña activa
 */
function cambiarPestaña(e: Event): void {
  const target = e.currentTarget as HTMLElement;
  const tabId = target.dataset.tab;

  // Actualizar botones
  document.querySelectorAll('.tabs__button').forEach(btn => {
    btn.classList.remove('active');
  });
  target.classList.add('active');

  // Actualizar contenido
  document.querySelectorAll('.tabs__content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`tab-${tabId}`)?.classList.add('active');

  // Cargar datos si es necesario
  if (tabId === 'capitanes') {
    cargarCapitanes();
  }
}

/**
 * Cargar capitanes desde la API
 */
async function cargarCapitanes(): Promise<void> {
  try {
    console.log('��� Cargando capitanes...');

    // Obtener salidas desde la API
    const response = await fetch(`${API_BASE}/salidas`);
    const result: ApiResponse<SalidaCapitan[]> = await response.json();

    if (!result.success) {
      console.error('Error al cargar capitanes:', result.error);
      UI.showNotification('Error al cargar capitanes', 'error');
      return;
    }

    capitanesCargados = result.data || [];
    console.log(`✅ ${capitanesCargados.length} capitanes cargados`);

    // Mostrar capitanes
    mostrarCapitanes(capitanesCargados);

  } catch (error) {
    console.error('❌ Error al cargar capitanes:', error);
    UI.showNotification('Error de conexión al cargar capitanes', 'error');
  }
}

/**
 * Mostrar capitanes en la interfaz
 */
function mostrarCapitanes(salidas: SalidaCapitan[]): void {
  const container = document.getElementById('capitanes-container');
  if (!container) return;

  if (salidas.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">���</div>
        <h3>No hay capitanes registrados</h3>
        <p>Agrega el primer capitán para comenzar</p>
      </div>
    `;
    return;
  }

  // Generar HTML para cada capitán
  const html = salidas.map(salida => crearTarjetaCapitan(salida)).join('');
  container.innerHTML = html;

  // Agregar event listeners para botones de acción
  container.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const id = target.dataset.id;
      if (id) editarCapitan(id);
    });
  });

  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const id = target.dataset.id;
      if (id) eliminarCapitan(id);
    });
  });
}

/**
 * Crear tarjeta HTML para un capitán
 */
function crearTarjetaCapitan(salida: SalidaCapitan): string {
  // Adaptar a la nueva estructura con objeto capitanes anidado
  const capitan = salida.capitanes;
  const barrio = salida.barrio_asignado || 'Sin barrio asignado';
  const diaSemana = salida.dia_semana || 'No definido';
  const hora = salida.hora || 'No definida';

  // Obtener iniciales del capitán
  const iniciales = `${capitan.nombre.charAt(0)}${capitan.apellido.charAt(0)}`;

  // Mostrar solo el día asignado de forma clara
  const diasCompletos: Record<string, string> = {
    'lunes': 'Lunes',
    'martes': 'Martes',
    'miercoles': 'Miércoles',
    'jueves': 'Jueves',
    'viernes': 'Viernes',
    'sabado': 'Sábado',
    'domingo': 'Domingo'
  };

  const diaAsignado = diasCompletos[diaSemana.toLowerCase()] || diaSemana;

  // Formatear hora para mostrar solo HH:MM
  const horaFormateada = hora.includes(':') ? hora.substring(0, 5) : hora;

  return `
    <div class="capitan-card-compact">
      <div class="capitan-avatar">
        <span class="avatar-initials">${iniciales}</span>
        <div class="capitan-status salida-status"></div>
      </div>

      <div class="capitan-content">
        <h4 class="barrio-name">${barrio}</h4>
        <div class="capitan-details">
          <span class="capitan-nombre">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            ${capitan.nombre} ${capitan.apellido}
          </span>
          <span class="salida-horario">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
            ${diaAsignado} - ${horaFormateada}
          </span>
        </div>
      </div>

      <div class="capitan-actions">
        <button class="btn-edit" data-id="${salida.id}" title="Editar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="btn-delete" data-id="${salida.id}" title="Eliminar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6"></polyline>
            <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2,2h4a2,2,0,0,1,2,2V6"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
}

// Exportar funciones globales para uso en HTML
(window as any).editarCapitan = editarCapitan;
(window as any).eliminarCapitan = eliminarCapitan;
(window as any).resetearFormulario = resetearFormulario;
(window as any).inicializarTooltips = inicializarTooltips;

// Exportaciones explícitas para módulos TypeScript

/**
 * Filtrar capitanes según criterios
 */
function filtrarCapitanes(): void {
  const filtroDia = (document.getElementById('filtro-dia-capitan') as HTMLSelectElement)?.value;
  const filtroHorario = (document.getElementById('filtro-horario-capitan') as HTMLSelectElement)?.value;

  filtrosActivos = {
    dia: filtroDia || undefined,
    horario: filtroHorario || undefined
  };

  let capitanesFiltrados = [...capitanesCargados];

  // Filtrar por día
  if (filtrosActivos.dia && filtrosActivos.dia !== '') {
    capitanesFiltrados = capitanesFiltrados.filter(salida => 
      salida.dia_semana.toLowerCase() === filtrosActivos.dia?.toLowerCase()
    );
  }

  // Filtrar por horario (mañana/tarde)
  if (filtrosActivos.horario && filtrosActivos.horario !== '') {
    capitanesFiltrados = capitanesFiltrados.filter(salida => {
      const hora = parseInt(salida.hora.split(':')[0]);
      if (filtrosActivos.horario === 'mañana') {
        return hora < 12;
      } else if (filtrosActivos.horario === 'tarde') {
        return hora >= 12;
      }
      return true;
    });
  }

  mostrarCapitanes(capitanesFiltrados);
}

/**
 * Guardar capitán (crear o actualizar)
 */
async function guardarCapitan(e: Event): Promise<void> {
  e.preventDefault();
  
  const form = e.target as HTMLFormElement;
  const formData = new FormData(form);
  
  // Convertir FormData a objeto tipado
  const data: CapitanFormData = {
    id: formData.get('id') as string || undefined,
    nombre: formData.get('nombre') as string,
    apellido: formData.get('apellido') as string,
    telefono: formData.get('telefono') as string || undefined,
    email: formData.get('email') as string || undefined,
    barrio_asignado: formData.get('barrio_asignado') as string,
    dia_semana: formData.get('dia_semana') as string,
    hora: formData.get('hora') as string,
    minutos: formData.get('minutos') as string || undefined
  };

  try {
    // Formatear hora si hay minutos
    if (data.hora && data.minutos) {
      data.hora = `${data.hora.padStart(2, '0')}:${data.minutos.padStart(2, '0')}`;
      delete data.minutos;
    }

    // Validar datos requeridos
    if (!data.nombre || !data.apellido || !data.barrio_asignado || !data.dia_semana || !data.hora) {
      UI.showNotification('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    // Determinar si es creación o actualización
    const isEdit = data.id && data.id !== '';
    const url = isEdit ? `${API_BASE}/salidas/${data.id}` : `${API_BASE}/salidas`;
    const method = isEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result: ApiResponse<SalidaCapitan> = await response.json();

    if (!result.success) {
      console.error('Error al guardar:', result.error);
      UI.showNotification('Error al guardar el capitán', 'error');
      return;
    }

    UI.showNotification(
      isEdit ? 'Capitán actualizado correctamente' : 'Capitán creado correctamente', 
      'success'
    );
    
    resetearFormulario();
    cargarCapitanes();

  } catch (error) {
    console.error('Error:', error);
    UI.showNotification('Error de conexión', 'error');
  }
}

/**
 * Editar capitán existente
 */
function editarCapitan(id: string): void {
  const salida = capitanesCargados.find(s => s.id === id);
  if (!salida) return;

  const capitan = salida.capitanes;

  // Llenar formulario con datos existentes
  const form = document.getElementById('form-capitan') as HTMLFormElement;
  if (!form) return;

  (form.querySelector('[name="id"]') as HTMLInputElement).value = salida.id || '';
  (form.querySelector('[name="nombre"]') as HTMLInputElement).value = capitan.nombre;
  (form.querySelector('[name="apellido"]') as HTMLInputElement).value = capitan.apellido;
  (form.querySelector('[name="telefono"]') as HTMLInputElement).value = capitan.telefono || '';
  (form.querySelector('[name="email"]') as HTMLInputElement).value = capitan.email || '';
  (form.querySelector('[name="barrio_asignado"]') as HTMLSelectElement).value = salida.barrio_asignado;
  (form.querySelector('[name="dia_semana"]') as HTMLSelectElement).value = salida.dia_semana;

  // Separar hora y minutos
  if (salida.hora && salida.hora.includes(':')) {
    const [hora, minutos] = salida.hora.split(':');
    (form.querySelector('[name="hora"]') as HTMLInputElement).value = hora;
    (form.querySelector('[name="minutos"]') as HTMLInputElement).value = minutos;
  }

  // Cambiar texto del botón
  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  if (submitBtn) {
    submitBtn.textContent = 'Actualizar Capitán';
  }

  // Scroll al formulario
  form.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Eliminar capitán
 */
async function eliminarCapitan(id: string): Promise<void> {
  const salida = capitanesCargados.find(s => s.id === id);
  if (!salida) return;

  const capitan = salida.capitanes;
  const confirmacion = confirm(
    `¿Estás seguro de que deseas eliminar al capitán ${capitan.nombre} ${capitan.apellido}?`
  );

  if (!confirmacion) return;

  try {
    const response = await fetch(`${API_BASE}/salidas/${id}`, {
      method: 'DELETE'
    });

    const result: ApiResponse<any> = await response.json();

    if (!result.success) {
      console.error('Error al eliminar:', result.error);
      UI.showNotification('Error al eliminar el capitán', 'error');
      return;
    }

    UI.showNotification('Capitán eliminado correctamente', 'success');
    cargarCapitanes();

  } catch (error) {
    console.error('Error:', error);
    UI.showNotification('Error de conexión', 'error');
  }
}

/**
 * Resetear formulario
 */
function resetearFormulario(): void {
  const form = document.getElementById('form-capitan') as HTMLFormElement;
  if (!form) return;

  form.reset();
  
  // Limpiar campo ID oculto
  const idField = form.querySelector('[name="id"]') as HTMLInputElement;
  if (idField) idField.value = '';

  // Restaurar texto del botón
  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  if (submitBtn) {
    submitBtn.textContent = 'Guardar Capitán';
  }
}

/**
 * Generar opciones de barrios para el select
 */
async function generarOpcionesBarrios(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/barrios`);
    const result: ApiResponse<BarrioOption[]> = await response.json();

    if (!result.success) {
      console.error('Error al cargar barrios:', result.error);
      return;
    }

    const select = document.getElementById('barrio_asignado') as HTMLSelectElement;
    if (!select) return;

    // Limpiar opciones existentes (excepto la primera)
    while (select.children.length > 1) {
      select.removeChild(select.lastChild!);
    }

    // Agregar nuevas opciones
    result.data?.forEach(barrio => {
      const option = document.createElement('option');
      option.value = barrio.value;
      option.textContent = barrio.label;
      select.appendChild(option);
    });

  } catch (error) {
    console.error('Error al cargar barrios:', error);
  }
}

/**
 * Cargar capitanes en dropdown
 */
async function cargarCapitanesDropdown(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/capitanes`);
    const result: ApiResponse<CapitanData[]> = await response.json();

    if (!result.success) {
      console.error('Error al cargar capitanes:', result.error);
      return;
    }

    // Aquí se podría implementar la lógica para llenar un dropdown de capitanes
    // si fuera necesario en el futuro

  } catch (error) {
    console.error('Error al cargar capitanes:', error);
  }
}

/**
 * Inicializar tooltips interactivos
 */
function inicializarTooltips(): void {
  const tooltipTriggers = document.querySelectorAll('.tooltip-trigger');

  tooltipTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const container = trigger.closest('.tooltip-container') as TooltipContainer;

      // Cerrar otros tooltips abiertos
      document.querySelectorAll('.tooltip-container.active').forEach(activeContainer => {
        if (activeContainer !== container) {
          activeContainer.classList.remove('active');
        }
      });

      // Toggle del tooltip actual
      container.classList.toggle('active');

      // Auto-ocultar después de 4 segundos
      if (container.classList.contains('active')) {
        setTimeout(() => {
          container.classList.remove('active');
        }, 4000);
      }
    });
  });

  // Cerrar tooltip al hacer clic fuera
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.tooltip-container')) {
      document.querySelectorAll('.tooltip-container.active').forEach(container => {
        container.classList.remove('active');
      });
    }
  });
}

// Exportaciones globales para compatibilidad
declare global {
  interface Window {
    inicializarGestionCapitanes: typeof inicializarGestionCapitanes;
    cambiarPestaña: typeof cambiarPestaña;
    cargarCapitanes: typeof cargarCapitanes;
    mostrarCapitanes: typeof mostrarCapitanes;
    filtrarCapitanes: typeof filtrarCapitanes;
    guardarCapitan: typeof guardarCapitan;
    editarCapitan: typeof editarCapitan;
    eliminarCapitan: typeof eliminarCapitan;
    resetearFormulario: typeof resetearFormulario;
    generarOpcionesBarrios: typeof generarOpcionesBarrios;
    cargarCapitanesDropdown: typeof cargarCapitanesDropdown;
    inicializarTooltips: typeof inicializarTooltips;
  }
}

// Asignar funciones al objeto global window
window.inicializarGestionCapitanes = inicializarGestionCapitanes;
window.cambiarPestaña = cambiarPestaña;
window.cargarCapitanes = cargarCapitanes;
window.mostrarCapitanes = mostrarCapitanes;
window.filtrarCapitanes = filtrarCapitanes;
window.guardarCapitan = guardarCapitan;
window.editarCapitan = editarCapitan;
window.eliminarCapitan = eliminarCapitan;
window.resetearFormulario = resetearFormulario;
window.generarOpcionesBarrios = generarOpcionesBarrios;
window.cargarCapitanesDropdown = cargarCapitanesDropdown;
window.inicializarTooltips = inicializarTooltips;

// Exportaciones explícitas del módulo
export {
  inicializarGestionCapitanes,
  cambiarPestaña,
  cargarCapitanes,
  mostrarCapitanes,
  filtrarCapitanes,
  guardarCapitan,
  editarCapitan,
  eliminarCapitan,
  resetearFormulario,
  generarOpcionesBarrios,
  cargarCapitanesDropdown,
  inicializarTooltips
};
