function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validatePassword(password) {
  // Mínimo 4 caracteres para simplicidad
  return password && password.length >= 4;
}

function validateOtpCode(code) {
  // Debe ser exactamente 4 dígitos
  return /^\d{4}$/.test(code);
}

module.exports = {
  validateEmail,
  validatePassword,
  validateOtpCode,
};
