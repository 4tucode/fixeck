import { onUnmounted, ref, shallowRef } from 'vue'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/firebase'
import { serverNow } from '@/utils/serverClock'

// Número máximo de jornadas que se cargan. Limitarlo evita leer (y pagar) todo el
// historial de golpe; para un MVP las más recientes son suficientes
const MAX_SHIFTS = 60

// Lee las últimas jornadas del empleado, de la más reciente a la más antigua.
// Recibe el uid del usuario con sesión iniciada y debe llamarse dentro del setup de un componente.
export function useShiftHistory(uid) {
  // Lista de jornadas: { id, startedAt, endedAt }, con endedAt a null si sigue abierta
  const shifts = shallowRef([])

  // true hasta que Firestore responde por primera vez
  const isLoading = ref(true)

  // Se pone a true si falla la conexión con Firestore, para que la vista pueda avisar
  const hasError = ref(false)

  const historyQuery = query(
    collection(db, 'users', uid, 'shifts'),
    orderBy('startedAt', 'desc'),
    limit(MAX_SHIFTS),
  )

  // onSnapshot mantiene la lista al día: si se ficha en otra pestaña, aparece sola
  const stopListening = onSnapshot(
    historyQuery,
    (snapshot) => {
      shifts.value = snapshot.docs.map((shiftDoc) => {
        const data = shiftDoc.data()
        return {
          id: shiftDoc.id,
          // Una jornada recién creada aún no tiene la hora del servidor: se usa la actual
          startedAt: data.startedAt?.toDate() ?? serverNow(),
          endedAt: data.endedAt?.toDate() ?? null,
        }
      })
      isLoading.value = false
      hasError.value = false
    },
    () => {
      isLoading.value = false
      hasError.value = true
    },
  )

  // Al salir de la pantalla se corta la escucha; si no, seguiría consumiendo lecturas y memoria
  onUnmounted(stopListening)

  return { shifts, isLoading, hasError }
}
