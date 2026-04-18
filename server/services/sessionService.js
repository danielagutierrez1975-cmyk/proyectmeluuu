const { v4: uuidv4 } = require('uuid');
const config = require('../config');

class SessionService {
  createSession(data) {
    const sessionId = uuidv4();
    const session = {
      sessionId,
      ...data,
      createdAt: Date.now(),
      status: 'waiting', // waiting, completed, error
      response: null,
    };

    global.sessions[sessionId] = session;

    console.log(`[SESSION] Creada: ${sessionId}`);
    return sessionId;
  }

  getSession(sessionId) {
    return global.sessions[sessionId] || null;
  }

  updateSessionStatus(sessionId, status, response = null) {
    if (global.sessions[sessionId]) {
      global.sessions[sessionId].status = status;
      global.sessions[sessionId].response = response;
      global.sessions[sessionId].updatedAt = Date.now();

      console.log(`[SESSION] Actualizada ${sessionId}: ${status} - ${response}`);
    }
  }

  deleteSession(sessionId) {
    if (global.sessions[sessionId]) {
      delete global.sessions[sessionId];
      console.log(`[SESSION] Eliminada: ${sessionId}`);
    }
  }

  isExpired(sessionId) {
    const session = global.sessions[sessionId];
    if (!session) return true;

    return (Date.now() - session.createdAt) > config.session.ttl;
  }
}

module.exports = new SessionService();
