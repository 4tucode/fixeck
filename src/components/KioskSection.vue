<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { activateKiosk, deactivateKiosk, useKiosks } from '@/composables/useKiosk'
import { notifyError, notifySuccess } from '@/utils/notify'
import { formatLongDate, formatTime } from '@/utils/time'

// Bloque "Modo quiosco" de la pantalla del responsable: convertir este dispositivo en quiosco
// y ver o desactivar los que ya hay.
const props = defineProps({
  // Empresa del responsable: { id, name, ownerId }
  company: { type: Object, required: true },
})

const router = useRouter()

// Quioscos activos de la empresa, en tiempo real
const { kiosks } = useKiosks(props.company.id)

// true mientras se pregunta al responsable si de verdad quiere convertir este dispositivo
const isConfirmingActivate = ref(false)

// true mientras se activa, para no lanzarlo dos veces
const isActivating = ref(false)

// Convierte este dispositivo en quiosco. La sesión del responsable se cierra por el camino,
// así que al terminar solo queda ir a la pantalla del quiosco (o al login, si algo falla)
async function handleActivate() {
  isConfirmingActivate.value = false
  isActivating.value = true
  try {
    await activateKiosk(props.company.id)
    notifySuccess('Este dispositivo ya es un quiosco.')
    router.push({ name: 'quiosco' })
  } catch {
    notifyError('No hemos podido activar el quiosco. Inténtalo de nuevo.')
    router.push({ name: 'login' })
  }
}

// Desactiva un quiosco: ese dispositivo deja de poder fichar al momento
async function handleDeactivate(kioskId) {
  try {
    await deactivateKiosk(props.company.id, kioskId)
    notifySuccess('Quiosco desactivado.')
  } catch {
    notifyError('No hemos podido desactivar el quiosco. Inténtalo de nuevo.')
  }
}
</script>

<template>
  <section class="mt-8 rounded-2xl bg-noche/5 p-5 dark:bg-white/5">
    <h2 class="font-display text-xl font-semibold">Modo quiosco</h2>
    <p class="mt-1 text-sm text-noche/70 dark:text-white/70">
      Deja una tableta o un ordenador en la entrada y tu equipo fichará tecleando su código de 4 cifras, sin correo ni
      contraseña.
    </p>

    <!-- Quioscos que ya están en marcha -->
    <ul v-if="kiosks.length > 0" class="mt-4 flex flex-col gap-2">
      <li
        v-for="(kiosk, index) in kiosks"
        :key="kiosk.id"
        class="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-noche/10 dark:bg-panel dark:ring-white/10"
      >
        <div>
          <p class="font-bold">Quiosco {{ index + 1 }}</p>
          <p class="text-sm text-noche/60 dark:text-white/60">
            Activo desde el {{ formatLongDate(kiosk.createdAt) }}, {{ formatTime(kiosk.createdAt) }}
          </p>
        </div>
        <button
          type="button"
          class="cursor-pointer text-sm font-extrabold underline underline-offset-4"
          @click="handleDeactivate(kiosk.id)"
        >
          Desactivar
        </button>
      </li>
    </ul>

    <button
      type="button"
      class="mt-4 h-12 w-full cursor-pointer rounded-xl border-2 border-noche/15 px-5 font-extrabold transition-colors hover:border-noche/40 disabled:cursor-wait disabled:opacity-60 sm:w-auto dark:border-white/15 dark:hover:border-white/40"
      :disabled="isActivating"
      @click="isConfirmingActivate = true"
    >
      Convertir este dispositivo en quiosco
    </button>

    <ConfirmDialog
      :open="isConfirmingActivate"
      title="¿Convertir en quiosco?"
      confirm-label="Sí, convertir en quiosco"
      @confirm="handleActivate"
      @cancel="isConfirmingActivate = false"
    >
      Se cerrará tu sesión en este dispositivo y quedará en la pantalla de fichar con código. Hazlo solo en el
      dispositivo que vaya a quedarse en la entrada.
    </ConfirmDialog>
  </section>
</template>
