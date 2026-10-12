<script setup>
import { computed, ref } from 'vue'
import { playKeySound } from '@/utils/sounds'

// Campo de formulario: etiqueta + caja de texto. Nació para las pantallas de acceso
// y lo usan también los formularios de empresa.
// Si es de contraseña añade el botón del ojo para ver lo que se ha escrito.
const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  autocomplete: { type: String, default: 'off' },
  placeholder: { type: String, default: '' },
  minlength: { type: Number, default: undefined },
  maxlength: { type: Number, default: undefined },
})

// Valor del campo, enlazado con v-model desde la vista que lo usa
const value = defineModel({ type: String, required: true })

const isPassword = computed(() => props.type === 'password')
const showPassword = ref(false)

// Una contraseña visible se muestra como texto normal; el resto de campos no cambian de tipo
const inputType = computed(() => (isPassword.value && showPassword.value ? 'text' : props.type))

// Suena un toque por cada tecla que escribe o borra, como el teclado de un móvil.
// Se ignoran las teclas que no cambian el texto (Tab, Mayús, flechas...)
function handleKeydown(event) {
  const writesOrDeletes = event.key.length === 1 || event.key === 'Backspace'
  if (writesOrDeletes) playKeySound()
}
</script>

<template>
  <div>
    <label :for="id" class="mb-1.5 block text-sm font-bold">{{ label }}</label>
    <div class="relative">
      <input
        :id="id"
        v-model="value"
        :type="inputType"
        required
        :minlength="minlength"
        :maxlength="maxlength"
        :autocomplete="autocomplete"
        :placeholder="placeholder"
        class="h-12 w-full rounded-xl border-2 border-noche/15 bg-white px-4 outline-none placeholder:text-noche/40 focus:border-alba-mid dark:border-white/15 dark:bg-panel dark:placeholder:text-white/40"
        :class="{ 'pr-12': isPassword }"
        @keydown="handleKeydown"
      />
      <button
        v-if="isPassword"
        type="button"
        class="absolute inset-y-0 right-0 grid w-12 cursor-pointer place-items-center rounded-xl text-noche/60 hover:text-noche dark:text-white/60 dark:hover:text-white"
        :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        :aria-pressed="showPassword"
        @click="showPassword = !showPassword"
      >
        <!-- Ojo; la raya que lo tacha aparece cuando la contraseña está visible -->
        <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
          <path v-if="showPassword" d="M4 4l16 16" />
        </svg>
      </button>
    </div>
  </div>
</template>
