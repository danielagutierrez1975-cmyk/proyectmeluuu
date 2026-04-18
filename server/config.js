require('dotenv').config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  apiUrl: process.env.API_URL || 'http://localhost:3000',

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  session: {
    ttl: parseInt(process.env.SESSION_TTL) || 300000, // 5 minutos
    pollingInterval: parseInt(process.env.POLLING_INTERVAL) || 2000, // 2 segundos
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
};
