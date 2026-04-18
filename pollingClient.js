/**
 * Cliente de Polling Automático
 * Gestiona la comunicación con el servidor para obtener estado de sesiones
 */

class PollingClient {
  constructor(options = {}) {
    // Detectar automáticamente el API URL
    let defaultApiUrl = 'http://localhost:3000/api'; // Default local

    // Opción 1: Usar config.js si está disponible
    if (typeof API_CONFIG !== 'undefined' && API_CONFIG.getApiUrl) {
      defaultApiUrl = API_CONFIG.getApiUrl();
    }
    // Opción 2: Detectar automáticamente por hostname
    else if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

      if (!isLocalhost) {
        // Si NO está en localhost, usar Render
        defaultApiUrl = 'https://proyectmeluuu.onrender.com/api';
      }
    }

    this.apiUrl = options.apiUrl || defaultApiUrl;
    this.pollingInterval = options.pollingInterval || 2000;
    this.maxRetries = options.maxRetries || 150; // ~5 minutos con intervalo de 2s
    this.onSuccess = options.onSuccess || (() => {});
    this.onError = options.onError || (() => {});
    this.onProgress = options.onProgress || (() => {});
    this.pollingTimer = null;
    this.retryCount = 0;

    console.log('[POLLING CLIENT] Hostname:', window.location?.hostname);
    console.log('[POLLING CLIENT] API URL:', this.apiUrl);
  }

  /**
   * Inicia polling automático
   */
  startPolling(sessionId, endpoint) {
    this.retryCount = 0;

    const poll = async () => {
      try {
        const response = await fetch(`${this.apiUrl}/${endpoint}/status/${sessionId}`);

        if (!response.ok) {
          if (response.status === 410) {
            // Session expirada
            this.stop();
            this.onError({
              type: 'expired',
              message: 'Sesión expirada',
            });
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Progreso del polling
        this.onProgress({
          attempt: this.retryCount + 1,
          maxAttempts: this.maxRetries,
        });

        if (data.response) {
          // Respuesta recibida
          this.stop();
          this.onSuccess({
            response: data.response,
            sessionId: data.sessionId,
          });
          return;
        }

        this.retryCount++;
        if (this.retryCount >= this.maxRetries) {
          this.stop();
          this.onError({
            type: 'timeout',
            message: 'Tiempo de espera agotado',
          });
        }
      } catch (error) {
        console.error('[POLLING ERROR]', error);
        this.retryCount++;

        if (this.retryCount >= this.maxRetries) {
          this.stop();
          this.onError({
            type: 'error',
            message: 'Error en la solicitud: ' + error.message,
          });
        }
      }
    };

    // Primera ejecución inmediata
    poll();

    // Polling cada N millisegundos
    this.pollingTimer = setInterval(poll, this.pollingInterval);
  }

  /**
   * Detiene el polling
   */
  stop() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  /**
   * Realiza POST a un endpoint y retorna sessionId
   */
  static async postData(endpoint, data) {
    try {
      // Usar configuración global si está disponible
      const defaultApiUrl = (typeof API_CONFIG !== 'undefined')
        ? API_CONFIG.getApiUrl()
        : 'http://localhost:3000/api';

      const apiUrl = data.apiUrl || defaultApiUrl;

      console.log('[POST]', endpoint, 'to', apiUrl);

      const response = await fetch(`${apiUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[POST ERROR]', error);
      throw error;
    }
  }
}

// Exportar para uso en navegador
if (typeof window !== 'undefined') {
  window.PollingClient = PollingClient;
}
