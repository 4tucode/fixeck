import { onUnmounted, ref, shallowRef } from 'vue'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/firebase'
import { serverNow } from '@/utils/serverClock'

// Número máximo de jornadas y de pausas que se cargan. Limitarlo evita leer (y pagar) todo
// el historial de golpe; para un MVP las más recientes son suficientes.
// Se piden más pausas que jornadas porque una jornada puede tener varias
const MAX_SHIFTS = 60
const MAX_BREAKS = 300

// Lee las últimas jornadas del empleado y sus pausas, de lo más reciente a lo más antiguo.
// Recibe el uid del usuario con sesión iniciada y debe llamarse dentro del setup de un componente.
export function useShiftHistory(uid) {
  // Jornadas: { id, startedAt, endedAt }, con endedAt a null si sigue abierta
  const shifts = shallowRef([])

  // Pausas: { id, shiftId, startedAt, endedAt }; shiftId indica a qué jornada pertenecen
  const breaks = shallowRef([])

  // true hasta que Firestore responde por primera vez con las jornadas
  const isLoading = ref(true)

  // Se pone a true si falla la conexión con Firestore, para que la vista pueda avisar
  const hasError = ref(false)

  // Crea la consulta de una colección del usuario, ordenada de más reciente a más antigua
  function recentQuery(collectionName, max) {
    return query(collection(db, 'users', uid, collectionName), orderBy('startedAt', 'desc'), limit(max))
  }

  // Convierte un documento de Firestore en un objeto con fechas normales de JavaScript.
  // Una hora recién escrita aún no ha vuelto del servidor: mientras tanto se usa la actual
  function toItem(snapshotDoc) {
    const data = snapshotDoc.data()
    return {
      ...data,
      id: snapshotDoc.id,
      startedAt: data.startedAt?.toDate() ?? serverNow(),
      endedAt: data.endedAt?.toDate() ?? null,
    }
  }

  function handleError() {
    isLoading.value = false
    hasError.value = true
  }

  // onSnapshot mantiene las listas al día: si se ficha en otra pestaña, aparece solo
  const stopListeningShifts = onSnapshot(
    recentQuery('shifts', MAX_SHIFTS),
    (snapshot) => {
      shifts.value = snapshot.docs.map(toItem)
      isLoading.value = false
      hasError.value = false
    },
    handleError,
  )

  const stopListeningBreaks = onSnapshot(
    recentQuery('breaks', MAX_BREAKS),
    (snapshot) => {
      breaks.value = snapshot.docs.map(toItem)
    },
    handleError,
  )

  // Al salir de la pantalla se cortan las escuchas; si no, seguirían consumiendo lecturas y memoria
  onUnmounted(() => {
    stopListeningShifts()
    stopListeningBreaks()
  })

  return { shifts, breaks, isLoading, hasError }
}
