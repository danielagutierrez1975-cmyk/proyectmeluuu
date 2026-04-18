/**
 * Configuración centralizada de API URLs
 * Detecta automáticamente si está en desarrollo o producción
 */

const API_CONFIG = {
  // Detectar automáticamente el ambiente
  getApiUrl: function() {
    // Si está en localhost, usar localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000/api';
    }

    // Si está en Render o producción, usar Render URL
    return 'https://proyectmeluuu.onrender.com/api';
  },

  // URL explícita (comentada, para cambios manuales si es necesario)
  // apiUrl: 'https://proyectmeluuu.onrender.com/api',

  // Opciones de polling
  pollingInterval: 2000,        // 2 segundos
  maxRetries: 150,              // ~5 minutos
};

// Disponible globalmente
window.API_CONFIG = API_CONFIG;
