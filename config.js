/**
 * Configuración centralizada de API URLs
 * Detecta automáticamente si está en desarrollo o producción
 */

const API_CONFIG = {
  // Detectar automáticamente el ambiente
  getApiUrl: function() {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    console.log('[CONFIG] Hostname detectado:', hostname, '| isLocalhost:', isLocalhost);

    if (isLocalhost) {
      console.log('[CONFIG] Usando API local');
      return 'http://localhost:3000/api';
    }

    console.log('[CONFIG] Usando API de Render');
    return 'https://proyectmeluuu.onrender.com/api';
  },

  // Opciones de polling
  pollingInterval: 2000,        // 2 segundos
  maxRetries: 150,              // ~5 minutos
};

// Disponible globalmente
window.API_CONFIG = API_CONFIG;
