// Gestión de Capitanes Maestros - Tabla capitanes
import { supabase } from './supabase.js';
// Variables globales
let capitanesMaestro = [];
let capitanEditando = null;
// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('form-capitan-maestro')) {
        inicializarGestionCapitanesMaestro();
    }
});
function inicializarGestionCapitanesMaestro() {
    // Event listeners
    const form = document.getElementById('form-capitan-maestro');
    if (form) {
        form.addEventListener('submit', guardarCapitanMaestro);
    }
    document.getElementById('btn-limpiar-maestro')?.addEventListener('click', limpiarFormularioMaestro);
    document.getElementById('buscar-capitan-maestro')?.addEventListener('input', buscarCapitanesMaestro);
    // Cargar datos iniciales
    cargarCapitanesMaestro();
}
// Cargar capitanes desde la tabla capitanes
async function cargarCapitanesMaestro() {
    try {
        // Usar la API REST en lugar de consulta directa a Supabase
        const response = await fetch('/api/capitanes');
        const result = await response.json();
        if (!result.success) {
            console.error('Error al cargar capitanes maestro:', result.error);
            mostrarNotificacion('Error al cargar capitanes', 'error');
            return;
        }
        capitanesMaestro = result.data || [];
        console.log('Capitanes cargados:', capitanesMaestro);
        mostrarCapitanesMaestro(capitanesMaestro);
    }
    catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión', 'error');
    }
}
// Mostrar lista de capitanes maestros
function mostrarCapitanesMaestro(capitanes) {
    const container = document.getElementById('lista-capitanes-maestro');
    if (!container)
        return;
    if (!capitanes || capitanes.length === 0) {
        container.innerHTML = `
      <div class="text-center py-xl text-secondary">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="mx-auto mb-md opacity-50">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <p>No hay capitanes registrados</p>
        <p class="text-xs">Agrega el primer capitán usando el formulario de arriba</p>
      </div>
    `;
        return;
    }
    container.innerHTML = capitanes.map(capitan => crearTarjetaCapitanMaestro(capitan)).join('');
}
// Crear tarjeta de capitán maestro compacta
function crearTarjetaCapitanMaestro(capitan) {
    const iniciales = `${capitan.nombre.charAt(0)}${capitan.apellido.charAt(0)}`;
    const fechaCreacion = new Date(capitan.created_at).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
    });
    return `
    <div class="capitan-card-compact">
      <div class="capitan-avatar">
        <span class="avatar-initials">${iniciales}</span>
        <div class="capitan-status"></div>
      </div>
      
      <div class="capitan-content">
        <h4 class="capitan-name">${capitan.nombre} ${capitan.apellido}</h4>
        <div class="capitan-details">
          ${capitan.telefono ?
        `<span class="capitan-phone">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              ${capitan.telefono}
            </span>` :
        '<span class="capitan-phone no-phone">Sin teléfono</span>'}
          <span class="capitan-date">${fechaCreacion}</span>
        </div>
      </div>
      
      <div class="capitan-actions-compact">
        <button class="action-btn edit-btn" onclick="editarCapitanMaestro('${capitan.id}')" title="Editar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="action-btn delete-btn" onclick="eliminarCapitanMaestro('${capitan.id}')" title="Eliminar">
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
// Función auxiliar para obtener las iniciales del nombre
function obtenerIniciales(nombre, apellido) {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`;
}
// Función auxiliar para formatear fecha
function formatearFechaCompacta(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
    });
}
// Continuar con el resto de la función original
function continuarTarjetaCapitanMaestro(capitan) {
    return `
      <div class="capitan-info">
        ${capitan.telefono ? `<p>📞 ${capitan.telefono}</p>` : '<p class="text-secondary">Sin teléfono</p>'}
        <div class="capitan-meta">
          <small class="text-secondary">Creado: ${new Date(capitan.created_at).toLocaleDateString()}</small>
        </div>
      </div>
    </div>
  `;
}
// Guardar capitán maestro
async function guardarCapitanMaestro(e) {
    e.preventDefault();
    const nombre = document.getElementById('maestro-nombre').value.trim();
    const apellido = document.getElementById('maestro-apellido').value.trim();
    const telefono = document.getElementById('maestro-telefono').value.trim();
    // Validaciones básicas
    if (!nombre || !apellido) {
        mostrarNotificacion('Por favor complete nombre y apellido', 'error');
        return;
    }
    const capitanData = {
        nombre: nombre,
        apellido: apellido,
        telefono: telefono || null
    };
    try {
        let result;
        if (capitanEditando) {
            // Actualizar
            result = await supabase
                .from('capitanes')
                .update(capitanData)
                .eq('id', capitanEditando.id);
        }
        else {
            // Crear nuevo
            result = await supabase
                .from('capitanes')
                .insert([capitanData]);
        }
        if (result.error) {
            console.error('Error al guardar:', result.error);
            // Verificar si es error de duplicado
            if (result.error.message.includes('Ya existe un capitán')) {
                mostrarNotificacion('Ya existe un capitán con ese nombre', 'error');
            }
            else {
                mostrarNotificacion('Error al guardar el capitán', 'error');
            }
            return;
        }
        mostrarNotificacion(capitanEditando ? 'Capitán actualizado correctamente' : 'Capitán creado correctamente', 'success');
        limpiarFormularioMaestro();
        cargarCapitanesMaestro();
    }
    catch (error) {
        console.error('Error:', error);
        if (error.message.includes('Ya existe un capitán')) {
            mostrarNotificacion('Ya existe un capitán con ese nombre', 'error');
        }
        else {
            mostrarNotificacion('Error de conexión', 'error');
        }
    }
}
// Editar capitán maestro
function editarCapitanMaestro(id) {
    const capitan = capitanesMaestro.find(c => c.id === id);
    if (!capitan)
        return;
    capitanEditando = capitan;
    // Llenar formulario
    document.getElementById('maestro-nombre').value = capitan.nombre;
    document.getElementById('maestro-apellido').value = capitan.apellido;
    document.getElementById('maestro-telefono').value = capitan.telefono || '';
    // Cambiar título del formulario
    const header = document.querySelector('#form-capitan-maestro').closest('.card').querySelector('h3');
    if (header)
        header.textContent = 'Editar Capitán';
    // Scroll al formulario
    document.querySelector('#form-capitan-maestro').scrollIntoView({ behavior: 'smooth' });
}
// Eliminar capitán maestro (soft delete)
async function eliminarCapitanMaestro(id) {
    const capitan = capitanesMaestro.find(c => c.id === id);
    if (!capitan)
        return;
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${capitan.nombre} ${capitan.apellido}?`)) {
        return;
    }
    try {
        const { error } = await supabase
            .from('capitanes')
            .update({ activo: false })
            .eq('id', id);
        if (error) {
            console.error('Error al eliminar:', error);
            mostrarNotificacion('Error al eliminar el capitán', 'error');
            return;
        }
        mostrarNotificacion('Capitán eliminado correctamente', 'success');
        cargarCapitanesMaestro();
    }
    catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión', 'error');
    }
}
// Buscar capitanes maestros
function buscarCapitanesMaestro() {
    const termino = document.getElementById('buscar-capitan-maestro').value.toLowerCase().trim();
    if (!termino) {
        mostrarCapitanesMaestro(capitanesMaestro);
        return;
    }
    const capitanesFiltrados = capitanesMaestro.filter(capitan => {
        const nombreCompleto = `${capitan.nombre} ${capitan.apellido}`.toLowerCase();
        return nombreCompleto.includes(termino);
    });
    mostrarCapitanesMaestro(capitanesFiltrados);
}
// Limpiar formulario maestro
function limpiarFormularioMaestro() {
    document.getElementById('form-capitan-maestro').reset();
    capitanEditando = null;
    // Restaurar título del formulario
    const header = document.querySelector('#form-capitan-maestro').closest('.card').querySelector('h3');
    if (header)
        header.textContent = 'Gestionar Capitán';
}
// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notification notification--${tipo}`;
    notificacion.innerHTML = `
    <div class="notification__content">
      <span>${mensaje}</span>
      <button class="notification__close">&times;</button>
    </div>
  `;
    // Agregar al DOM
    document.body.appendChild(notificacion);
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.parentNode.removeChild(notificacion);
        }
    }, 5000);
    // Event listener para cerrar manualmente
    notificacion.querySelector('.notification__close').addEventListener('click', () => {
        if (notificacion.parentNode) {
            notificacion.parentNode.removeChild(notificacion);
        }
    });
}
// Exportar funciones globales
window.editarCapitanMaestro = editarCapitanMaestro;
window.eliminarCapitanMaestro = eliminarCapitanMaestro;
export { cargarCapitanesMaestro, mostrarCapitanesMaestro, editarCapitanMaestro, eliminarCapitanMaestro };
//# sourceMappingURL=capitanes-maestro.js.map