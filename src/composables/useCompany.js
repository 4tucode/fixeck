import { computed, ref, shallowRef } from 'vue'
import { collection, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { auth, db } from '@/firebase'

// Gestiona la empresa a la que pertenece el usuario.
//
// Modelo de datos en Firestore:
//   users/{uid}                        A qué empresa pertenece el usuario.
//     - companyId: id de su empresa
//   companies/{id}                     Una empresa.
//     - name:      nombre de la empresa
//     - ownerId:   uid del responsable (quien la creó)
//     - createdAt: cuándo se creó
//   companies/{id}/members/{uid}       Una persona del equipo (el responsable también lo es).
//     - name, email, joinedAt
//     - inviteCode: código de invitación con el que se unió
//   companies/{id}/private/invite      Código de invitación vigente (ver useTeam.js).
//     - code
//
// Quien crea la empresa es su responsable y puede ver los fichajes del equipo; los demás
// se unen con un enlace de invitación. Una persona pertenece como mucho a una empresa.

// Genera un código de invitación nuevo: largo y aleatorio, imposible de adivinar
export function createInviteCode() {
  return crypto.randomUUID()
}

// Lee una empresa por su id. Devuelve { id, name, ownerId } o null si no existe
export async function getCompany(companyId) {
  const snapshot = await getDoc(doc(db, 'companies', companyId))
  if (!snapshot.exists()) return null

  const { name, ownerId } = snapshot.data()
  return { id: snapshot.id, name, ownerId }
}

// Recibe el uid del usuario con sesión iniciada
export function useCompany(uid) {
  // Empresa del usuario ({ id, name, ownerId }) o null si no pertenece a ninguna
  const company = shallowRef(null)

  // true hasta saber si el usuario tiene empresa; evita ofrecerle crear una por error
  const isLoading = ref(true)

  // Se pone a true si falla la conexión con Firestore, para que la vista pueda avisar
  const hasError = ref(false)

  // El responsable es quien creó la empresa
  const isManager = computed(() => company.value?.ownerId === uid)

  // Busca la empresa del usuario: primero su documento, que dice cuál es, y después la empresa
  async function loadCompany() {
    try {
      const profile = await getDoc(doc(db, 'users', uid))
      if (profile.exists()) company.value = await getCompany(profile.data().companyId)
    } catch {
      hasError.value = true
    } finally {
      isLoading.value = false
    }
  }

  loadCompany()

  // Añade al lote las dos escrituras que vinculan al usuario con una empresa: su ficha en
  // el equipo y su documento de usuario. Las reglas exigen que se guarden a la vez
  // y que el código de invitación sea el vigente
  function addMembership(batch, companyId, memberName, inviteCode) {
    batch.set(doc(db, 'companies', companyId, 'members', uid), {
      name: memberName,
      email: auth.currentUser.email,
      joinedAt: serverTimestamp(),
      inviteCode,
    })
    batch.set(doc(db, 'users', uid), { companyId })
  }

  // Crea una empresa y deja al usuario como su responsable y primer miembro del equipo.
  // Todo va en un lote para que se guarde entero o no se guarde nada
  async function createCompany(companyName, memberName) {
    // doc() sin id genera uno nuevo sin escribir todavía; hace falta para enlazar los documentos
    const companyRef = doc(collection(db, 'companies'))

    // La empresa nace ya con su primer código de invitación
    const inviteCode = createInviteCode()

    const batch = writeBatch(db)
    batch.set(companyRef, { name: companyName, ownerId: uid, createdAt: serverTimestamp() })
    batch.set(doc(companyRef, 'private', 'invite'), { code: inviteCode })
    addMembership(batch, companyRef.id, memberName, inviteCode)
    await batch.commit()

    company.value = { id: companyRef.id, name: companyName, ownerId: uid }
  }

  // Une al usuario al equipo de una empresa que ya existe, con el código que venía en el enlace
  // de invitación. Si el responsable ha renovado el enlace, el código ya no vale y Firestore lo rechaza
  async function joinCompany(companyId, inviteCode, memberName) {
    const batch = writeBatch(db)
    addMembership(batch, companyId, memberName, inviteCode)
    await batch.commit()

    company.value = await getCompany(companyId)
  }

  return { company, isManager, isLoading, hasError, createCompany, joinCompany }
}
