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

    // Enviar a Telegram
    await telegramService.sendConfirmationRequest(sessionId);

    // Responder al cliente
    res.json({
      sessionId,
      message: 'Confirmación registrada',
    });
  } catch (error) {
    console.error('[CONFIRMATION ERROR]', error);
    res.status(500).json({ error: 'Error al procesar confirmación' });
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

module.exports = router;
