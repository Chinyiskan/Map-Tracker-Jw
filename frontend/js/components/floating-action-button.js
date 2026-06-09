/**
 * Componente FloatingActionButton (FAB)
 * Optimiza la navegación en dispositivos móviles/tabletas permitiendo transiciones
 * de scroll suaves (smooth scroll) entre el mapa y el formulario de reporte/tabla de consulta.
 */
export class FloatingActionButton {
  constructor() {
    this.container = null;
    this.button = null;
    this.visiblePanel = null;
    this.isUp = false;
    this.observer = null;
    this.mutationObserver = null;
    this.boundCheckScroll = this.checkScrollPosition.bind(this);
  }

  /**
   * Inicializa una instancia del FAB
   */
  static init() {
    console.log('🔘 Inicializando Floating Action Button (FAB)...');
    const fab = new FloatingActionButton();
    fab.create();
    fab.setupScrollTracking();
    return fab;
  }

  /**
   * Crea la estructura HTML del botón flotante y la inyecta al DOM
   */
  create() {
    if (document.getElementById('fab-container')) return;

    // Contenedor principal
    this.container = document.createElement('div');
    this.container.id = 'fab-container';
    this.container.className = 'fab-container';

    // Botón
    this.button = document.createElement('button');
    this.button.className = 'fab-button';
    this.button.setAttribute('aria-label', 'Desplazarse hacia abajo');
    this.button.setAttribute('title', 'Desplazarse hacia abajo');
    this.button.setAttribute('type', 'button');
    
    // Icono Flecha Abajo (por defecto)
    this.button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <polyline points="19 12 12 19 5 12"></polyline>
      </svg>
    `;

    this.container.appendChild(this.button);
    document.body.appendChild(this.container);

    // Evento Click
    this.button.addEventListener('click', () => this.handleButtonClick());
  }

  /**
   * Configura la detección de cambios del panel visible y el scroll
   */
  setupScrollTracking() {
    this.updateTargetPanel();

    // Observador de mutaciones para detectar cuándo se ocultan/muestran los paneles
    const layoutGrid = document.querySelector('.mapa-layout-grid');
    if (layoutGrid) {
      this.mutationObserver = new MutationObserver(() => {
        this.updateTargetPanel();
      });
      this.mutationObserver.observe(layoutGrid, {
        attributes: true,
        subtree: true,
        attributeFilter: ['style', 'class']
      });
    }

    // Evento de scroll (con throttle pasivo para rendimiento)
    window.addEventListener('scroll', this.boundCheckScroll, { passive: true });
  }

  /**
   * Identifica qué panel está visible en el DOM (formulario o consulta)
   */
  updateTargetPanel() {
    const formPanel = document.getElementById('panel-formulario');
    const consultaPanel = document.getElementById('panel-consulta');

    let activePanel = null;

    if (formPanel && window.getComputedStyle(formPanel).display !== 'none') {
      activePanel = formPanel;
    } else if (consultaPanel && window.getComputedStyle(consultaPanel).display !== 'none') {
      activePanel = consultaPanel;
    }

    if (activePanel !== this.visiblePanel) {
      this.visiblePanel = activePanel;

      if (this.visiblePanel) {
        this.button.classList.add('is-visible');
        this.setupIntersectionObserver();
        this.checkScrollPosition();
      } else {
        this.button.classList.remove('is-visible');
        if (this.observer) {
          this.observer.disconnect();
          this.observer = null;
        }
      }
    }
  }

  /**
   * Configura el IntersectionObserver para detectar cuándo el panel activo entra en pantalla
   */
  setupIntersectionObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    if (!this.visiblePanel) return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Si el panel inferior está visible en más del 15% de la pantalla, apuntamos hacia arriba
        this.setDirection(entry.isIntersecting);
      });
    }, {
      threshold: 0.15
    });

    this.observer.observe(this.visiblePanel);
  }

  /**
   * Comprobación de respaldo basada en scroll
   */
  checkScrollPosition() {
    if (!this.visiblePanel) return;

    const panelRect = this.visiblePanel.getBoundingClientRect();
    // Si la parte superior del panel está a menos del 60% del viewport
    const isPanelInView = panelRect.top < window.innerHeight * 0.6;
    
    this.setDirection(isPanelInView);
  }

  /**
   * Cambia el sentido y aria-label del botón flotante
   * @param {boolean} isUp - true para apuntar hacia arriba, false para abajo
   */
  setDirection(isUp) {
    if (this.isUp === isUp) return;

    this.isUp = isUp;
    if (isUp) {
      this.button.classList.add('fab-button--up');
      this.button.setAttribute('aria-label', 'Desplazarse hacia arriba');
      this.button.setAttribute('title', 'Desplazarse hacia arriba');
    } else {
      this.button.classList.remove('fab-button--up');
      this.button.setAttribute('aria-label', 'Desplazarse hacia abajo');
      this.button.setAttribute('title', 'Desplazarse hacia abajo');
    }
  }

  /**
   * Realiza el desplazamiento suave según el estado actual
   */
  handleButtonClick() {
    if (this.isUp) {
      // Scroll hacia arriba (header/mapa)
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else if (this.visiblePanel) {
      // Scroll hacia el panel de datos
      this.visiblePanel.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  /**
   * Destruye y limpia recursos
   */
  destroy() {
    if (this.observer) this.observer.disconnect();
    if (this.mutationObserver) this.mutationObserver.disconnect();
    window.removeEventListener('scroll', this.boundCheckScroll);
    if (this.container && this.container.parentNode) {
      this.container.remove();
    }
  }
}
