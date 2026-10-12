<script setup>
// Etiqueta de estado de una jornada: un punto de color y un texto.
// La usan el panel del empleado y la lista del equipo, para que el mismo estado se vea igual en los dos.
defineProps({
  // Situación de la jornada: 'idle' (fuera de jornada), 'working' (trabajando) u 'onBreak' (en pausa)
  state: { type: String, default: 'idle' },
})

// Colores de la etiqueta (fondo y texto) y de su punto en cada situación
const STYLES = {
  idle: { pill: 'bg-noche/10 text-noche/70 dark:bg-white/10 dark:text-white/70', dot: 'bg-noche/40 dark:bg-white/40' },
  working: {
    pill: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500 motion-safe:animate-pulse',
  },
  onBreak: { pill: 'bg-alba/25 text-amber-800 dark:text-alba', dot: 'bg-alba-mid' },
}
</script>

<template>
  <p
    class="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-extrabold whitespace-nowrap"
    :class="STYLES[state].pill"
  >
    <span class="size-2.5 rounded-full" :class="STYLES[state].dot"></span>
    <slot />
  </p>
</template>
