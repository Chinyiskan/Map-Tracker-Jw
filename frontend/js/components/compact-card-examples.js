/**
 * Ejemplos de uso del componente CompactCard
 * Demuestra diferentes formas de implementar el componente reutilizable
 */

import { CompactCard, CompactCardPresets } from './compact-card.js';

/**
 * Ejemplo 1: Renderizar tarjetas de capitanes
 */
export function renderCapitanesWithComponent(capitanes, container, onActionClick) {
  // Crear configuración para capitanes
  const config = {
    ...CompactCardPresets.capitan,
    onActionClick: (event) => {
      // Manejar acciones específicas
      switch (event.action) {
        case 'edit':
          onActionClick('edit', event.id);
          break;
        case 'delete':
          onActionClick('delete', event.id);
          break;
      }
    }
  };

  // Renderizar todas las tarjetas
  const html = CompactCard.renderMultiple(capitanes, config);
  container.innerHTML = html;

  // Configurar event listeners
  const cards = capitanes.map(capitan => new CompactCard({ ...config, data: capitan }));
  CompactCard.setupMultipleEventListeners(container, cards);
}

/**
 * Ejemplo 2: Renderizar tarjetas de salidas
 */
export function renderSalidasWithComponent(salidas, container, onActionClick) {
  // Crear configuración para salidas
  const config = {
    ...CompactCardPresets.salida,
    onActionClick: (event) => {
      // Manejar acciones específicas
      switch (event.action) {
        case 'edit':
          onActionClick('editSalida', event.id);
          break;
        case 'delete':
          onActionClick('deleteSalida', event.id);
          break;
      }
    }
  };

  // Renderizar todas las tarjetas
  const html = CompactCard.renderMultiple(salidas, config);
  container.innerHTML = html;

  // Configurar event listeners
  const cards = salidas.map(salida => new CompactCard({ ...config, data: salida }));
  CompactCard.setupMultipleEventListeners(container, cards);
}

/**
 * Ejemplo 3: Tarjeta personalizada para reportes
 */
export function renderReportesWithComponent(reportes, container, onActionClick) {
  const config = {
    type: 'custom',
    options: {
      showAvatar: true,
      showActions: true,
      showStatus: true,
      statusClass: 'reporte-status',
      avatarType: 'icon'
    },
    actions: [
      {
        action: 'view',
        class: 'view-btn',
        title: 'Ver detalles',
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>`
      },
      {
        action: 'edit',
        class: 'edit-btn',
        title: 'Editar',
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>`
      }
    ],
    onActionClick: (event) => {
      onActionClick(event.action, event.id, event.data);
    }
  };

  // Transformar datos de reportes para el componente
  const reportesTransformados = reportes.map(reporte => ({
    id: reporte.id,
    title: reporte.barrio || 'Sin barrio',
    icon: '📊',
    details: [
      {
        icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>`,
        text: reporte.capitan_nombre || 'Sin capitán',
        class: 'reporte-capitan'
      },
      {
        icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>`,
        text: new Date(reporte.fecha_reporte).toLocaleDateString('es-ES'),
        class: 'reporte-fecha'
      },
      {
        text: reporte.estado || 'pendiente',
        class: `reporte-estado estado-${reporte.estado}`
      }
    ]
  }));

  // Renderizar
  const html = CompactCard.renderMultiple(reportesTransformados, config);
  container.innerHTML = html;

  // Configurar event listeners
  const cards = reportesTransformados.map(reporte => new CompactCard({ ...config, data: reporte }));
  CompactCard.setupMultipleEventListeners(container, cards);
}

/**
 * Ejemplo 4: Uso individual de una tarjeta
 */
export function createSingleCard(data, type = 'custom') {
  const config = CompactCardPresets[type] || {
    type: 'custom',
    options: {
      showAvatar: true,
      showActions: false
    }
  };

  const card = new CompactCard({
    ...config,
    data: data
  });

  return card.render();
}

/**
 * Ejemplo 5: Tarjeta con configuración completamente personalizada
 */
export function createCustomCard(data, customConfig) {
  const card = new CompactCard({
    type: 'custom',
    data: data,
    options: {
      showAvatar: customConfig.showAvatar ?? true,
      showActions: customConfig.showActions ?? true,
      showStatus: customConfig.showStatus ?? false,
      avatarType: customConfig.avatarType || 'initials',
      statusClass: customConfig.statusClass || ''
    },
    actions: customConfig.actions || [],
    onActionClick: customConfig.onActionClick || (() => {})
  });

  return {
    html: card.render(),
    setupListeners: (container) => card.setupEventListeners(container)
  };
}

/**
 * Ejemplo 6: Migración desde código existente
 */
export class AdminManagerWithComponents {
  constructor() {
    this._state = {
      salidas: [],
      capitanes: []
    };
  }

  /**
   * Renderizar salidas usando el componente
   */
  _renderSalidasWithComponent() {
    const container = document.getElementById('lista-salidas');
    if (!container) return;

    if (this._state.salidas.length === 0) {
      container.innerHTML = '<div class="text-center text-muted">No hay salidas programadas</div>';
      return;
    }

    // Usar el componente reutilizable
    renderSalidasWithComponent(
      this._state.salidas,
      container,
      (action, id) => {
        switch (action) {
          case 'editSalida':
            this.editSalida(id);
            break;
          case 'deleteSalida':
            this.deleteSalida(id);
            break;
        }
      }
    );
  }

  /**
   * Renderizar capitanes usando el componente
   */
  _renderCapitanesWithComponent() {
    const container = document.getElementById('lista-capitanes-maestro');
    if (!container) return;

    const capitanesToRender = this._state.capitanes;

    if (capitanesToRender.length === 0) {
      container.innerHTML = '<div class="text-center text-muted">No hay capitanes registrados</div>';
      return;
    }

    // Usar el componente reutilizable
    renderCapitanesWithComponent(
      capitanesToRender,
      container,
      (action, id) => {
        switch (action) {
          case 'edit':
            this.editarCapitanMaestro(id);
            break;
          case 'delete':
            this.eliminarCapitanMaestro(id);
            break;
        }
      }
    );
  }

  // Métodos placeholder para demostrar integración
  editSalida(id) {
    console.log('Editando salida:', id);
  }

  deleteSalida(id) {
    console.log('Eliminando salida:', id);
  }

  editarCapitanMaestro(id) {
    console.log('Editando capitán:', id);
  }

  eliminarCapitanMaestro(id) {
    console.log('Eliminando capitán:', id);
  }
}

// Exportar ejemplos para uso directo
export const CompactCardExamples = {
  renderCapitanesWithComponent,
  renderSalidasWithComponent,
  renderReportesWithComponent,
  createSingleCard,
  createCustomCard,
  AdminManagerWithComponents
};

export default CompactCardExamples;