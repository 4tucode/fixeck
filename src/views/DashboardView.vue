<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { useAuth } from '@/composables/useAuth'
import { useElapsedSeconds } from '@/composables/useElapsedSeconds'
import { useShift } from '@/composables/useShift'
import { notifyError, notifySuccess } from '@/utils/notify'
import { serverNow, syncServerClock } from '@/utils/serverClock'
import { formatClock, formatDuration, formatTime } from '@/utils/time'

const router = useRouter()
const { user, logout } = useAuth()

// Jornada en curso del usuario, sincronizada en tiempo real con Firestore
const { activeShift, isLoading, hasError, clockIn, clockOut } = useShift(user.value.uid)

// Se ajusta la hora con la del servidor para que el contador sea correcto
// aunque el reloj del dispositivo esté mal puesto
syncServerClock(user.value.uid)

// Segundos trabajados en la jornada abierta; vale 0 si no hay ninguna
const { elapsedSeconds } = useElapsedSeconds(() => activeShift.value?.startedAt)

const isWorking = computed(() => activeShift.value !== null)

// true mientras se guarda un fichaje, para no enviar dos seguidos con un doble clic
const isSaving = ref(false)

// Un solo botón para las dos acciones: ficha la salida si hay jornada abierta y la entrada si no
async function handleClock() {
  isSaving.value = true
  try {
    if (isWorking.value) {
      // La duración se guarda antes de cerrar, porque al cerrar el contador vuelve a cero
      const worked = formatDuration(elapsedSeconds.value)
      await clockOut()
      notifySuccess(`Salida fichada. Has trabajado ${worked}.`)
    } else {
      await clockIn()
      notifySuccess(`Entrada fichada a las ${formatTime(serverNow())}. ¡Buena jornada!`)
    }
  } catch {
    notifyError('No hemos podido guardar el fichaje. Inténtalo de nuevo.')
  } finally {
    isSaving.value = false
  }
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

    <section class="flex flex-1 flex-col items-center justify-center py-10 text-center">
      <!-- Estado actual: aria-live hace que los lectores de pantalla anuncien el cambio -->
      <p
        class="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-extrabold"
        :class="
          isWorking
            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
            : 'bg-noche/10 text-noche/70 dark:bg-white/10 dark:text-white/70'
        "
        aria-live="polite"
      >
        <span
          class="size-2.5 rounded-full"
          :class="isWorking ? 'bg-emerald-500 motion-safe:animate-pulse' : 'bg-noche/40 dark:bg-white/40'"
        ></span>
        {{ isLoading ? 'Cargando tu jornada…' : isWorking ? 'Trabajando' : 'Fuera de jornada' }}
      </p>

      <!-- Contador: tabular-nums da el mismo ancho a todas las cifras para que no "baile" -->
      <p
        class="mt-8 font-display text-7xl leading-none font-semibold tabular-nums transition-opacity"
        :class="{ 'opacity-30': !isWorking }"
        role="timer"
      >
        {{ formatClock(elapsedSeconds) }}
      </p>
      <p class="mt-4 h-6 text-noche/70 dark:text-white/70">
        <template v-if="isWorking">Entrada a las {{ formatTime(activeShift.startedAt) }}</template>
        <template v-else-if="!isLoading">Ficha la entrada para empezar a contar.</template>
      </p>

      <!-- Botón principal: dorado para entrar y rojo para salir, así no se confunden -->
      <button
        type="button"
        class="mt-10 h-16 w-full max-w-xs cursor-pointer rounded-2xl text-xl font-extrabold transition-colors disabled:cursor-wait disabled:opacity-60"
        :class="isWorking ? 'bg-cresta text-white hover:bg-red-600' : 'bg-alba text-noche hover:bg-alba-mid'"
        :disabled="isLoading || isSaving || hasError"
        @click="handleClock"
      >
        {{ isSaving ? 'Guardando…' : isWorking ? 'Fichar salida' : 'Fichar entrada' }}
      </button>

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
