<script setup>
import { computed } from 'vue'
import { formatLongDate, formatTime } from '@/utils/time'

// Reloj grande con la fecha debajo. No lleva temporizador propio: recibe la hora
// en la propiedad "now" y se limita a pintarla, así que avanza cuando quien lo usa la actualiza.
const props = defineProps({
  now: { type: Date, required: true },
})

// Los segundos se muestran aparte y más pequeños: dan sensación de reloj en marcha sin distraer
const seconds = computed(() => String(props.now.getSeconds()).padStart(2, '0'))
</script>

<template>
  <div>
    <!-- role="timer" indica a los lectores de pantalla que es un reloj y que no anuncien cada cambio -->
    <p class="font-display leading-none font-semibold tabular-nums" role="timer" aria-label="Hora actual">
      <span class="text-5xl lg:text-8xl">{{ formatTime(now) }}</span>
      <span class="ml-1 text-xl text-noche/40 lg:text-4xl dark:text-white/40">{{ seconds }}</span>
    </p>
    <p class="mt-1 text-sm font-bold text-noche/60 first-letter:uppercase lg:mt-3 lg:text-lg dark:text-white/60">
      {{ formatLongDate(now) }}
    </p>
  </div>
</template>
