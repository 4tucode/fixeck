<script setup>
import { computed, onUnmounted, ref } from 'vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import StatusPill from '@/components/StatusPill.vue'
import { useShift } from '@/composables/useShift'
import { notifyError, notifySuccess } from '@/utils/notify'
import { serverNow } from '@/utils/serverClock'
import { workedSeconds } from '@/utils/shifts'
import { formatDuration, formatTime } from '@/utils/time'

// Pantalla del quiosco después de teclear un código válido: saluda a la persona, le enseña
// en qué situación está y le ofrece lo que puede fichar. Tras fichar (o si pasa un rato
// sin hacer nada) emite "done" y el quiosco vuelve al teclado para la siguiente persona.
const props = defineProps({
  // Persona identificada por su código: { uid, name }
  employee: { type: Object, required: true },
  // Hora actual; la pasa el quiosco, que ya tiene un reloj en marcha
  now: { type: Date, required: true },
})

const emit = defineEmits(['done'])

// Segundos sin tocar nada tras los que la sesión se cierra sola, para que nadie
// pueda fichar por quien tecleó su código y se marchó
const IDLE_SECONDS = 20

// La misma lógica del panel del empleado, aquí con el uid de la persona identificada.
// Las reglas de Firestore permiten al quiosco ver su jornada abierta y fichar por ella
const { activeShift, breaks, openBreak, isLoading, hasError, clockIn, clockOut, startBreak, endBreak } = useShift(
  props.employee.uid,
)

const isWorking = computed(() => activeShift.value !== null)
const isOnBreak = computed(() => openBreak.value !== null)

// Segundos trabajados en la jornada abierta, sin contar las pausas
const worked = computed(() => (isWorking.value ? workedSeconds(activeShift.value, breaks.value, props.now) : 0))

// Texto de la etiqueta de estado y situación que decide sus colores (ver StatusPill)
const status = computed(() => {
  if (isLoading.value) return { text: 'Cargando…', state: 'idle' }
  if (isOnBreak.value) return { text: `En pausa desde las ${formatTime(openBreak.value.startedAt)}`, state: 'onBreak' }
  if (isWorking.value) return { text: `Trabajando · ${formatDuration(worked.value)}`, state: 'working' }
  return { text: 'Fuera de jornada', state: 'idle' }
})

// Cierre por inactividad
const idleTimer = setTimeout(() => emit('done'), IDLE_SECONDS * 1000)
onUnmounted(() => clearTimeout(idleTimer))

// true mientras se guarda un fichaje, para no enviar dos seguidos
const isSaving = ref(false)

const isDisabled = computed(() => isLoading.value || isSaving.value || hasError.value)

// Guarda un fichaje, avisa del resultado y, si ha ido bien, cierra la sesión de esta persona
async function save(action, successMessage) {
  isSaving.value = true
  try {
    await action()
    notifySuccess(successMessage)
    emit('done')
  } catch {
    notifyError('No hemos podido guardar el fichaje. Inténtalo de nuevo.')
    isSaving.value = false
  }
}

// En todas las acciones el mensaje se prepara antes de guardar, porque al guardar los contadores cambian

function handleClockIn() {
  return save(clockIn, `Entrada fichada a las ${formatTime(serverNow())}. ¡Buena jornada, ${props.employee.name}!`)
}

// true mientras se pregunta si de verdad quiere fichar la salida (no se puede deshacer)
const isConfirmingClockOut = ref(false)

function handleClockOut() {
  isConfirmingClockOut.value = false
  return save(clockOut, `Salida fichada. Has trabajado ${formatDuration(worked.value)}. ¡Hasta mañana, ${props.employee.name}!`)
}

function handleStartBreak() {
  return save(startBreak, `Pausa iniciada. ¡Buen descanso, ${props.employee.name}!`)
}

function handleEndBreak() {
  return save(endBreak, `De vuelta al trabajo, ${props.employee.name}.`)
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-xs flex-col items-center text-center">
    <h1 class="font-display text-4xl font-semibold">Hola, {{ employee.name }}</h1>
    <StatusPill :state="status.state" class="mt-4" aria-live="polite">{{ status.text }}</StatusPill>

    <!-- Los mismos botones que en el panel del empleado: el grande es la acción más probable -->
    <div class="mt-8 flex w-full flex-col gap-3">
      <button v-if="!isWorking" type="button" class="boton-principal bg-alba text-noche hover:bg-alba-mid" :disabled="isDisabled" @click="handleClockIn">
        Fichar entrada
      </button>

      <template v-else-if="isOnBreak">
        <button type="button" class="boton-principal bg-alba text-noche hover:bg-alba-mid" :disabled="isDisabled" @click="handleEndBreak">
          Reanudar
        </button>
        <button type="button" class="boton-secundario" :disabled="isDisabled" @click="isConfirmingClockOut = true">
          Fichar salida
        </button>
      </template>

      <template v-else>
        <button type="button" class="boton-principal bg-cresta text-white hover:bg-red-600" :disabled="isDisabled" @click="isConfirmingClockOut = true">
          Fichar salida
        </button>
        <button type="button" class="boton-secundario" :disabled="isDisabled" @click="handleStartBreak">Pausar</button>
      </template>
    </div>

    <p v-if="hasError" role="alert" class="mt-4 text-sm font-bold text-red-700 dark:text-red-300">
      No podemos conectar con el servidor. Avisa a tu responsable.
    </p>

    <button type="button" class="mt-6 cursor-pointer text-sm font-bold underline underline-offset-4" @click="emit('done')">
      No soy {{ employee.name }} · Cancelar
    </button>

    <ConfirmDialog
      :open="isConfirmingClockOut"
      title="¿Fichar la salida?"
      confirm-label="Sí, fichar salida"
      cancel-label="Seguir en la jornada"
      @confirm="handleClockOut"
      @cancel="isConfirmingClockOut = false"
    >
      Has trabajado {{ formatDuration(worked) }}. La jornada se cerrará y no se podrá reabrir.
    </ConfirmDialog>
  </div>
</template>

<style scoped>
@reference "../style.css";

.boton-principal {
  @apply h-16 cursor-pointer rounded-2xl text-xl font-extrabold transition-colors disabled:cursor-wait disabled:opacity-60;
}

.boton-secundario {
  @apply h-12 cursor-pointer rounded-xl border-2 border-noche/15 font-bold transition-colors hover:border-noche/40 disabled:cursor-wait disabled:opacity-60 dark:border-white/15 dark:hover:border-white/40;
}
</style>
