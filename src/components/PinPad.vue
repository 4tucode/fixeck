<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { playKeySound } from '@/utils/sounds'

// Teclado numérico del quiosco. Va mostrando un punto por cada cifra tecleada y,
// al completar el código, lo comunica con el evento "complete".
// También acepta el teclado físico, por si el quiosco es un ordenador.
const props = defineProps({
  // Mientras está desactivado no admite cifras (por ejemplo, mientras se comprueba un código)
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['complete'])

// Número de cifras de un código
const PIN_LENGTH = 4

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

// Cifras tecleadas hasta ahora
const digits = ref('')

// Añade una cifra; con la última, entrega el código completo y vacía el teclado
function press(digit) {
  if (props.disabled || digits.value.length >= PIN_LENGTH) return
  playKeySound()
  digits.value += digit

  if (digits.value.length === PIN_LENGTH) {
    emit('complete', digits.value)
    digits.value = ''
  }
}

// Borra la última cifra
function erase() {
  if (props.disabled) return
  playKeySound()
  digits.value = digits.value.slice(0, -1)
}

// Teclado físico: los números escriben y Retroceso borra
function handleKeydown(event) {
  if (/^[0-9]$/.test(event.key)) press(event.key)
  else if (event.key === 'Backspace') erase()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="mx-auto w-full max-w-xs" :class="{ 'opacity-50': disabled }">
    <!-- Un punto por cifra: se rellena al teclearla. No se enseñan los números,
         porque el quiosco está a la vista de quien pase -->
    <div class="flex justify-center gap-4" role="status" :aria-label="`${digits.length} de ${PIN_LENGTH} cifras`">
      <span
        v-for="position in PIN_LENGTH"
        :key="position"
        class="size-4 rounded-full border-2 transition-colors"
        :class="position <= digits.length ? 'border-alba-mid bg-alba-mid' : 'border-noche/30 dark:border-white/30'"
      ></span>
    </div>

    <div class="mt-8 grid grid-cols-3 gap-3">
      <button v-for="key in KEYS" :key="key" type="button" class="tecla" :disabled="disabled" @click="press(key)">
        {{ key }}
      </button>
      <!-- Última fila: hueco, el cero y borrar -->
      <span></span>
      <button type="button" class="tecla" :disabled="disabled" @click="press('0')">0</button>
      <button type="button" class="tecla text-base" :disabled="disabled" aria-label="Borrar" @click="erase">⌫</button>
    </div>
  </div>
</template>

<style scoped>
@reference "../style.css";

/* Teclas grandes: en una tableta se pulsan con el dedo y con prisa */
.tecla {
  @apply h-18 cursor-pointer rounded-2xl bg-white font-display text-3xl font-semibold ring-1 ring-noche/10 transition-colors hover:bg-alba/30 active:bg-alba disabled:cursor-not-allowed dark:bg-panel dark:ring-white/10;
}
</style>
