import { onUnmounted, ref, shallowRef } from 'vue'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuth } from '@/composables/useAuth'

// Modo quiosco: un dispositivo compartido (una tableta en la entrada) donde cada persona
// del equipo ficha tecleando un código de 4 cifras, sin correo ni contraseña.
//
// Modelo de datos en Firestore:
//   companies/{id}/pins/{código}        A quién pertenece cada código.
//     - uid, name
//   companies/{id}/kiosks/{uid}         Un dispositivo activado como quiosco (uid anónimo).
//     - ticket, createdAt
//   companies/{id}/kioskTickets/{id}    Pase de un solo uso para activar un dispositivo.
//     - createdAt
//
// El quiosco no entra con la cuenta de nadie: usa una sesión anónima a la que las reglas de
// Firestore solo dejan comprobar un código, ver la jornada abierta de esa persona y fichar por ella.
// El código identifica a la persona, pero no es una contraseña: solo sirve en un dispositivo
// que el responsable haya activado.

// Clave con la que el dispositivo recuerda de qué empresa es quiosco
const STORAGE_KEY = 'fixeck-kiosk'

// Intentos de buscar un código libre antes de rendirse. Con 10.000 códigos posibles,
// chocar tantas veces seguidas es prácticamente imposible en un equipo normal
const MAX_PIN_ATTEMPTS = 8

// Id de la empresa de la que este dispositivo es quiosco, o null si no lo es
export function getKioskCompanyId() {
  return localStorage.getItem(STORAGE_KEY)
}

// Código aleatorio de 4 cifras, con ceros a la izquierda si hace falta ("0042")
function randomPin() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0')
}

// ---------- Lo que hace el responsable ----------

// Convierte este dispositivo en quiosco de la empresa. Lo lanza el responsable con su sesión
// iniciada, y al terminar su sesión queda cerrada: el dispositivo pasa a ser anónimo.
//   1. Con la sesión del responsable se crea un pase de un solo uso.
//   2. Se cierra su sesión y se abre una anónima.
//   3. Con la sesión anónima se da de alta el quiosco gastando el pase.
// Hace falta el pase porque nadie puede tener dos sesiones a la vez: es la forma de que
// el dispositivo anónimo demuestre que el responsable lo ha autorizado
export async function activateKiosk(companyId) {
  const { loginAsKiosk, logout } = useAuth()

  const ticketRef = doc(collection(db, 'companies', companyId, 'kioskTickets'))
  await setDoc(ticketRef, { createdAt: serverTimestamp() })

  await logout()
  const { user: kioskUser } = await loginAsKiosk()

  // El alta y el borrado del pase van en un lote: se guardan los dos o ninguno
  const batch = writeBatch(db)
  batch.set(doc(db, 'companies', companyId, 'kiosks', kioskUser.uid), {
    ticket: ticketRef.id,
    createdAt: serverTimestamp(),
  })
  batch.delete(ticketRef)
  await batch.commit()

  localStorage.setItem(STORAGE_KEY, companyId)
}

// Desactiva un quiosco desde la cuenta del responsable: ese dispositivo deja de poder fichar
export function deactivateKiosk(companyId, kioskId) {
  return deleteDoc(doc(db, 'companies', companyId, 'kiosks', kioskId))
}

// Lista de los quioscos activos de una empresa, para el responsable.
// Debe llamarse dentro del setup de un componente.
export function useKiosks(companyId) {
  // Quioscos: [{ id, createdAt }], donde id es el uid anónimo del dispositivo
  const kiosks = shallowRef([])

  const stopListening = onSnapshot(
    collection(db, 'companies', companyId, 'kiosks'),
    (snapshot) => {
      kiosks.value = snapshot.docs
        .map((kioskDoc) => ({ id: kioskDoc.id, createdAt: kioskDoc.data().createdAt?.toDate() ?? new Date() }))
        .sort((a, b) => a.createdAt - b.createdAt)
    },
    // Si falla la lectura la lista se queda vacía; no impide usar el resto de la pantalla
    () => {},
  )

  onUnmounted(stopListening)

  return { kiosks }
}

// Asigna a una persona del equipo un código de quiosco nuevo y retira el que tuviera.
// Recibe la persona ({ id, name }) y su código actual ('' si no tiene). Devuelve el nuevo.
// Si el código elegido al azar ya es de otra persona, Firestore rechaza la escritura
// (las reglas no dejan pisar un código) y se prueba con otro
export async function assignPin(companyId, member, currentPin = '') {
  for (let attempt = 0; attempt < MAX_PIN_ATTEMPTS; attempt++) {
    const pin = randomPin()
    if (pin === currentPin) continue

    const batch = writeBatch(db)
    batch.set(doc(db, 'companies', companyId, 'pins', pin), { uid: member.id, name: member.name })
    if (currentPin) batch.delete(doc(db, 'companies', companyId, 'pins', currentPin))

    try {
      await batch.commit()
      return pin
    } catch (error) {
      // "permission-denied" aquí significa que el código estaba ocupado; cualquier otro error es real
      if (error.code !== 'permission-denied') throw error
    }
  }

  throw new Error('No se ha encontrado un código libre')
}

// Código de quiosco de una persona, en tiempo real. Lo usan el empleado (para ver el suyo)
// y el responsable (para ver y cambiar el de cada persona).
// Debe llamarse dentro del setup de un componente.
export function useMemberPin(companyId, uid) {
  // El código ('' si la persona todavía no tiene)
  const pin = ref('')

  // true hasta que Firestore responde por primera vez
  const isLoading = ref(true)

  const stopListening = onSnapshot(
    query(collection(db, 'companies', companyId, 'pins'), where('uid', '==', uid), limit(1)),
    (snapshot) => {
      // El código es el id del documento
      pin.value = snapshot.docs[0]?.id ?? ''
      isLoading.value = false
    },
    () => {
      isLoading.value = false
    },
  )

  onUnmounted(stopListening)

  return { pin, isLoading }
}

// ---------- Lo que hace el dispositivo en modo quiosco ----------

// Comprueba que este dispositivo sigue siendo un quiosco activo de la empresa
// (el responsable puede haberlo desactivado desde su cuenta)
export async function isKioskActive(companyId, kioskId) {
  const snapshot = await getDoc(doc(db, 'companies', companyId, 'kiosks', kioskId))
  return snapshot.exists()
}

// Busca a quién pertenece un código. Devuelve { uid, name }, o null si el código no es de nadie
export async function findEmployeeByPin(companyId, pin) {
  const snapshot = await getDoc(doc(db, 'companies', companyId, 'pins', pin))
  return snapshot.exists() ? snapshot.data() : null
}

// Saca al dispositivo del modo quiosco: borra su alta, olvida la empresa y cierra la sesión anónima
export async function exitKiosk(companyId, kioskId) {
  const { logout } = useAuth()

  // Si el responsable ya lo había desactivado, el alta no existe y no hay nada que borrar
  if (companyId) await deleteDoc(doc(db, 'companies', companyId, 'kiosks', kioskId)).catch(() => {})
  localStorage.removeItem(STORAGE_KEY)
  await logout()
}
