import { ref } from 'vue'
import { doc, getDocFromServer, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'

// Reloj del servidor.
//
// Las horas de los fichajes las pone el servidor de Firebase, pero el contador se calcula
// en el navegador. Si el reloj del dispositivo va atrasado o adelantado, restar una hora
// de cada reloj da un resultado falso (por ejemplo, un contador clavado en cero).
// Para evitarlo se mide una vez la diferencia entre los dos relojes y se corrige con ella.

// Milisegundos que hay que sumar a la hora del dispositivo para obtener la del servidor.
// Vale 0 hasta que se mide; es reactiva para que la interfaz se actualice al conocerla
const offsetMs = ref(0)

// Devuelve la hora actual según el servidor
export function serverNow() {
  return new Date(Date.now() + offsetMs.value)
}

// Mide la diferencia entre el reloj del dispositivo y el del servidor.
// Firestore no tiene una función para preguntar la hora, así que se guarda un documento
// con la hora del servidor (users/{uid}/private/clock) y se vuelve a leer.
// Si falla no pasa nada grave: se sigue usando la hora del dispositivo
export async function syncServerClock(uid) {
  const clockRef = doc(db, 'users', uid, 'private', 'clock')
  try {
    const sentAt = Date.now()
    await setDoc(clockRef, { syncedAt: serverTimestamp() })
    const receivedAt = Date.now()
    const snapshot = await getDocFromServer(clockRef)

    // El servidor puso la hora más o menos a mitad del viaje de ida y vuelta de la petición
    const deviceTime = (sentAt + receivedAt) / 2
    offsetMs.value = snapshot.data().syncedAt.toMillis() - deviceTime
  } catch {
    offsetMs.value = 0
  }
}
