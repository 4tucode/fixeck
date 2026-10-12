import { onUnmounted, ref, shallowRef } from 'vue'
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { serverNow } from '@/utils/serverClock'

// Gestiona la jornada en curso del empleado.
//
// Modelo de datos en Firestore: users/{uid}/shifts/{id}
//   - startedAt: hora de entrada
//   - endedAt:   hora de salida, o null mientras la jornada sigue abierta
// Cada documento es una jornada. "Estar trabajando" significa tener una con endedAt a null.
//
// Recibe el uid del usuario con sesión iniciada y debe llamarse dentro del setup de un componente.
export function useShift(uid) {
  const shiftsRef = collection(db, 'users', uid, 'shifts')

  // Jornada abierta ({ id, startedAt }) o null si el empleado está fuera de jornada
  const activeShift = shallowRef(null)

  // true hasta que Firestore responde por primera vez; evita enseñar "fuera de jornada" por error
  const isLoading = ref(true)

  // Se pone a true si falla la conexión con Firestore, para que la vista pueda avisar
  const hasError = ref(false)

  // Consulta de la jornada abierta. onSnapshot la mantiene viva: Firestore vuelve a llamar
  // a la función cada vez que cambia el dato, también si se ficha desde otro dispositivo
  const openShiftQuery = query(shiftsRef, where('endedAt', '==', null), limit(1))

  const stopListening = onSnapshot(
    openShiftQuery,
    (snapshot) => {
      const openShift = snapshot.docs[0]
      if (openShift) {
        // La hora de entrada la pone el servidor y tarda un instante en llegar (hasta entonces
        // viene vacía). Mientras tanto se usa la hora actual para que el contador arranque ya
        const startedAt = openShift.data().startedAt?.toDate() ?? serverNow()
        activeShift.value = { id: openShift.id, startedAt }
      } else {
        activeShift.value = null
      }
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

  // Ficha la entrada: crea una jornada abierta.
  // serverTimestamp() hace que la hora la ponga el servidor y no el reloj del dispositivo,
  // que el usuario podría cambiar
  function clockIn() {
    return addDoc(shiftsRef, { startedAt: serverTimestamp(), endedAt: null })
  }

  // Ficha la salida: cierra la jornada abierta poniéndole hora de fin
  function clockOut() {
    return updateDoc(doc(shiftsRef, activeShift.value.id), { endedAt: serverTimestamp() })
  }

  return { activeShift, isLoading, hasError, clockIn, clockOut }
}
