import { computed, onUnmounted, ref, shallowRef, watch } from 'vue'
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
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { serverNow } from '@/utils/serverClock'

// Gestiona la jornada en curso del empleado y sus pausas.
//
// Modelo de datos en Firestore:
//   users/{uid}/shifts/{id}   Una jornada.
//     - startedAt: hora de entrada
//     - endedAt:   hora de salida, o null mientras la jornada sigue abierta
//   users/{uid}/breaks/{id}   Una pausa dentro de una jornada.
//     - shiftId:   id de la jornada a la que pertenece
//     - startedAt: hora en que empieza la pausa
//     - endedAt:   hora en que se reanuda el trabajo, o null mientras dura la pausa
//
// "Estar trabajando" es tener una jornada con endedAt a null; "estar en pausa" es tener,
// además, una pausa con endedAt a null. Todas las horas las pone el servidor.
//
// Recibe el uid del empleado y debe llamarse dentro del setup de un componente. Normalmente es el
// usuario con sesión iniciada; el responsable de una empresa lo usa también, solo para leer,
// con el uid de cada persona de su equipo.
export function useShift(uid) {
  const shiftsRef = collection(db, 'users', uid, 'shifts')
  const breaksRef = collection(db, 'users', uid, 'breaks')

  // Jornada abierta ({ id, startedAt, endedAt: null }) o null si el empleado está fuera de jornada
  const activeShift = shallowRef(null)

  // Pausas de la jornada abierta: [{ id, shiftId, startedAt, endedAt }]
  const breaks = shallowRef([])

  // La pausa que sigue abierta, o null si no se está en pausa
  const openBreak = computed(() => breaks.value.find((pause) => pause.endedAt === null) ?? null)

  // true hasta que Firestore responde por primera vez; evita enseñar "fuera de jornada" por error
  const isLoading = ref(true)

  // Se pone a true si falla la conexión con Firestore, para que la vista pueda avisar
  const hasError = ref(false)

  // Una hora recién escrita aún no ha vuelto del servidor y llega vacía:
  // mientras tanto se usa la hora actual para que los contadores arranquen ya
  function toDate(timestamp) {
    return timestamp?.toDate() ?? serverNow()
  }

  function handleError() {
    isLoading.value = false
    hasError.value = true
  }

  // Consulta de la jornada abierta. onSnapshot la mantiene viva: Firestore vuelve a llamar
  // a la función cada vez que cambia el dato, también si se ficha desde otro dispositivo
  const openShiftQuery = query(shiftsRef, where('endedAt', '==', null), limit(1))

  const stopListeningShift = onSnapshot(
    openShiftQuery,
    (snapshot) => {
      const openShift = snapshot.docs[0]
      activeShift.value = openShift
        ? { id: openShift.id, startedAt: toDate(openShift.data().startedAt), endedAt: null }
        : null
      isLoading.value = false
      hasError.value = false
    },
    handleError,
  )

  // Las pausas se escuchan solo para la jornada abierta. Cuando esa jornada cambia
  // (se ficha entrada o salida) hay que dejar de escuchar las anteriores y empezar con las nuevas
  let stopListeningBreaks = () => {}

  watch(
    () => activeShift.value?.id,
    (shiftId) => {
      stopListeningBreaks()
      breaks.value = []
      if (!shiftId) return

      stopListeningBreaks = onSnapshot(
        query(breaksRef, where('shiftId', '==', shiftId)),
        (snapshot) => {
          breaks.value = snapshot.docs.map((breakDoc) => {
            const data = breakDoc.data()
            return {
              id: breakDoc.id,
              shiftId: data.shiftId,
              startedAt: toDate(data.startedAt),
              endedAt: data.endedAt?.toDate() ?? null,
            }
          })
        },
        handleError,
      )
    },
  )

  // Al salir de la pantalla se cortan las escuchas; si no, seguirían consumiendo lecturas y memoria
  onUnmounted(() => {
    stopListeningShift()
    stopListeningBreaks()
  })

  // Ficha la entrada: crea una jornada abierta.
  // serverTimestamp() hace que la hora la ponga el servidor y no el reloj del dispositivo,
  // que el usuario podría cambiar
  function clockIn() {
    return addDoc(shiftsRef, { startedAt: serverTimestamp(), endedAt: null })
  }

  // Ficha la salida: cierra la jornada abierta. Si se estaba en pausa, la cierra también.
  // Las dos escrituras van en un lote para que se guarden las dos o ninguna
  function clockOut() {
    const batch = writeBatch(db)
    batch.update(doc(shiftsRef, activeShift.value.id), { endedAt: serverTimestamp() })
    if (openBreak.value) {
      batch.update(doc(breaksRef, openBreak.value.id), { endedAt: serverTimestamp() })
    }
    return batch.commit()
  }

  // Empieza una pausa dentro de la jornada abierta
  function startBreak() {
    return addDoc(breaksRef, { shiftId: activeShift.value.id, startedAt: serverTimestamp(), endedAt: null })
  }

  // Termina la pausa en curso y se vuelve al trabajo
  function endBreak() {
    return updateDoc(doc(breaksRef, openBreak.value.id), { endedAt: serverTimestamp() })
  }

  return { activeShift, breaks, openBreak, isLoading, hasError, clockIn, clockOut, startBreak, endBreak }
}
