/**
 * Modal Error Component
 * Modal que aparece con error y desaparece automáticamente
 */

class ModalError {
  constructor(options = {}) {
    this.autoHide = options.autoHide || true;
    this.autoHideDelay = options.autoHideDelay || 4000;
    this.containerId = options.containerId || 'modal-error-container';
    this.init();
  }

  /**
   * Inicializa el componente
   */
  init() {
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      document.body.appendChild(container);
    }
  }

  /**
   * Muestra modal de error
   */
  show(message = 'Datos incorrectos') {
    const container = document.getElementById(this.containerId);

    container.innerHTML = `
      <div id="modal-error-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9998;
        animation: fadeIn 0.3s ease-in;
      "></div>
      <div id="modal-error-box" style="
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
        max-width: 320px;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="
          font-size: 48px;
          margin-bottom: 20px;
        ">❌</div>
        <h2 style="
          margin: 0 0 10px 0;
          color: #1B2132;
          font-size: 18px;
          font-weight: 600;
        ">Error</h2>
        <p style="
          margin: 0 0 25px 0;
          color: #666;
          font-size: 14px;
          line-height: 1.5;
        ">${message}</p>
        <button id="modal-error-reintentar" style="
          width: 100%;
          padding: 12px;
          background: #1B2132;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        ">Reintentar</button>
      </div>
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -55%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      </style>
    `;

    // Event listener para botón Reintentar
    document.getElementById('modal-error-reintentar').addEventListener('click', () => {
      this.hide();
    });

    console.log('[MODAL ERROR] Mostrado');

    // Auto-hide después de N segundos
    if (this.autoHide) {
      setTimeout(() => this.hide(), this.autoHideDelay);
    }
  }

  /**
   * Oculta el modal
   */
  hide() {
    const container = document.getElementById(this.containerId);
    container.innerHTML = '';

    console.log('[MODAL ERROR] Ocultado');
  }
}

// Exportar para uso en navegador
if (typeof window !== 'undefined') {
  window.ModalError = ModalError;
}
