// Mensajes en español para los códigos de error que devuelve Firebase Authentication
const ERROR_MESSAGES = {
  'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
  // Firebase solo devuelve estos dos si el proyecto tiene desactivada la protección que oculta
  // qué correos están registrados (y en el emulador). Se usa el mismo texto para no dar pistas
  'auth/user-not-found': 'El correo o la contraseña no son correctos.',
  'auth/wrong-password': 'El correo o la contraseña no son correctos.',
  'auth/invalid-email': 'Ese correo no tiene un formato válido.',
  'auth/missing-password': 'Escribe tu contraseña.',
  'auth/user-disabled': 'Esta cuenta está desactivada. Habla con tu responsable.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Prueba a entrar.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos y vuelve a probar.',
  'auth/network-request-failed': 'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
  'auth/popup-blocked': 'El navegador ha bloqueado la ventana de Google. Permite las ventanas emergentes.',
  'auth/expired-action-code': 'El enlace ha caducado. Pide uno nuevo.',
  'auth/invalid-action-code': 'El enlace no es válido o ya se ha usado. Pide uno nuevo.',
}

// Cerrar la ventana de Google es una decisión del usuario, no un fallo: no se muestra nada
const SILENT_ERRORS = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request']

// Convierte un error de Firebase en un texto que el usuario pueda entender.
// Devuelve una cadena vacía cuando no hay nada que avisar
export function getAuthErrorMessage(error) {
  if (SILENT_ERRORS.includes(error.code)) return ''
  return ERROR_MESSAGES[error.code] ?? 'No hemos podido completar la acción. Inténtalo de nuevo.'
}
