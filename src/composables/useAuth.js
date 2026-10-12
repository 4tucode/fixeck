import { shallowRef } from 'vue'
import {
  GoogleAuthProvider,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  verifyPasswordResetCode,
} from 'firebase/auth'
import { auth } from '@/firebase'

// Usuario con sesión iniciada (null si no hay). Está fuera de la función para que
// todos los componentes compartan el mismo estado, igual que en useTheme.js
const user = shallowRef(null)

// Promesa que se resuelve cuando Firebase termina de comprobar si había una sesión guardada.
// El router la espera antes de decidir si deja entrar a una ruta privada
export const authReady = new Promise((resolve) => {
  // Firebase llama a esta función al arrancar y cada vez que alguien entra o sale
  onAuthStateChanged(auth, (firebaseUser) => {
    user.value = firebaseUser
    resolve()
  })
})

export function useAuth() {
  // Entra con una cuenta que ya existe
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  // Crea una cuenta nueva; Firebase deja la sesión iniciada al terminar
  function register(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
  }

  // Abre la ventana de Google; si el usuario no tenía cuenta en Fixeck, se crea sola
  function loginWithGoogle() {
    return signInWithPopup(auth, new GoogleAuthProvider())
  }

  // Envía un correo con un enlace para elegir una contraseña nueva
  function sendResetEmail(email) {
    return sendPasswordResetEmail(auth, email)
  }

  // Comprueba que el código del enlace del correo sigue siendo válido.
  // Devuelve el correo de la cuenta a la que pertenece
  function checkResetCode(code) {
    return verifyPasswordResetCode(auth, code)
  }

  // Guarda la contraseña nueva usando el código del enlace del correo
  function saveNewPassword(code, newPassword) {
    return confirmPasswordReset(auth, code, newPassword)
  }

  function logout() {
    return signOut(auth)
  }

  return { user, login, register, loginWithGoogle, sendResetEmail, checkResetCode, saveNewPassword, logout }
}
