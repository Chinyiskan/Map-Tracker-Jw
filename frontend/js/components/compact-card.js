/**
 * Componente de Tarjeta Compacta Reutilizable
 * Permite renderizar tarjetas con avatar, contenido e información de manera consistente
 */

export class CompactCard {
  /**
   * Constructor del componente CompactCard
   * @param {Object} config - Configuración del componente
   * @param {string} config.type - Tipo de tarjeta ('capitan', 'salida', 'custom')
   * @param {Object} config.data - Datos para renderizar
   * @param {Object} config.options - Opciones de configuración
   */
  constructor(config = {}) {
    this.type = config.type || 'custom';
    this.data = config.data || {};
    this.options = {
      showAvatar: true,
      showActions: true,
      showStatus: false,
      avatarType: 'initials', // 'initials', 'icon', 'image'
      statusClass: '',
      ...config.options
    };
    this.actions = config.actions || [];
    this.onActionClick = config.onActionClick || (() => {});
  }

  /**
   * Renderizar la tarjeta completa
   * @returns {string} HTML de la tarjeta
   */
  render() {
    return `
      <div class="capitan-card-compact" data-type="${this.type}" data-id="${this.data.id || ''}">
        ${this.options.showAvatar ? this._renderAvatar() : ''}
        ${this._renderContent()}
        ${this.options.showActions ? this._renderActions() : ''}
      </div>
    `;
  }

  /**
   * Renderizar el avatar
   * @private
   * @returns {string} HTML del avatar
   */
  _renderAvatar() {
    const avatarContent = this._getAvatarContent();
    const statusIndicator = this.options.showStatus ? 
      `<div class="capitan-status ${this.options.statusClass}"></div>` : '';

    return `
      <div class="capitan-avatar">
        ${avatarContent}
        ${statusIndicator}
      </div>
    `;
  }

  /**
   * Obtener el contenido del avatar según el tipo
   * @private
   * @returns {string} HTML del contenido del avatar
   */
  _getAvatarContent() {
    switch (this.options.avatarType) {
      case 'initials':
        return `<span class="avatar-initials">${this._getInitials()}</span>`;
      case 'icon':
        return `<div class="avatar-icon">${this.data.icon || '📍'}</div>`;
      case 'image':
        return `<img class="avatar-image" src="${this.data.avatarUrl}" alt="Avatar" />`;
      default:
        return `<span class="avatar-initials">${this._getInitials()}</span>`;
    }
  }

  /**
   * Obtener las iniciales para el avatar
   * @private
   * @returns {string} Iniciales
   */
  _getInitials() {
    if (this.data.initials) {
      return this.data.initials;
    }
    
    // Para capitanes
    if (this.data.nombre && this.data.apellido) {
      return (this.data.nombre.charAt(0) + this.data.apellido.charAt(0)).toUpperCase();
    }
    
    // Para salidas (usar iniciales del capitán)
    if (this.data.capitanes?.nombre && this.data.capitanes?.apellido) {
      return (this.data.capitanes.nombre.charAt(0) + this.data.capitanes.apellido.charAt(0)).toUpperCase();
    }
    
    // Fallback
    return this.data.title?.substring(0, 2).toUpperCase() || 'XX';
  }

  /**
   * Renderizar el contenido principal
   * @private
   * @returns {string} HTML del contenido
   */
  _renderContent() {
    const title = this._getTitle();
    const details = this._getDetails();

    return `
      <div class="capitan-content">
        <h4 class="${this._getTitleClass()}">${title}</h4>
        <div class="capitan-details">
          ${details.map(detail => this._renderDetail(detail)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Obtener el título de la tarjeta
   * @private
   * @returns {string} Título
   */
  _getTitle() {
    switch (this.type) {
      case 'capitan':
        return `${this.data.nombre} ${this.data.apellido}`;
      case 'salida':
        return this.data.barrio_asignado || this.data.barrio;
      default:
        return this.data.title || 'Sin título';
    }
  }

  /**
   * Obtener la clase CSS del título
   * @private
   * @returns {string} Clase CSS
   */
  _getTitleClass() {
    switch (this.type) {
      case 'capitan':
        return 'capitan-name';
      case 'salida':
        return 'barrio-name';
      default:
        return 'card-title';
    }
  }

  /**
   * Obtener los detalles de la tarjeta
   * @private
   * @returns {Array} Array de objetos de detalle
   */
  _getDetails() {
    switch (this.type) {
      case 'capitan':
        return this._getCapitanDetails();
      case 'salida':
        return this._getSalidaDetails();
      default:
        return this.data.details || [];
    }
  }

  /**
   * Obtener detalles específicos para capitanes
   * @private
   * @returns {Array} Detalles del capitán
   */
  _getCapitanDetails() {
    const details = [];
    
    if (this.data.telefono) {
      details.push({
        icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>`,
        text: this.data.telefono,
        class: 'capitan-phone'
      });
    }
    
    if (this.data.fecha_creacion) {
      const fecha = new Date(this.data.fecha_creacion);
      const fechaFormateada = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      details.push({
        text: fechaFormateada,
        class: 'capitan-date'
      });
    }
    
    return details;
  }

  /**
   * Obtener detalles específicos para salidas
   * @private
   * @returns {Array} Detalles de la salida
   */
  _getSalidaDetails() {
    const details = [];
    
    // Información del capitán
    if (this.data.capitanes?.nombre && this.data.capitanes?.apellido) {
      details.push({
        icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>`,
        text: `${this.data.capitanes.nombre} ${this.data.capitanes.apellido}`,
        class: 'capitan-nombre'
      });
    }
    
    // Horario
    if (this.data.dia_semana && this.data.hora) {
      const diaCapitalizado = this.data.dia_semana.charAt(0).toUpperCase() + this.data.dia_semana.slice(1);
      const horaFormateada = this._formatTime(this.data.hora);
      details.push({
        icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>`,
        text: `${diaCapitalizado} ${horaFormateada}`,
        class: 'salida-horario'
      });
    }
    
    // Teléfono del capitán
    if (this.data.capitanes?.telefono) {
      details.push({
        icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>`,
        text: this.data.capitanes.telefono,
        class: 'salida-telefono'
      });
    }
    
    return details;
  }

  /**
   * Renderizar un detalle individual
   * @private
   * @param {Object} detail - Objeto de detalle
   * @returns {string} HTML del detalle
   */
  _renderDetail(detail) {
    const icon = detail.icon || '';
    const className = detail.class || 'detail-item';
    
    return `
      <span class="${className}">
        ${icon}
        ${detail.text}
      </span>
    `;
  }

  /**
   * Renderizar las acciones
   * @private
   * @returns {string} HTML de las acciones
   */
  _renderActions() {
    if (!this.actions || this.actions.length === 0) {
      return '';
    }

    const actionsHtml = this.actions.map(action => {
      return `
        <button class="action-btn ${action.class || ''}" 
                data-action="${action.action}" 
                data-id="${this.data.id}" 
                title="${action.title || action.action}">
          ${action.icon}
        </button>
      `;
    }).join('');

    return `
      <div class="capitan-actions-compact">
        ${actionsHtml}
      </div>
    `;
  }

  /**
   * Formatear hora
   * @private
   * @param {string} hora - Hora en formato HH:MM o HH:MM:SS
   * @returns {string} Hora formateada
   */
  _formatTime(hora) {
    if (!hora) return '';
    
    // Si ya está en formato HH:MM, devolverlo tal como está
    if (hora.length === 5 && hora.includes(':')) {
      return hora;
    }
    
    // Si está en formato HH:MM:SS, extraer solo HH:MM
    if (hora.length === 8 && hora.includes(':')) {
      return hora.substring(0, 5);
    }
    
    return hora;
  }

  /**
   * Configurar event listeners para las acciones
   * @param {HTMLElement} container - Contenedor donde se renderizó la tarjeta
   */
  setupEventListeners(container) {
    const card = container.querySelector(`[data-id="${this.data.id}"]`);
    if (!card) return;

    const actionButtons = card.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const action = e.currentTarget.dataset.action;
        const id = e.currentTarget.dataset.id;
        
        this.onActionClick({
          action,
          id,
          data: this.data,
          element: e.currentTarget
        });
      });
    });
  }

  /**
   * Método estático para crear múltiples tarjetas
   * @param {Array} items - Array de datos para las tarjetas
   * @param {Object} config - Configuración común
   * @returns {string} HTML de todas las tarjetas
   */
  static renderMultiple(items, config = {}) {
    return items.map(item => {
      const cardConfig = {
        ...config,
        data: item
      };
      const card = new CompactCard(cardConfig);
      return card.render();
    }).join('');
  }

  /**
   * Método estático para configurar event listeners de múltiples tarjetas
   * @param {HTMLElement} container - Contenedor de las tarjetas
   * @param {Array} cards - Array de instancias CompactCard
   */
  static setupMultipleEventListeners(container, cards) {
    cards.forEach(card => {
      card.setupEventListeners(container);
    });
  }
}

// Configuraciones predefinidas para diferentes tipos
export const CompactCardPresets = {
  capitan: {
    type: 'capitan',
    options: {
      showAvatar: true,
      showActions: true,
      showStatus: false,
      avatarType: 'initials'
    },
    actions: [
      {
        action: 'edit',
        class: 'edit-btn',
        title: 'Editar',
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>`
      },
      {
        action: 'delete',
        class: 'delete-btn',
        title: 'Eliminar',
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>`
      }
    ]
  },
  
  salida: {
    type: 'salida',
    options: {
      showAvatar: true,
      showActions: true,
      showStatus: true,
      statusClass: 'salida-status',
      avatarType: 'initials'
    },
    actions: [
      {
        action: 'edit',
        class: 'edit-btn',
        title: 'Editar',
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>`
      },
      {
        action: 'delete',
        class: 'delete-btn',
        title: 'Eliminar',
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>`
      }
    ]
  }
};

export default CompactCard;