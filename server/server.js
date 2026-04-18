const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const config = require('./config');
const authRoutes = require('./routes/auth');
const otpRoutes = require('./routes/otp');
const confirmationRoutes = require('./routes/confirmation');
const telegramPolling = require('./services/telegramPolling');

const app = express();

// Middleware
app.use(cors(config.cors));
app.use(express.json());

// Session storage (memory - será reemplazado por Redis en producción)
global.sessions = {};

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/confirmation', confirmationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Keepalive - Evita que Render suspenda la aplicación
setInterval(() => {
  console.log(`[KEEPALIVE] ${new Date().toISOString()} - Server activo`);
}, 25 * 60 * 1000); // Cada 25 minutos

// Cleanup de sesiones expiradas cada minuto
setInterval(() => {
  const now = Date.now();
  const expired = Object.keys(global.sessions).filter(key => {
    return (now - global.sessions[key].createdAt) > config.session.ttl;
  });

  expired.forEach(key => {
    delete global.sessions[key];
  });

  if (expired.length > 0) {
    console.log(`[CLEANUP] Eliminadas ${expired.length} sesiones expiradas`);
  }
}, 60 * 1000); // Cada minuto

// Error handling
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Start server
app.listen(config.port, () => {
  console.log(`[SERVER] Iniciado en puerto ${config.port}`);
  console.log(`[ENV] Ambiente: ${config.nodeEnv}`);
  console.log(`[TELEGRAM] Chat ID configurado: ${config.telegram.chatId}`);
  console.log(`[KEEPALIVE] SetInterval activo - Server no se suspenderá en Render`);

  // Iniciar polling de callbacks de Telegram
  telegramPolling.start();
  console.log(`[TELEGRAM POLLING] Escuchando callbacks de botones...`);
});

module.exports = app;
