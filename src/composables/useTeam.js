import { onUnmounted, ref, shallowRef } from 'vue'
import { collection, doc, getDoc, onSnapshot, orderBy, query, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '@/firebase'
import { createInviteCode } from '@/composables/useCompany'

// Lee la ficha de una persona del equipo. Devuelve { id, name, email } o null si no existe
export async function getMember(companyId, uid) {
  const snapshot = await getDoc(doc(db, 'companies', companyId, 'members', uid))
  if (!snapshot.exists()) return null

  const { name, email } = snapshot.data()
  return { id: snapshot.id, name, email }
}

// Da de baja a una persona del equipo. Borra su ficha y el documento que la vincula con la empresa,
// los dos a la vez. Sus fichajes no se borran: siguen siendo suyos, pero el responsable deja de verlos.
// Si tenía código de quiosco ("pin"), se retira en la misma escritura para que quede libre.
// Solo puede hacerlo el responsable, y nunca sobre sí mismo (lo garantizan las reglas de Firestore)
export function removeMember(companyId, uid, pin = '') {
  const batch = writeBatch(db)
  batch.delete(doc(db, 'companies', companyId, 'members', uid))
  batch.delete(doc(db, 'users', uid))
  if (pin) batch.delete(doc(db, 'companies', companyId, 'pins', pin))
  return batch.commit()
}

// Código de invitación de una empresa: el que va en el enlace que el responsable envía a su equipo.
// Se guarda en companies/{id}/private/invite, que solo el responsable puede leer.
// Renovarlo deja sin efecto los enlaces enviados hasta ese momento.
export function useInvite(companyId) {
  const inviteRef = doc(db, 'companies', companyId, 'private', 'invite')

  // Código vigente; vacío hasta que se carga
  const inviteCode = ref('')

  // Guarda un código nuevo, que sustituye al anterior
  async function renewInvite() {
    const code = createInviteCode()
    await setDoc(inviteRef, { code })
    inviteCode.value = code
  }

  // Lee el código vigente. Las empresas creadas antes de que existieran los códigos
  // no tienen ninguno, así que en ese caso se crea el primero
  async function loadInvite() {
    try {
      const snapshot = await getDoc(inviteRef)
      if (snapshot.exists()) inviteCode.value = snapshot.data().code
      else await renewInvite()
    } catch {
      // Sin código no hay enlace que enseñar; la vista lo indica mientras siga vacío
    }
  }

  loadInvite()

  return { inviteCode, renewInvite }
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
