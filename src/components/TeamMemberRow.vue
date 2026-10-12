<script setup>
import { computed } from 'vue'
import StatusPill from '@/components/StatusPill.vue'
import { useShift } from '@/composables/useShift'
import { workedSeconds } from '@/utils/shifts'
import { formatDuration, formatTime } from '@/utils/time'

// Fila de una persona en la lista del equipo: quién es y qué está haciendo ahora mismo.
// Pulsarla lleva a su historial de fichajes.
const props = defineProps({
  // Persona del equipo: { id, name, email }, donde id es su uid
  member: { type: Object, required: true },
  // true si la fila es la del propio responsable que está mirando la lista
  isSelf: { type: Boolean, default: false },
  // Hora actual; la pasa la lista para que todas las filas avancen con un único reloj
  now: { type: Date, required: true },
})

// Se reutiliza la misma lógica del panel del empleado, aquí solo para leer:
// la jornada abierta de esta persona y sus pausas, en tiempo real
const { activeShift, breaks, openBreak, isLoading } = useShift(props.member.id)

// Situación de la persona, con los mismos nombres que usa StatusPill
const state = computed(() => {
  if (openBreak.value) return 'onBreak'
  if (activeShift.value) return 'working'
  return 'idle'
})

const STATE_TEXTS = { idle: 'Fuera', working: 'Trabajando', onBreak: 'En pausa' }

// Detalle bajo el nombre: desde cuándo trabaja y cuánto lleva, o desde cuándo está en pausa
const detail = computed(() => {
  if (isLoading.value) return 'Cargando…'
  if (state.value === 'onBreak') return `En pausa desde las ${formatTime(openBreak.value.startedAt)}`
  if (state.value === 'working') {
    const worked = workedSeconds(activeShift.value, breaks.value, props.now)
    return `Entrada a las ${formatTime(activeShift.value.startedAt)} · ${formatDuration(worked)}`
  }
  return props.member.email
})
</script>

<template>
  <li>
    <RouterLink
      :to="{ name: 'empleado', params: { uid: member.id } }"
      class="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-noche/10 transition-shadow hover:ring-2 hover:ring-alba-mid dark:bg-panel dark:ring-white/10"
    >
      <!-- min-w-0 permite que un nombre o un correo largos se recorten en vez de desbordar la fila -->
      <div class="min-w-0">
        <p class="truncate font-bold">
          {{ member.name }}
          <span v-if="isSelf" class="font-normal text-noche/60 dark:text-white/60">(tú)</span>
        </p>
        <p class="mt-0.5 truncate text-sm text-noche/60 tabular-nums dark:text-white/60">{{ detail }}</p>
      </div>

      <StatusPill :state="state">{{ STATE_TEXTS[state] }}</StatusPill>
    </RouterLink>
  </li>
</template>
