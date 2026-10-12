import { onUnmounted, ref, shallowRef } from 'vue'
import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/firebase'

// Lee la ficha de una persona del equipo. Devuelve { id, name, email } o null si no existe
export async function getMember(companyId, uid) {
  const snapshot = await getDoc(doc(db, 'companies', companyId, 'members', uid))
  if (!snapshot.exists()) return null

  const { name, email } = snapshot.data()
  return { id: snapshot.id, name, email }
}

// Lista de personas del equipo de una empresa, por orden alfabético.
// Solo puede leerla el responsable (lo garantizan las reglas de Firestore).
// Debe llamarse dentro del setup de un componente.
export function useTeam(companyId) {
  // Personas del equipo: [{ id, name, email }], donde id es el uid de cada una
  const members = shallowRef([])

  // true hasta que Firestore responde por primera vez
  const isLoading = ref(true)

  // Se pone a true si falla la conexión con Firestore, para que la vista pueda avisar
  const hasError = ref(false)

  // onSnapshot mantiene la lista al día: cuando alguien acepta la invitación, aparece solo
  const stopListening = onSnapshot(
    query(collection(db, 'companies', companyId, 'members'), orderBy('name')),
    (snapshot) => {
      members.value = snapshot.docs.map((memberDoc) => {
        const { name, email } = memberDoc.data()
        return { id: memberDoc.id, name, email }
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

  return { members, isLoading, hasError }
}
