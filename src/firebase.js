import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

// Las credenciales se leen del archivo .env (ver .env.example) para no dejarlas
// escritas en el código. Vite solo expone al navegador las variables que empiezan por VITE_
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Conexión con el proyecto de Firebase; se crea una sola vez para toda la app
const app = initializeApp(firebaseConfig)

// Servicios que usa Fixeck: auth para el inicio de sesión y db para guardar los fichajes
export const auth = getAuth(app)
export const db = getFirestore(app)

// Para hacer pruebas sin tocar los usuarios ni los datos reales se pueden usar los emuladores
// locales de Firebase (npm run emulador) arrancando la app con VITE_USE_EMULATORS=true
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
