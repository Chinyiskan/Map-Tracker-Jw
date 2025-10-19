// js/capitanes.js
// Gestión de capitanes para salidas de predicación
import { UI } from './ui.js';
import { supabase } from './supabase.js';
// Configuración de API
const API_BASE = '/api';
// Variables globales
let capitanes = [];
let capitanEditando = null;
const BARRIOS_DISPONIBLES = [
    'Alcalá', 'Acacios', 'Ciudad Jardín', 'Guaimaral',
    'La Mar y Gratamira', 'Niza', 'Prados Norte', 'Próceres',
    'San Eduardo', 'Santa Elena', 'Tasajero', 'Zulima'
];
// Función para normalizar nombres y evitar duplicados
function normalizarNombre(nombre) {
    if (!nombre || typeof nombre !== 'string')
        return '';
    return nombre
        .toLowerCase() // convertir a minúsculas
        .normalize('NFD') // descomponer caracteres con tildes
        .replace(/[\u0300-\u036f]/g, '') // quitar tildes y diacríticos
        .replace(/\s+/g, ' ') // reemplazar múltiples espacios por uno
        .trim(); // quitar espacios al inicio y final
}
// Función para verificar si dos nombres son iguales (normalizados)
function sonNombresIguales(nombre1, nombre2) {
    return normalizarNombre(nombre1) === normalizarNombre(nombre2);
}
// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tab-capitanes')) {
        inicializarGestionCapitanes();
    }
});
function inicializarGestionCapitanes() {
    // Event listeners para pestañas
    document.querySelectorAll('.tabs__button').forEach(btn => {
        btn.addEventListener('click', cambiarPestaña);
    });
    // Event listeners para formulario
    document.getElementById('btn-limpiar')?.addEventListener('click', resetearFormulario);
    // Registrar event listener del formulario directamente
    const form = document.getElementById('form-capitan');
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
function cambiarPestaña(e) {
    const tabId = e.currentTarget.dataset.tab;
    // Actualizar botones
    document.querySelectorAll('.tabs__button').forEach(btn => {
        btn.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
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
async function cargarCapitanes() {
    try {
        console.log('🔄 Cargando capitanes...');
        // Obtener salidas desde la API
        const response = await fetch(`${API_BASE}/salidas`);
        const result = await response.json();
        if (!result.success) {
            console.error('❌ Error al cargar salidas:', result.error);
            UI.showNotification('Error al cargar los datos de capitanes', 'error');
            return;
        }
        console.log('✅ Salidas cargadas:', result.data);
        // Guardar en variable global
        capitanes = result.data || [];
        // Mostrar en la interfaz
        mostrarCapitanes(capitanes);
        // Cargar dropdown de capitanes
        await cargarCapitanesDropdown();
    }
    catch (error) {
        console.error('❌ Error inesperado:', error);
        UI.showNotification('Error inesperado al cargar capitanes', 'error');
    }
}
function mostrarCapitanes(capitanesAMostrar) {
    const container = document.getElementById('lista-capitanes');
    if (!container)
        return;
    if (capitanesAMostrar.length === 0) {
        container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-color); opacity: 0.7;">
        <p>No hay capitanes registrados</p>
        <p style="font-size: 0.9rem; margin-top: 1rem;">Usa el formulario de arriba para agregar el primer capitán</p>
      </div>
    `;
        return;
    }
    container.innerHTML = capitanesAMostrar.map(capitan => crearTarjetaCapitan(capitan)).join('');
    // Agregar event listeners a los botones
    container.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            editarCapitan(id);
        });
    });
    container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            eliminarCapitan(id);
        });
    });
}
function crearTarjetaCapitan(salida) {
    // Adaptar a la nueva estructura con objeto capitanes anidado
    const capitan = salida.capitanes;
    const barrio = salida.barrio_asignado || 'Sin barrio asignado';
    const diaSemana = salida.dia_semana || 'No definido';
    const hora = salida.hora || 'No definida';
    // Obtener iniciales del capitán
    const iniciales = `${capitan.nombre.charAt(0)}${capitan.apellido.charAt(0)}`;
    // Mostrar solo el día asignado de forma clara
    const diasCompletos = {
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
            ${diaAsignado} ${horaFormateada}
          </span>
          ${capitan.telefono ?
        `<span class="salida-telefono">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              ${capitan.telefono}
            </span>` : ''}
        </div>
      </div>
      
      <div class="capitan-actions-compact">
        <button class="action-btn edit-btn" data-id="${salida.id}" title="Editar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="action-btn delete-btn" data-id="${salida.id}" title="Eliminar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6"/>
            <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>
    </div>
  `;
}
function filtrarCapitanes() {
    const filtrodia = document.getElementById('filtro-dia-capitan')?.value || '';
    const filtroHorario = document.getElementById('filtro-horario-capitan')?.value || '';
    let capitanesFiltrados = [...capitanes];
    if (filtrodia) {
        capitanesFiltrados = capitanesFiltrados.filter(capitan => {
            return capitan.dia_semana && capitan.dia_semana.toLowerCase() === filtrodia.toLowerCase();
        });
    }
    if (filtroHorario) {
        capitanesFiltrados = capitanesFiltrados.filter(capitan => {
            const hora = capitan.hora || '';
            // Determinar si es mañana, tarde o noche basado en la hora
            if (filtroHorario === 'mañana') {
                return hora >= '06:00:00' && hora < '12:00:00';
            }
            else if (filtroHorario === 'tarde') {
                return hora >= '12:00:00' && hora < '18:00:00';
            }
            else if (filtroHorario === 'noche') {
                return hora >= '18:00:00' || hora < '06:00:00';
            }
            return true;
        });
    }
    mostrarCapitanes(capitanesFiltrados);
}
// Función toggleFormulario eliminada - formulario siempre visible
function editarCapitan(id) {
    const capitan = capitanes.find(c => c.id === id);
    if (!capitan)
        return;
    capitanEditando = capitan;
    // Cambiar título del formulario
    const header = document.querySelector('.card__header h3');
    if (header)
        header.textContent = 'Editar Capitán';
    llenarFormulario(capitan);
    // Scroll al formulario
    document.querySelector('.card:last-child').scrollIntoView({ behavior: 'smooth' });
}
function resetearFormulario() {
    document.getElementById('form-capitan').reset();
    capitanEditando = null;
    // Resetear selects
    const capitanSelect = document.getElementById('salida-capitan');
    if (capitanSelect) {
        capitanSelect.selectedIndex = 0;
    }
    const barrioSelect = document.getElementById('salida-barrio');
    if (barrioSelect) {
        barrioSelect.selectedIndex = 0;
    }
    const diaSelect = document.getElementById('salida-dia');
    if (diaSelect) {
        diaSelect.selectedIndex = 0;
    }
    // Resetear selectores de tiempo
    const horaSelect = document.getElementById('salida-hora');
    if (horaSelect) {
        horaSelect.selectedIndex = 0;
    }
    const minutosSelect = document.getElementById('salida-minutos');
    if (minutosSelect) {
        minutosSelect.selectedIndex = 0;
    }
}
function llenarFormulario(salida) {
    // Seleccionar capitán
    const capitanSelect = document.getElementById('salida-capitan');
    if (capitanSelect && salida.capitanes) {
        capitanSelect.value = salida.capitanes.id;
    }
    // Seleccionar barrio asignado
    const barrioSelect = document.getElementById('salida-barrio');
    if (barrioSelect && salida.barrio_asignado) {
        barrioSelect.value = salida.barrio_asignado;
    }
    // Llenar día de la semana
    const diaSelect = document.getElementById('salida-dia');
    if (diaSelect && salida.dia_semana) {
        diaSelect.value = salida.dia_semana.toLowerCase();
    }
    // Llenar hora (separar en horas y minutos)
    const horaSelect = document.getElementById('salida-hora');
    const minutosSelect = document.getElementById('salida-minutos');
    if (horaSelect && minutosSelect && salida.hora) {
        const [horas, minutos] = salida.hora.split(':');
        horaSelect.value = horas;
        minutosSelect.value = minutos;
    }
}
function generarOpcionesBarrios() {
    const select = document.getElementById('salida-barrio');
    if (!select)
        return;
    // Limpiar opciones existentes excepto la primera
    select.innerHTML = '<option value="" disabled selected>Selecciona un barrio</option>';
    // Agregar opciones de barrios
    BARRIOS_DISPONIBLES.forEach(barrio => {
        const option = document.createElement('option');
        option.value = barrio;
        option.textContent = barrio;
        select.appendChild(option);
    });
}
// Cargar capitanes en dropdown
async function cargarCapitanesDropdown() {
    try {
        // OPTIMIZADO: Log simplificado
        console.log('🔄 Cargando capitanes para dropdown...');
        // Obtener todos los capitanes desde la API
        const response = await fetch(`${API_BASE}/capitanes`);
        const result = await response.json();
        if (!result.success) {
            console.error('❌ Error al cargar capitanes:', result.error);
            UI.showNotification('Error al cargar lista de capitanes', 'error');
            return;
        }
        console.log(`✅ ${result.data.length} capitanes cargados para dropdown`);
        const select = document.getElementById('salida-capitan');
        if (!select)
            return;
        // Limpiar opciones existentes (excepto la primera)
        select.innerHTML = '<option value="" disabled selected>Selecciona un capitán</option>';
        // Agregar capitanes
        result.data.forEach(capitan => {
            const option = document.createElement('option');
            option.value = capitan.id;
            option.textContent = `${capitan.nombre} ${capitan.apellido}`;
            select.appendChild(option);
        });
    }
    catch (error) {
        console.error('❌ Error inesperado:', error);
        UI.showNotification('Error al cargar capitanes', 'error');
    }
}
async function guardarCapitan(e) {
    e.preventDefault();
    // Obtener datos del formulario
    const capitanId = document.getElementById('salida-capitan').value;
    const barrioSeleccionado = document.getElementById('salida-barrio').value;
    const diaSemana = document.getElementById('salida-dia').value;
    const horaSeleccionada = document.getElementById('salida-hora').value;
    const minutosSeleccionados = document.getElementById('salida-minutos').value;
    // Validaciones
    if (!capitanId || !barrioSeleccionado || !diaSemana || !horaSeleccionada || !minutosSeleccionados) {
        UI.showNotification('Por favor complete todos los campos obligatorios', 'error');
        return;
    }
    // Combinar hora y minutos en formato HH:MM
    const hora = `${horaSeleccionada}:${minutosSeleccionados}`;
    const salidaData = {
        capitan_id: capitanId,
        barrio_asignado: barrioSeleccionado,
        dia_semana: diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1),
        hora: hora
    };
    try {
        let response;
        if (capitanEditando) {
            // Actualizar salida existente
            response = await fetch(`${API_BASE}/salidas/${capitanEditando.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(salidaData)
            });
        }
        else {
            // Crear nueva salida
            response = await fetch(`${API_BASE}/salidas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(salidaData)
            });
        }
        const result = await response.json();
        if (!result.success) {
            console.error('Error al guardar:', result.error);
            UI.showNotification('Error al programar la salida', 'error');
            return;
        }
        UI.showNotification(capitanEditando ? 'Salida actualizada correctamente' : 'Salida programada correctamente', 'success');
        resetearFormulario();
        cargarCapitanes();
        cargarCapitanesDropdown(); // Recargar dropdown por si hay cambios
    }
    catch (error) {
        console.error('Error:', error);
        UI.showNotification('Error de conexión', 'error');
    }
}
async function eliminarCapitan(id) {
    const capitan = capitanes.find(c => c.id === id);
    if (!capitan)
        return;
    const nombreCompleto = capitan.capitanes ?
        `${capitan.capitanes.nombre} ${capitan.capitanes.apellido}` :
        'este capitán';
    if (!confirm(`¿Estás seguro de que quieres eliminar la salida de ${nombreCompleto}?`)) {
        return;
    }
    try {
        const response = await fetch(`${API_BASE}/salidas/${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (!result.success) {
            console.error('Error al eliminar:', result.error);
            UI.showNotification('Error al eliminar el capitán', 'error');
            return;
        }
        UI.showNotification('Capitán eliminado correctamente', 'success');
        cargarCapitanes();
    }
    catch (error) {
        console.error('Error:', error);
        UI.showNotification('Error de conexión', 'error');
    }
}
// Función de notificación removida - ahora usamos UI.showNotification
// Funcionalidad del tooltip interactivo
function inicializarTooltips() {
    const tooltipTriggers = document.querySelectorAll('.tooltip-trigger');
    tooltipTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const container = trigger.closest('.tooltip-container');
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
        if (!e.target.closest('.tooltip-container')) {
            document.querySelectorAll('.tooltip-container.active').forEach(container => {
                container.classList.remove('active');
            });
        }
    });
}
// Exportar funciones globales para uso en HTML
window.editarCapitan = editarCapitan;
window.eliminarCapitan = eliminarCapitan;
window.resetearFormulario = resetearFormulario;
window.inicializarTooltips = inicializarTooltips;
export { cargarCapitanes, mostrarCapitanes, editarCapitan, eliminarCapitan, resetearFormulario };
//# sourceMappingURL=capitanes.js.map