<script setup>
import { ref, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import FixeckLogo from '@/components/FixeckLogo.vue'
import KioskSession from '@/components/KioskSession.vue'
import LiveClock from '@/components/LiveClock.vue'
import PinPad from '@/components/PinPad.vue'
import { useAuth } from '@/composables/useAuth'
import { getCompany } from '@/composables/useCompany'
import { exitKiosk, findEmployeeByPin, getKioskCompanyId, isKioskActive } from '@/composables/useKiosk'
import { useServerNow } from '@/composables/useServerNow'
import { notifyError } from '@/utils/notify'
import { syncServerClock } from '@/utils/serverClock'

// Pantalla del modo quiosco: un dispositivo compartido donde el equipo ficha con su código.
// Tiene dos momentos: el teclado, a la espera de un código, y la sesión de la persona
// identificada (KioskSession), que dura lo justo para fichar.
const router = useRouter()
const { user } = useAuth()

// Identidad anónima de este dispositivo y empresa de la que es quiosco
const kioskId = user.value.uid
const companyId = getKioskCompanyId()

// Se ajusta la hora con la del servidor para que el reloj y los tiempos sean correctos
syncServerClock(kioskId)
const { now } = useServerNow()

// Empresa del quiosco ({ id, name, ownerId }); null hasta que se carga
const company = shallowRef(null)

// true hasta saber si el dispositivo sigue siendo un quiosco activo
const isLoading = ref(true)

// true si el responsable ha desactivado este quiosco (o el dispositivo ha perdido sus datos)
const isRevoked = ref(false)

// Comprueba que el quiosco sigue activo y carga el nombre de la empresa para enseñarlo
async function loadKiosk() {
  try {
    if (!companyId || !(await isKioskActive(companyId, kioskId))) {
      isRevoked.value = true
      return
    }
    company.value = await getCompany(companyId)
  } catch {
    isRevoked.value = true
  } finally {
    isLoading.value = false
  }
}

loadKiosk()

// Persona identificada por su código ({ uid, name }); null mientras se enseña el teclado
const employee = shallowRef(null)

// true mientras se comprueba un código
const isChecking = ref(false)

// Códigos incorrectos seguidos y bloqueo temporal del teclado. Es un freno a quien pruebe
// códigos al azar; no sustituye a un límite en el servidor, que este MVP no tiene
const MAX_FAILED_ATTEMPTS = 5
const LOCK_SECONDS = 30
const failedAttempts = ref(0)
const isLocked = ref(false)

// Comprueba el código tecleado: si es de alguien, abre su sesión; si no, avisa
async function handlePin(pin) {
  isChecking.value = true
  try {
    const found = await findEmployeeByPin(companyId, pin)
    if (found) {
      failedAttempts.value = 0
      employee.value = found
      return
    }

    failedAttempts.value++
    if (failedAttempts.value >= MAX_FAILED_ATTEMPTS) {
      lockPad()
      notifyError(`Demasiados códigos incorrectos. Espera ${LOCK_SECONDS} segundos.`)
    } else {
      notifyError('Ese código no es de nadie del equipo. Prueba otra vez.')
    }
  } catch {
    notifyError('No hemos podido comprobar el código. Revisa la conexión.')
  } finally {
    isChecking.value = false
  }
}

// Bloquea el teclado un rato y lo vuelve a activar solo
function lockPad() {
  isLocked.value = true
  setTimeout(() => {
    isLocked.value = false
    failedAttempts.value = 0
  }, LOCK_SECONDS * 1000)
}

// true mientras se pregunta si de verdad se quiere sacar el dispositivo del modo quiosco
const isConfirmingExit = ref(false)

// Saca al dispositivo del modo quiosco y vuelve al login
async function handleExit() {
  isConfirmingExit.value = false
  await exitKiosk(companyId, kioskId)
  router.push({ name: 'login' })
}
</script>

<template>
  <main class="flex min-h-screen flex-col items-center px-5 pt-5 pb-6">
    <!-- Cabecera: la marca y la empresa de la que es este quiosco -->
    <header class="flex h-11 items-center gap-2 self-start">
      <FixeckLogo class="h-10 w-auto" />
      <span class="font-display text-2xl leading-none font-semibold tracking-tight">fixeck</span>
      <span v-if="company" class="ml-2 text-sm font-bold text-noche/60 dark:text-white/60">· {{ company.name }}</span>
    </header>

    <div class="flex w-full flex-1 flex-col items-center justify-center py-8">
      <p v-if="isLoading" class="text-noche/70 dark:text-white/70">Preparando el quiosco…</p>

      <!-- El responsable lo ha desactivado: solo queda salir -->
      <div v-else-if="isRevoked" class="max-w-sm text-center">
        <h1 class="font-display text-3xl font-semibold">Este quiosco está desactivado</h1>
        <p class="mt-2 text-noche/70 dark:text-white/70">
          Para volver a usarlo, el responsable tiene que activarlo de nuevo desde «Mi empresa».
        </p>
        <button
          type="button"
          class="mt-6 h-12 cursor-pointer rounded-xl bg-alba px-6 font-extrabold text-noche transition-colors hover:bg-alba-mid"
          @click="handleExit"
        >
          Ir al inicio de sesión
        </button>
      </div>

      <!-- Sesión de la persona identificada. La "key" hace que cada persona estrene componente,
           sin restos de la anterior -->
      <KioskSession v-else-if="employee" :key="employee.uid" :employee="employee" :now="now" @done="employee = null" />

      <!-- Teclado, a la espera de un código -->
      <template v-else>
        <LiveClock :now="now" class="text-center" />
        <p class="mt-8 mb-6 text-lg font-bold">Teclea tu código para fichar</p>
        <PinPad :disabled="isChecking || isLocked" @complete="handlePin" />
      </template>
    </div>

    <!-- Salida del modo quiosco: discreta, porque no es para el día a día -->
    <button
      v-if="!isLoading && !isRevoked && !employee"
      type="button"
      class="cursor-pointer text-xs text-noche/50 underline underline-offset-4 dark:text-white/50"
      @click="isConfirmingExit = true"
    >
      Salir del modo quiosco
    </button>

    <ConfirmDialog
      :open="isConfirmingExit"
      title="¿Salir del modo quiosco?"
      confirm-label="Sí, salir"
      @confirm="handleExit"
      @cancel="isConfirmingExit = false"
    >
      Este dispositivo dejará de servir para fichar con código hasta que el responsable lo active de nuevo.
    </ConfirmDialog>
  </main>
</template>
