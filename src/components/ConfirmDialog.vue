<script setup>
import { nextTick, useTemplateRef, watch } from 'vue'
import { playPopSound } from '@/utils/sounds'

// Ventana que pide confirmación antes de una acción que no se puede deshacer.
// Quien la usa decide cuándo se ve (propiedad "open") y qué hacer con la respuesta
// (eventos "confirm" y "cancel"). El texto explicativo va en el hueco por defecto.
const props = defineProps({
  open: { type: Boolean, required: true },
  title: { type: String, required: true },
  confirmLabel: { type: String, required: true },
  cancelLabel: { type: String, default: 'Cancelar' },
})

const emit = defineEmits(['confirm', 'cancel'])

const cancelButton = useTemplateRef('cancelButton')

// Al abrirse suena un "pop" y el foco va al botón de cancelar: así, quien pulsa Intro
// sin leer no confirma por accidente, y con el teclado se llega enseguida a los dos botones
watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    playPopSound()
    await nextTick()
    cancelButton.value?.focus()
  },
)
</script>

<template>
  <!-- Fondo oscuro que tapa la pantalla; pulsar fuera de la ventana equivale a cancelar.
       La tecla Escape también cancela -->
  <div
    v-if="open"
    class="fixed inset-0 z-20 grid place-items-center bg-noche/60 p-5"
    @click.self="emit('cancel')"
    @keydown.esc="emit('cancel')"
  >
    <!-- role="alertdialog" avisa a los lectores de pantalla de que hay que responder para seguir -->
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      class="ventana w-full max-w-sm rounded-3xl bg-crema p-6 text-center shadow-2xl dark:bg-panel"
    >
      <h2 id="confirm-title" class="font-display text-2xl font-semibold">{{ title }}</h2>
      <p class="mt-2 text-noche/70 dark:text-white/70"><slot /></p>

      <div class="mt-6 flex flex-col gap-2">
        <button
          type="button"
          class="h-12 cursor-pointer rounded-xl bg-cresta font-extrabold text-white transition-colors hover:bg-red-600"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </button>
        <button
          ref="cancelButton"
          type="button"
          class="h-12 cursor-pointer rounded-xl border-2 border-noche/15 font-bold transition-colors hover:border-noche/40 dark:border-white/15 dark:hover:border-white/40"
          @click="emit('cancel')"
        >
          {{ cancelLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* La ventana aparece creciendo un poco, a juego con el sonido.
   Solo si el usuario no ha pedido reducir el movimiento en su sistema */
@media (prefers-reduced-motion: no-preference) {
  .ventana {
    animation: aparecer 0.18s ease-out;
  }
}

@keyframes aparecer {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
}
</style>
