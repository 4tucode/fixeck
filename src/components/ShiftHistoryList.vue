<script setup>
import { computed } from 'vue'
import { useShiftHistory } from '@/composables/useShiftHistory'
import { serverNow } from '@/utils/serverClock'
import { groupShiftsByDay } from '@/utils/shifts'
import { formatDay, formatDuration, formatTime } from '@/utils/time'

// Lista de las últimas jornadas de una persona, agrupadas por día.
// La usan el historial del empleado y la ficha que ve su responsable.
const props = defineProps({
  // uid de la persona cuyas jornadas se enseñan
  uid: { type: String, required: true },
})

// Últimas jornadas y sus pausas, sincronizadas en tiempo real con Firestore
const { shifts, breaks, isLoading, hasError } = useShiftHistory(props.uid)

// Las jornadas agrupadas por día. A cada una se le añade lo trabajado (sin pausas)
// y lo que estuvo en pausa, y a cada día su total
const days = computed(() => groupShiftsByDay(shifts.value, breaks.value, serverNow()))
</script>

<template>
  <!-- Estados en los que todavía no hay lista que enseñar -->
  <p v-if="isLoading" class="mt-8 text-noche/70 dark:text-white/70">Cargando los fichajes…</p>

  <p v-else-if="hasError" role="alert" class="mt-8 font-bold text-red-700 dark:text-red-300">
    No podemos cargar el historial. Revisa tu conexión y recarga la página.
  </p>

  <!-- Sin jornadas: el texto lo pone cada pantalla, porque cambia según quién mira -->
  <div v-else-if="days.length === 0" class="mt-8 rounded-2xl bg-noche/5 p-6 text-center dark:bg-white/5">
    <slot name="empty" />
  </div>

  <!-- Un bloque por día: título con el total trabajado y, debajo, sus jornadas -->
  <template v-else>
    <section v-for="day in days" :key="day.key" class="mt-8">
      <div class="flex items-baseline justify-between gap-3">
        <h2 class="font-display text-xl font-semibold first-letter:uppercase">
          {{ formatDay(day.date, serverNow()) }}
        </h2>
        <!-- El total solo cuenta jornadas cerradas; si aún no hay ninguna, no se enseña -->
        <p v-if="day.totalSeconds > 0" class="text-sm font-extrabold whitespace-nowrap">
          {{ formatDuration(day.totalSeconds) }}
        </p>
      </div>

      <ul class="mt-3 flex flex-col gap-2">
        <li
          v-for="shift in day.shifts"
          :key="shift.id"
          class="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-noche/10 dark:bg-panel dark:ring-white/10"
        >
          <div>
            <!-- Horas de entrada y salida; tabular-nums las alinea entre filas -->
            <p class="font-bold tabular-nums">
              {{ formatTime(shift.startedAt) }}
              <span class="mx-1 text-noche/40 dark:text-white/40" aria-hidden="true">→</span>
              <span class="sr-only">hasta</span>
              <template v-if="shift.endedAt">{{ formatTime(shift.endedAt) }}</template>
              <template v-else>ahora</template>
            </p>
            <!-- Tiempo en pausa; solo se enseña si la jornada tuvo alguna. Va en ámbar, el mismo color
                 del estado "En pausa", para distinguirlo de un vistazo del tiempo trabajado -->
            <p
              v-if="shift.pausedSeconds > 0"
              class="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-alba/25 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-alba"
            >
              <span class="size-1.5 rounded-full bg-alba-mid" aria-hidden="true"></span>
              {{ formatDuration(shift.pausedSeconds) }} de pausa
            </p>
          </div>

          <!-- Tiempo trabajado, o la etiqueta "En curso" si la jornada sigue abierta -->
          <p v-if="shift.endedAt" class="text-sm font-bold whitespace-nowrap text-emerald-700 dark:text-emerald-300">
            {{ formatDuration(shift.workedSeconds) }}
            <span class="sr-only">trabajadas</span>
          </p>
          <p
            v-else
            class="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300"
          >
            En curso
          </p>
        </li>
      </ul>
    </section>
  </template>
</template>
