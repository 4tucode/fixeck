<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import VerifyEmailBanner from '@/components/VerifyEmailBanner.vue'
import { useAuth } from '@/composables/useAuth'
import { useServerNow } from '@/composables/useServerNow'
import { useShift } from '@/composables/useShift'
import { notifyError, notifySuccess } from '@/utils/notify'
import { serverNow, syncServerClock } from '@/utils/serverClock'
import { workedSeconds } from '@/utils/shifts'
import { formatClock, formatDuration, formatTime, secondsBetween } from '@/utils/time'

// Colores de la etiqueta de estado (fondo y texto de la etiqueta, y su punto) en cada situación
const STATUS_STYLES = {
  idle: { pill: 'bg-noche/10 text-noche/70 dark:bg-white/10 dark:text-white/70', dot: 'bg-noche/40 dark:bg-white/40' },
  working: {
    pill: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500 motion-safe:animate-pulse',
  },
  onBreak: { pill: 'bg-alba/25 text-amber-800 dark:text-alba', dot: 'bg-alba-mid' },
}

const router = useRouter()
const { user, logout } = useAuth()

// Se ajusta la hora con la del servidor para que el contador sea correcto
// aunque el reloj del dispositivo esté mal puesto
syncServerClock(user.value.uid)

// Jornada en curso del usuario y sus pausas, sincronizadas en tiempo real con Firestore
const { activeShift, breaks, openBreak, isLoading, hasError, clockIn, clockOut, startBreak, endBreak } = useShift(
  user.value.uid,
)

// Hora actual, que cambia cada segundo y hace avanzar los contadores
const { now } = useServerNow()

const isWorking = computed(() => activeShift.value !== null)
const isOnBreak = computed(() => openBreak.value !== null)

// Segundos trabajados en la jornada abierta, sin contar las pausas. Durante una pausa no avanza
const worked = computed(() => (isWorking.value ? workedSeconds(activeShift.value, breaks.value, now.value) : 0))

// Segundos que dura la pausa en curso
const breakSeconds = computed(() => (isOnBreak.value ? secondsBetween(openBreak.value.startedAt, now.value) : 0))

// Texto y colores de la etiqueta de estado
const status = computed(() => {
  if (isLoading.value) return { text: 'Cargando tu jornada…', ...STATUS_STYLES.idle }
  if (isOnBreak.value) return { text: 'En pausa', ...STATUS_STYLES.onBreak }
  if (isWorking.value) return { text: 'Trabajando', ...STATUS_STYLES.working }
  return { text: 'Fuera de jornada', ...STATUS_STYLES.idle }
})

// true mientras se guarda un fichaje, para no enviar dos seguidos con un doble clic
const isSaving = ref(false)

// Los botones se desactivan mientras no se pueda fichar con garantías
const isDisabled = computed(() => isLoading.value || isSaving.value || hasError.value)

// Ejecuta una acción de fichaje controlando en un solo sitio el guardado y los errores.
// Recibe la función que guarda y el mensaje que se enseña si todo va bien
async function save(action, successMessage) {
  isSaving.value = true
  try {
    await action()
    notifySuccess(successMessage)
  } catch {
    notifyError('No hemos podido guardar el fichaje. Inténtalo de nuevo.')
  } finally {
    isSaving.value = false
  }
}

// En las cuatro acciones el mensaje se prepara antes de guardar,
// porque al guardar los contadores cambian o vuelven a cero

function handleClockIn() {
  return save(clockIn, `Entrada fichada a las ${formatTime(serverNow())}. ¡Buena jornada!`)
}

function handleClockOut() {
  return save(clockOut, `Salida fichada. Has trabajado ${formatDuration(worked.value)}.`)
}

function handleStartBreak() {
  return save(startBreak, 'Pausa iniciada. ¡Buen descanso!')
}

function handleEndBreak() {
  return save(endBreak, `De vuelta al trabajo. La pausa ha durado ${formatDuration(breakSeconds.value)}.`)
}

// Cierra la sesión y vuelve al login
async function handleLogout() {
  await logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <main class="mx-auto flex min-h-screen max-w-md flex-col px-5 pt-5 pb-10">
    <AppHeader />
    <VerifyEmailBanner />

    <section class="flex flex-1 flex-col items-center justify-center py-10 text-center">
      <!-- Estado actual: aria-live hace que los lectores de pantalla anuncien el cambio -->
      <p
        class="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-extrabold"
        :class="status.pill"
        aria-live="polite"
      >
        <span class="size-2.5 rounded-full" :class="status.dot"></span>
        {{ status.text }}
      </p>

      <!-- Contador de tiempo trabajado: tabular-nums da el mismo ancho a todas las cifras
           para que no "baile". Se atenúa cuando no está avanzando -->
      <p
        class="mt-8 font-display text-7xl leading-none font-semibold tabular-nums transition-opacity"
        :class="{ 'opacity-30': !isWorking || isOnBreak }"
        role="timer"
      >
        {{ formatClock(worked) }}
      </p>
      <p class="mt-4 h-6 text-noche/70 dark:text-white/70">
        <template v-if="isOnBreak">
          En pausa desde las {{ formatTime(openBreak.startedAt) }} · {{ formatClock(breakSeconds) }}
        </template>
        <template v-else-if="isWorking">Entrada a las {{ formatTime(activeShift.startedAt) }}</template>
        <template v-else-if="!isLoading">Ficha la entrada para empezar a contar.</template>
      </p>

      <!-- Botones. El grande es siempre la acción más probable en cada estado:
           entrar si se está fuera, salir si se está trabajando y reanudar si se está en pausa -->
      <div class="mt-10 flex w-full max-w-xs flex-col gap-3">
        <button v-if="!isWorking" type="button" class="boton-principal bg-alba text-noche hover:bg-alba-mid" :disabled="isDisabled" @click="handleClockIn">
          Fichar entrada
        </button>

        <template v-else-if="isOnBreak">
          <button type="button" class="boton-principal bg-alba text-noche hover:bg-alba-mid" :disabled="isDisabled" @click="handleEndBreak">
            Reanudar
          </button>
          <button type="button" class="boton-secundario" :disabled="isDisabled" @click="handleClockOut">
            Fichar salida
          </button>
        </template>

        <template v-else>
          <button type="button" class="boton-principal bg-cresta text-white hover:bg-red-600" :disabled="isDisabled" @click="handleClockOut">
            Fichar salida
          </button>
          <button type="button" class="boton-secundario" :disabled="isDisabled" @click="handleStartBreak">
            Pausar
          </button>
        </template>
      </div>

      <p v-if="hasError" role="alert" class="mt-4 text-sm font-bold text-red-700 dark:text-red-300">
        No podemos conectar con el servidor. Revisa tu conexión y recarga la página.
      </p>
    </section>

    <!-- Pie: quién ha entrado y accesos secundarios -->
    <footer class="flex flex-col items-center gap-3 text-sm">
      <RouterLink :to="{ name: 'historial' }" class="font-extrabold underline underline-offset-4">
        Ver historial de fichajes
      </RouterLink>
      <p class="text-noche/60 dark:text-white/60">
        {{ user?.email }} ·
        <button type="button" class="cursor-pointer font-bold underline underline-offset-4" @click="handleLogout">
          Cerrar sesión
        </button>
      </p>
    </footer>
  </main>
</template>

<style scoped>
/* Las dos formas de botón del panel se definen aquí una vez, porque se repiten
   en los tres estados; el color de cada botón principal se pone en la plantilla */
@reference "../style.css";

.boton-principal {
  @apply h-16 cursor-pointer rounded-2xl text-xl font-extrabold transition-colors disabled:cursor-wait disabled:opacity-60;
}

.boton-secundario {
  @apply h-12 cursor-pointer rounded-xl border-2 border-noche/15 font-bold transition-colors hover:border-noche/40 disabled:cursor-wait disabled:opacity-60 dark:border-white/15 dark:hover:border-white/40;
}
</style>
