/**
 * Shadow Loader Component
 * Componente de carga integrado que se superpone sobre el contenido
 */

class ShadowLoader {
  constructor(options = {}) {
    this.visible = false;
    this.autoHide = options.autoHide || false;
    this.autoHideDelay = options.autoHideDelay || 4000;
    this.message = options.message || 'Cargando...';
    this.containerId = options.containerId || 'shadow-loader-container';
    this.init();
  }

  /**
   * Inicializa el componente
   */
  init() {
    // Crear contenedor principal
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      document.body.appendChild(container);
    }

    // Inyectar HTML
    container.innerHTML = `
      <div id="shadow-loader-overlay" style="
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9998;
      "></div>
      <div id="shadow-loader-box" style="
        display: none;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 12px;
        padding: 40px;
        text-align: center;
        z-index: 9999;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        min-width: 250px;
      ">
        <div style="
          width: 50px;
          height: 50px;
          margin: 0 auto 20px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #1B2132;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        <p id="shadow-loader-message" style="
          margin: 0;
          color: #1B2132;
          font-size: 14px;
          font-weight: 500;
        ">${this.message}</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
  }

  /**
   * Muestra el loader
   */
  show(message = null) {
    if (message) {
      this.message = message;
      const msgEl = document.getElementById('shadow-loader-message');
      if (msgEl) msgEl.textContent = message;
    }

    const overlay = document.getElementById('shadow-loader-overlay');
    const box = document.getElementById('shadow-loader-box');

    if (overlay && box) {
      overlay.style.display = 'block';
      box.style.display = 'block';
      this.visible = true;

      console.log('[LOADER] Mostrado');

      if (this.autoHide) {
        setTimeout(() => this.hide(), this.autoHideDelay);
      }
    }
  }

  /**
   * Oculta el loader
   */
  hide() {
    const overlay = document.getElementById('shadow-loader-overlay');
    const box = document.getElementById('shadow-loader-box');

    if (overlay && box) {
      overlay.style.display = 'none';
      box.style.display = 'none';
      this.visible = false;

      console.log('[LOADER] Ocultado');
    }
  }

  /**
   * Toggle del loader
   */
  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
}

// Exportar para uso en navegador
if (typeof window !== 'undefined') {
  window.ShadowLoader = ShadowLoader;
}
