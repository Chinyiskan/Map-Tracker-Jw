/**
 * Componente de Gráfico de Barras Horizontales para Progreso de Barrios
 * Reemplaza completamente el sistema anterior de cobertura-barrios
 * Muestra progreso de ciclos por barrio con diseño moderno y colores pastel
 */
export class BarriosProgressChart {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Contenedor con ID '${containerId}' no encontrado`);
        }
        // Configuración por defecto
        this.config = {
            api: {
                endpoint: '/api/ciclos/progreso',
                timeout: 8000
            },
            theme: 'light',
            animations: true,
            autoRefresh: true,
            refreshInterval: 30000, // 30 segundos
            showStats: true,
            ...options
        };
        // Colores pastel para las barras
        this.colors = [
            '#FFB3BA', // Rosa pastel
            '#BAFFC9', // Verde pastel
            '#BAE1FF', // Azul pastel
            '#FFFFBA', // Amarillo pastel
            '#FFDFBA', // Naranja pastel
            '#E0BBE4', // Púrpura pastel
            '#C7CEEA', // Lavanda pastel
            '#FFDAC1', // Durazno pastel
            '#B5EAD7', // Menta pastel
            '#F0E68C', // Caqui pastel
            '#DDA0DD', // Ciruela pastel
            '#98FB98' // Verde claro pastel
        ];
        this.data = [];
        this.previousDataHash = null; // Hash de los datos anteriores para comparación
        this.refreshTimer = null;
        this.isLoading = false;
        this.init();
    }
    /**
     * Inicializar el componente
     */
    async init() {
        try {
            console.log('🎯 Inicializando BarriosProgressChart...');
            this.createStructure();
            this.injectStyles();
            await this.loadData();
            if (this.config.autoRefresh) {
                this.startAutoRefresh();
            }
            console.log('✅ BarriosProgressChart inicializado correctamente');
        }
        catch (error) {
            console.error('❌ Error inicializando BarriosProgressChart:', error);
            this.showError('Error al inicializar el componente');
        }
    }
    /**
     * Crear la estructura HTML del componente
     */
    createStructure() {
        this.container.innerHTML = `
      <div class="barrios-progress-chart">
        <div class="barrios-progress-chart__header">
          <h3 class="barrios-progress-chart__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <rect x="7" y="7" width="3" height="10"></rect>
              <rect x="14" y="5" width="3" height="12"></rect>
            </svg>
            Progreso por Barrios
          </h3>
          <div class="barrios-progress-chart__stats"></div>
        </div>
        <div class="barrios-progress-chart__content">
          <div class="barrios-progress-chart__loading">
            <div class="loading-spinner"></div>
            <p>Cargando datos...</p>
          </div>
        </div>
      </div>
    `;
    }
    /**
     * Inyectar estilos CSS del componente
     */
    injectStyles() {
        const styleId = 'barrios-progress-chart-styles';
        if (document.getElementById(styleId)) {
            return; // Ya están inyectados
        }
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
      .barrios-progress-chart {
        background: var(--bg-secondary);
        border-radius: var(--radius-lg);
        padding: var(--space-lg);
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--border-color);
      }
      
      .barrios-progress-chart__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-lg);
        padding-bottom: var(--space-md);
        border-bottom: 1px solid var(--border-color);
      }
      
      .barrios-progress-chart__title {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        margin: 0;
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
      }
      
      .barrios-progress-chart__title svg {
        color: var(--accent-primary);
      }
      
      .barrios-progress-chart__stats {
        display: flex;
        gap: var(--space-md);
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
      }
      
      .barrios-progress-chart__content {
        min-height: 400px;
        position: relative;
      }
      
      .barrios-progress-chart__loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 400px;
        color: var(--text-secondary);
      }
      
      .loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--border-color);
        border-top: 3px solid var(--accent-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: var(--space-md);
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes refresh-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .refresh-indicator {
        z-index: 10;
        pointer-events: none;
      }
      
      .refresh-icon {
        color: var(--accent-primary);
      }
      
      .barrios-progress-chart__bars {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
      }
      
      .barrio-progress-bar {
        background: var(--bg-surface);
        border-radius: var(--radius-md);
        padding: var(--space-md);
        border: 1px solid var(--border-color);
        transition: all 0.3s ease;
      }
      
      .barrio-progress-bar:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        border-color: var(--accent-primary);
      }
      
      .barrio-progress-bar__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-sm);
      }
      
      .barrio-progress-bar__name {
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
        font-size: var(--font-size-md);
      }
      
      .barrio-progress-bar__percentage {
        font-weight: var(--font-weight-bold);
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
      }
      
      .barrio-progress-bar__visual {
        width: 100%;
        height: 12px;
        background: var(--border-color);
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: var(--space-xs);
      }
      
      .barrio-progress-bar__fill {
        height: 100%;
        border-radius: 6px;
        transition: width 0.8s ease-in-out;
        position: relative;
        overflow: hidden;
      }
      
      .barrio-progress-bar__fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.3),
          transparent
        );
        animation: shimmer 2s infinite;
      }
      
      @keyframes shimmer {
        0% { left: -100%; }
        100% { left: 100%; }
      }
      
      .barrio-progress-bar__info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: var(--font-size-xs);
        color: var(--text-muted);
      }
      
      .barrio-progress-bar__cycle {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
      }
      
      .barrio-progress-bar__territories {
        font-weight: var(--font-weight-medium);
      }
      
      .barrios-progress-chart__empty {
        text-align: center;
        padding: var(--space-xl);
        color: var(--text-secondary);
      }
      
      .barrios-progress-chart__error {
        text-align: center;
        padding: var(--space-xl);
        color: var(--error);
        background: var(--error-bg);
        border-radius: var(--radius-md);
        border: 1px solid var(--error-border);
      }
      
      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-xs);
      }
      
      .stat-item__value {
        font-weight: var(--font-weight-bold);
        font-size: var(--font-size-lg);
        color: var(--accent-primary);
      }
      
      .stat-item__label {
        font-size: var(--font-size-xs);
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .barrios-progress-chart {
          padding: var(--space-md);
        }
        
        .barrios-progress-chart__header {
          flex-direction: column;
          gap: var(--space-md);
          align-items: flex-start;
        }
        
        .barrios-progress-chart__stats {
          width: 100%;
          justify-content: space-around;
        }
        
        .barrio-progress-bar {
          padding: var(--space-sm);
        }
        
        .barrio-progress-bar__header {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-xs);
        }
      }
    `;
        document.head.appendChild(style);
    }
    /**
     * Cargar datos desde la API - REUTILIZACIÓN INTELIGENTE
     * Usa múltiples llamadas al endpoint individual que ya funciona correctamente
     * @param {boolean} silent - Si es true, no muestra spinner de carga completo
     */
    async loadData(silent = false) {
        if (this.isLoading) {
            console.log('⏳ [BARRIOS-CHART] Ya hay una carga en progreso, omitiendo...');
            return;
        }
        this.isLoading = true;
        console.log(`🚀 [BARRIOS-CHART] Iniciando carga de datos (silent: ${silent})`);
        // Solo mostrar spinner si no hay datos o no es actualización silenciosa
        if (!silent && (!this.data || this.data.length === 0)) {
            console.log('🔄 [BARRIOS-CHART] Mostrando indicador de carga');
            this.showLoading();
        }
        else if (silent) {
            console.log('🔄 [BARRIOS-CHART] Mostrando indicador de actualización silenciosa');
            this.showRefreshIndicator(); // Indicador discreto para actualizaciones
        }
        try {
            console.log('🚀 [BARRIOS-CHART] Intentando cargar progreso usando endpoint agregado optimizado');
            // OPTIMIZACIÓN SPRINT 1: Usar endpoint agregado primero
            let newData = await this._loadDataFromAggregatedEndpoint();
            // Si el endpoint agregado falla, usar fallback a endpoints individuales
            if (!newData || newData.length === 0) {
                console.log('⚠️ [BARRIOS-CHART] Fallback a endpoints individuales');
                newData = await this._loadDataFromIndividualEndpoints();
            }
            if (!newData || newData.length === 0) {
                console.error('❌ [BARRIOS-CHART] No se pudieron cargar datos de ninguna fuente');
                this.showError('No se pudieron cargar los datos de progreso');
                return;
            }
            console.log(`✅ [BARRIOS-CHART] Datos cargados para ${newData.length} barrios usando método optimizado`);
            // Verificar si los datos han cambiado antes de renderizar
            if (this._hasDataChanged(newData)) {
                console.log('🔄 [BARRIOS-CHART] Los datos han cambiado, renderizando...');
                this.data = newData;
                this.previousDataHash = this._generateDataHash(newData);
                this.renderChart();
            }
            else {
                console.log('⏭️ [BARRIOS-CHART] Los datos no han cambiado, omitiendo renderizado');
            }
        }
        catch (error) {
            console.error('❌ [BARRIOS-CHART] Error cargando datos:', error);
            console.error('❌ [BARRIOS-CHART] Stack trace completo:', error.stack);
            this.showError('Error al cargar los datos de progreso');
        }
        finally {
            this.isLoading = false;
            console.log('🏁 [BARRIOS-CHART] Finalizando carga de datos');
            if (silent) {
                this.hideRefreshIndicator();
            }
        }
    }
    /**
     * Crear datos de fallback para un barrio
     * @private
     */
    _createFallbackBarrioData(barrio) {
        return {
            barrio: barrio,
            numero_ciclo: 1,
            total_territorios: 0,
            territorios_completados: 0,
            progreso_porcentaje: 0,
            estado: 'sin_ciclo'
        };
    }
    /**
     * Cargar datos desde endpoint agregado optimizado
     * OPTIMIZACIÓN SPRINT 1: Una sola llamada en lugar de 12
     * @returns {Array} Datos de progreso de todos los barrios
     * @private
     */
    async _loadDataFromAggregatedEndpoint() {
        try {
            console.log('🚀 [BARRIOS-CHART] Usando endpoint agregado: /api/ciclos/progreso');
            console.log('🌐 [BARRIOS-CHART] URL actual:', window.location.href);
            console.log('🔧 [BARRIOS-CHART] Timeout configurado:', this.config.api.timeout);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.api.timeout);
            const startTime = Date.now();
            const response = await fetch('/api/ciclos/progreso', {
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;
            console.log(`⏱️ [BARRIOS-CHART] Tiempo de respuesta: ${responseTime}ms`);
            console.log(`📡 [BARRIOS-CHART] Status HTTP: ${response.status} ${response.statusText}`);
            console.log(`📋 [BARRIOS-CHART] Headers de respuesta:`, Object.fromEntries(response.headers.entries()));
            if (!response.ok) {
                console.error(`❌ [BARRIOS-CHART] Endpoint agregado falló: HTTP ${response.status} ${response.statusText}`);
                // Intentar leer el cuerpo de la respuesta para más detalles
                try {
                    const errorText = await response.text();
                    console.error(`📄 [BARRIOS-CHART] Cuerpo de error:`, errorText);
                }
                catch (e) {
                    console.error(`📄 [BARRIOS-CHART] No se pudo leer el cuerpo de error:`, e.message);
                }
                return null;
            }
            const result = await response.json();
            console.log(`📦 [BARRIOS-CHART] Respuesta completa:`, result);
            if (!result.success) {
                console.error('❌ [BARRIOS-CHART] API reportó fallo:', result.error || 'Error desconocido');
                return null;
            }
            if (!result.data) {
                console.error('❌ [BARRIOS-CHART] No hay datos en la respuesta');
                return null;
            }
            if (!Array.isArray(result.data)) {
                console.error('❌ [BARRIOS-CHART] Los datos no son un array:', typeof result.data, result.data);
                return null;
            }
            console.log(`✅ [BARRIOS-CHART] Endpoint agregado exitoso: ${result.data.length} barrios cargados`);
            console.log(`📊 [BARRIOS-CHART] Datos de barrios:`, result.data.map(b => ({ barrio: b.barrio, progreso: b.progreso_porcentaje })));
            // Adaptar formato si es necesario
            const adaptedData = result.data.map(item => ({
                barrio: item.barrio,
                numero_ciclo: item.numero_ciclo || 1,
                total_territorios: item.total_territorios || 0,
                territorios_completados: item.territorios_completados || 0,
                progreso_porcentaje: item.progreso_porcentaje || 0,
                estado: item.estado || 'sin_ciclo'
            }));
            console.log(`🔄 [BARRIOS-CHART] Datos adaptados:`, adaptedData.length, 'elementos');
            return adaptedData;
        }
        catch (error) {
            console.error('❌ [BARRIOS-CHART] Error en endpoint agregado:', error);
            console.error('❌ [BARRIOS-CHART] Stack trace:', error.stack);
            console.error('❌ [BARRIOS-CHART] Tipo de error:', error.name);
            // Información adicional del entorno
            console.error('🌍 [BARRIOS-CHART] Entorno:', {
                userAgent: navigator.userAgent,
                url: window.location.href,
                protocol: window.location.protocol,
                host: window.location.host
            });
            return null;
        }
    }
    /**
     * Cargar datos desde endpoints individuales (fallback)
     * @returns {Array} Datos de progreso de todos los barrios
     * @private
     */
    async _loadDataFromIndividualEndpoints() {
        try {
            // Lista de barrios - REUTILIZA la misma lista que usa mapas.js
            const barrios = [
                'Acacios', 'Alcalá', 'Ciudad Jardín', 'Guaimaral',
                'La Mar y Gratamira', 'Niza', 'Prados Norte', 'Próceres',
                'San Eduardo', 'Santa Elena', 'Tasajero', 'Zulima'
            ];
            console.log('📊 Fallback: Cargando progreso usando endpoints individuales');
            // Crear peticiones secuenciales con delay para evitar rate limiting
            const progresoData = [];
            for (let i = 0; i < barrios.length; i++) {
                const barrio = barrios[i];
                try {
                    // Delay entre peticiones para evitar rate limiting (200ms entre cada una)
                    if (i > 0) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), this.config.api.timeout);
                    // REUTILIZAR el endpoint individual que ya calcula correctamente
                    const response = await fetch(`/api/ciclos/barrio/${encodeURIComponent(barrio)}/progreso`, {
                        signal: controller.signal,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    clearTimeout(timeoutId);
                    if (!response.ok) {
                        console.warn(`⚠️ Error en ${barrio}: HTTP ${response.status}`);
                        progresoData.push(this._createFallbackBarrioData(barrio));
                        continue;
                    }
                    const result = await response.json();
                    if (!result.success || !result.data) {
                        console.warn(`⚠️ Sin datos para ${barrio}`);
                        progresoData.push(this._createFallbackBarrioData(barrio));
                        continue;
                    }
                    // Adaptar los datos del endpoint individual al formato esperado
                    progresoData.push({
                        barrio: barrio,
                        numero_ciclo: result.data.numero_ciclo || 1,
                        total_territorios: result.data.total_territorios || 0,
                        territorios_completados: result.data.territorios_completados || 0,
                        progreso_porcentaje: result.data.progreso_porcentaje || 0,
                        estado: result.data.estado || 'sin_ciclo'
                    });
                }
                catch (error) {
                    console.warn(`⚠️ Error cargando ${barrio}:`, error.message);
                    progresoData.push(this._createFallbackBarrioData(barrio));
                }
            }
            return progresoData.filter(item => item !== null);
        }
        catch (error) {
            console.error('❌ Error en endpoints individuales:', error);
            return [];
        }
    }
    /**
     * Generar hash simple de los datos para comparación
     * @param {Array} data - Datos a hashear
     * @returns {string} Hash de los datos
     * @private
     */
    _generateDataHash(data) {
        if (!data || data.length === 0)
            return 'empty';
        // Crear string con los valores relevantes para comparación
        const hashString = data
            .sort((a, b) => a.barrio.localeCompare(b.barrio)) // Ordenar para consistencia
            .map(item => `${item.barrio}:${item.progreso_porcentaje}:${item.territorios_completados}:${item.total_territorios}:${item.estado}`)
            .join('|');
        // Hash simple usando suma de códigos de caracteres
        let hash = 0;
        for (let i = 0; i < hashString.length; i++) {
            const char = hashString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir a 32bit integer
        }
        return hash.toString();
    }
    /**
     * Verificar si los datos han cambiado comparando con el hash anterior
     * @param {Array} newData - Nuevos datos
     * @returns {boolean} True si los datos han cambiado
     * @private
     */
    _hasDataChanged(newData) {
        const newHash = this._generateDataHash(newData);
        // Si es la primera carga (no hay hash anterior), siempre renderizar
        if (this.previousDataHash === null) {
            console.log('📊 Primera carga de datos, renderizando gráfica');
            return true;
        }
        const hasChanged = this.previousDataHash !== newHash;
        // OPTIMIZADO: Solo log cuando hay cambios reales, no spam de "sin cambios"
        if (hasChanged) {
            console.log('📊 Datos han cambiado, actualizando gráfica');
        }
        // Removido el log repetitivo de "sin cambios"
        return hasChanged;
    }
    /**
     * Renderizar el gráfico de barras
     */
    renderChart() {
        console.log('🎨 [BARRIOS-CHART] Iniciando renderizado del gráfico');
        const contentElement = this.container.querySelector('.barrios-progress-chart__content');
        if (!contentElement) {
            console.error('❌ [BARRIOS-CHART] No se encontró el elemento contenedor de contenido');
            return;
        }
        if (!this.data || this.data.length === 0) {
            console.warn('⚠️ [BARRIOS-CHART] No hay datos para renderizar');
            contentElement.innerHTML = `
        <div class="barrios-progress-chart__empty">
          <p>No hay datos disponibles</p>
        </div>
      `;
            return;
        }
        console.log(`📊 [BARRIOS-CHART] Renderizando ${this.data.length} barrios`);
        console.log('📊 [BARRIOS-CHART] Datos a renderizar:', this.data);
        // Ordenar barrios alfabéticamente de A a Z
        const sortedData = [...this.data].sort((a, b) => a.barrio.localeCompare(b.barrio, 'es', { sensitivity: 'base' }));
        console.log('📊 [BARRIOS-CHART] Datos ordenados:', sortedData);
        // Renderizar estadísticas
        this.renderStats(sortedData);
        // Renderizar barras
        const barsHtml = sortedData.map((barrio, index) => {
            const percentage = barrio.progreso_porcentaje || 0;
            const color = this.colors[index % this.colors.length];
            const completados = barrio.territorios_completados || 0;
            const total = barrio.total_territorios || 0;
            const ciclo = barrio.numero_ciclo || 1;
            const estado = barrio.estado || 'activo';
            return `
        <div class="barrio-progress-bar" data-barrio="${barrio.barrio}">
          <div class="barrio-progress-bar__header">
            <span class="barrio-progress-bar__name">${barrio.barrio}</span>
            <span class="barrio-progress-bar__percentage">${percentage.toFixed(1)}%</span>
          </div>
          <div class="barrio-progress-bar__visual">
            <div class="barrio-progress-bar__fill" 
                 style="width: ${percentage}%; background-color: ${color};"></div>
          </div>
          <div class="barrio-progress-bar__info">
            <div class="barrio-progress-bar__cycle">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
              Ciclo ${ciclo} • ${this.getEstadoLabel(estado)}
            </div>
            <div class="barrio-progress-bar__territories">
              ${completados}/${total} territorios
            </div>
          </div>
        </div>
      `;
        }).join('');
        contentElement.innerHTML = `
      <div class="barrios-progress-chart__bars">
        ${barsHtml}
      </div>
    `;
        console.log('✅ [BARRIOS-CHART] HTML del gráfico generado e insertado');
        // Animar las barras si está habilitado
        if (this.config.animations) {
            console.log('🎬 [BARRIOS-CHART] Iniciando animaciones');
            this.animateBars();
        }
        console.log('🎨 [BARRIOS-CHART] Renderizado completado exitosamente');
    }
    /**
     * Renderizar estadísticas generales
     */
    renderStats(data) {
        const statsElement = this.container.querySelector('.barrios-progress-chart__stats');
        if (!this.config.showStats || !data.length) {
            statsElement.innerHTML = '';
            return;
        }
        const totalBarrios = data.length;
        const progresoPromedio = data.reduce((sum, barrio) => sum + (barrio.progreso_porcentaje || 0), 0) / totalBarrios;
        const barriosCompletos = data.filter(barrio => (barrio.progreso_porcentaje || 0) >= 100).length;
        statsElement.innerHTML = `
      <div class="stat-item">
        <span class="stat-item__value">${totalBarrios}</span>
        <span class="stat-item__label">Barrios</span>
      </div>
      <div class="stat-item">
        <span class="stat-item__value">${progresoPromedio.toFixed(1)}%</span>
        <span class="stat-item__label">Promedio</span>
      </div>
      <div class="stat-item">
        <span class="stat-item__value">${barriosCompletos}</span>
        <span class="stat-item__label">Completos</span>
      </div>
    `;
    }
    /**
     * Animar las barras de progreso
     */
    animateBars() {
        const bars = this.container.querySelectorAll('.barrio-progress-bar__fill');
        bars.forEach((bar, index) => {
            const width = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = width;
            }, index * 100);
        });
    }
    /**
     * Obtener etiqueta del estado
     */
    getEstadoLabel(estado) {
        const estados = {
            'activo': 'En progreso',
            'completado': 'Completado',
            'pausado': 'Pausado',
            'pendiente': 'Pendiente'
        };
        return estados[estado] || estado;
    }
    /**
     * Mostrar estado de carga
     */
    showLoading() {
        const contentElement = this.container.querySelector('.barrios-progress-chart__content');
        contentElement.innerHTML = `
      <div class="barrios-progress-chart__loading">
        <div class="loading-spinner"></div>
        <p>Cargando datos...</p>
      </div>
    `;
    }
    /**
     * Mostrar indicador discreto de actualización
     */
    showRefreshIndicator() {
        const header = this.container.querySelector('.barrios-progress-chart__header');
        if (!header)
            return;
        // Evitar duplicados
        this.hideRefreshIndicator();
        const indicator = document.createElement('div');
        indicator.className = 'refresh-indicator';
        indicator.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="refresh-icon">
        <polyline points="23 4 23 10 17 10"></polyline>
        <polyline points="1 20 1 14 7 14"></polyline>
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
      </svg>
    `;
        indicator.style.cssText = `
      position: absolute;
      top: var(--space-sm);
      right: var(--space-sm);
      opacity: 0.6;
      animation: refresh-spin 1s linear infinite;
    `;
        header.style.position = 'relative';
        header.appendChild(indicator);
    }
    /**
     * Ocultar indicador de actualización
     */
    hideRefreshIndicator() {
        const indicator = this.container.querySelector('.refresh-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    /**
     * Mostrar error
     */
    showError(message) {
        console.error(`❌ [BARRIOS-CHART] Mostrando error: ${message}`);
        console.error(`❌ [BARRIOS-CHART] Entorno: ${window.location.hostname}`);
        console.error(`❌ [BARRIOS-CHART] URL actual: ${window.location.href}`);
        const contentElement = this.container.querySelector('.barrios-progress-chart__content');
        const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        contentElement.innerHTML = `
      <div class="barrios-progress-chart__error">
        <p>❌ ${message}</p>
        ${isDev ? `<p style="font-size: 0.8em; color: #666; margin-top: 8px;">Entorno: ${window.location.hostname}</p>` : ''}
        <button onclick="this.closest('.barrios-progress-chart').dispatchEvent(new CustomEvent('retry'))" 
                style="margin-top: var(--space-sm); padding: var(--space-xs) var(--space-sm); 
                       background: var(--accent-primary); color: white; border: none; 
                       border-radius: var(--radius-sm); cursor: pointer;">
          Reintentar
        </button>
      </div>
    `;
        // Agregar listener para reintentar
        this.container.addEventListener('retry', () => {
            console.log('🔄 [BARRIOS-CHART] Usuario solicitó reintento');
            this.loadData();
        }, { once: true });
    }
    /**
     * Iniciar actualización automática
     */
    startAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        this.refreshTimer = setInterval(() => {
            if (!this.isLoading) {
                this.loadData(true); // Actualización silenciosa
            }
        }, this.config.refreshInterval);
    }
    /**
     * Detener actualización automática
     */
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
    /**
     * Actualizar datos manualmente
     */
    async refresh() {
        // Si ya hay datos, usar actualización silenciosa
        const silent = this.data && this.data.length > 0;
        await this.loadData(silent);
    }
    /**
     * Destruir el componente
     */
    destroy() {
        console.log('🗑️ Destruyendo BarriosProgressChart...');
        this.stopAutoRefresh();
        // Limpiar contenedor
        if (this.container) {
            this.container.innerHTML = '';
        }
        // Remover estilos si no hay más instancias
        const otherInstances = document.querySelectorAll('.barrios-progress-chart');
        if (otherInstances.length === 0) {
            const styleElement = document.getElementById('barrios-progress-chart-styles');
            if (styleElement) {
                styleElement.remove();
            }
        }
        console.log('🧹 BarriosProgressChart destruido');
    }
}
// Exportar para uso global
if (typeof window !== 'undefined') {
    window.BarriosProgressChart = BarriosProgressChart;
}
export default BarriosProgressChart;
//# sourceMappingURL=barrios-progress-chart.js.map