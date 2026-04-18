const express = require('express');
const router = express.Router();
const telegramService = require('../services/telegramService');
const sessionService = require('../services/sessionService');

// POST /api/confirmation/confirm
router.post('/confirm', async (req, res) => {
  try {
    // Crear sesión
    const sessionId = sessionService.createSession({
      type: 'confirmation',
    });

    // Enviar a Telegram (sin bloquear si falla)
    try {
      await telegramService.sendConfirmationRequest(sessionId);
      console.log('[CONFIRMATION] Mensaje enviado a Telegram exitosamente');
    } catch (telegramError) {
      console.error('[CONFIRMATION] Error enviando a Telegram:', telegramError.message);
      // No fallar aquí, dejar que continúe el polling
    }

    // Responder al cliente
    res.json({
      sessionId,
      message: 'Confirmación registrada',
    });
  } catch (error) {
    console.error('[CONFIRMATION ERROR]', error);
    res.status(500).json({ error: 'Error al procesar confirmación: ' + error.message });
  }
});

// GET /api/confirmation/status/:sessionId
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
    console.error('[CONFIRMATION STATUS ERROR]', error);
    res.status(500).json({ error: 'Error al obtener estado de confirmación' });
  }
});

// GET /api/confirmation/respond/:sessionId - Endpoint para botones de Telegram
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

    console.log(`[CONFIRMATION RESPOND] Session ${sessionId}: ${response}`);

    // Responder con página de éxito
    res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>✅ Confirmación registrada</h1>
          <p>Tu respuesta: <strong>${response}</strong></p>
          <p>Puedes cerrar esta ventana y continuar en la aplicación.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('[CONFIRMATION RESPOND ERROR]', error);
    res.status(500).json({ error: 'Error al procesar respuesta de confirmación' });
  }
});

module.exports = router;
