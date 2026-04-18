const axios = require('axios');
const config = require('../config');
const sessionService = require('./sessionService');

class TelegramPolling {
  constructor() {
    this.botToken = config.telegram.botToken;
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
    this.lastUpdateId = 0;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[TELEGRAM POLLING] Iniciando polling de callbacks...');
    // deleteWebhook primero para evitar conflicto con getUpdates
    this.deleteWebhook().then(() => {
      this.poll();
    });
  }

  async deleteWebhook() {
    try {
      await axios.post(`${this.apiUrl}/deleteWebhook`, { drop_pending_updates: false });
      console.log('[TELEGRAM POLLING] Webhook eliminado (si existía)');
    } catch (err) {
      console.warn('[TELEGRAM POLLING] Error eliminando webhook:', err.message);
    }
  }

  async poll() {
    while (this.isRunning) {
      try {
        const response = await axios.get(`${this.apiUrl}/getUpdates`, {
          params: {
            offset: this.lastUpdateId + 1,
            timeout: 10,
            allowed_updates: ['callback_query'],
          },
          timeout: 15000,
        });

        const updates = response.data.result || [];

        if (updates.length > 0) {
          console.log(`[TELEGRAM POLLING] ${updates.length} update(s) recibidos`);
        }

        for (const update of updates) {
          this.lastUpdateId = update.update_id;

          if (update.callback_query) {
            await this.processCallback(update.callback_query);
          }
        }
      } catch (error) {
        console.error('[TELEGRAM POLLING ERROR]', error.message);
        await this.sleep(3000);
      }
    }
  }

  async processCallback(callbackQuery) {
    const data = callbackQuery.data; // formato: "sessionId|response"
    const callbackId = callbackQuery.id;
    const messageId = callbackQuery.message?.message_id;
    const chatId = callbackQuery.message?.chat?.id;

    console.log('[TELEGRAM CALLBACK] Data recibida:', data);

    // Responder al callback para quitar el "loading" del botón
    await this.answerCallback(callbackId);

    // Parsear sessionId y respuesta
    const parts = data.split('|');
    if (parts.length !== 2) {
      console.warn('[TELEGRAM CALLBACK] Formato inválido:', data);
      return;
    }

    const [sessionId, responseValue] = parts;
    const session = sessionService.getSession(sessionId);

    if (!session) {
      console.warn('[TELEGRAM CALLBACK] Sesión no encontrada:', sessionId);
      return;
    }

    // Actualizar sesión con la respuesta
    sessionService.updateSessionStatus(sessionId, 'completed', responseValue);
    console.log(`[TELEGRAM CALLBACK] Sesión ${sessionId} → ${responseValue}`);

    // Editar mensaje para eliminar botones
    await this.removeButtons(chatId, messageId, responseValue);
  }

  async answerCallback(callbackId) {
    try {
      await axios.post(`${this.apiUrl}/answerCallbackQuery`, {
        callback_query_id: callbackId,
      });
    } catch (error) {
      console.error('[ANSWER CALLBACK ERROR]', error.message);
    }
  }

  async removeButtons(chatId, messageId, response) {
    try {
      await axios.post(`${this.apiUrl}/editMessageReplyMarkup`, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: [] },
      });
      console.log(`[TELEGRAM] Botones eliminados del mensaje ${messageId}`);
    } catch (error) {
      console.error('[REMOVE BUTTONS ERROR]', error.message);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.isRunning = false;
  }
}

module.exports = new TelegramPolling();
