<script setup>
import { ref, watch } from 'vue'
import { assignPin, useMemberPin } from '@/composables/useKiosk'
import { notifyError, notifySuccess } from '@/utils/notify'

// Lo que ve el responsable en la ficha de una persona: su código de quiosco
// y el botón para dárselo o cambiárselo por otro.
const props = defineProps({
  companyId: { type: String, required: true },
  // Persona del equipo: { id, name, email }
  member: { type: Object, required: true },
})

// Avisa a la pantalla que lo contiene del código actual, que lo necesita para la baja
const emit = defineEmits(['change'])

const { pin, isLoading } = useMemberPin(props.companyId, props.member.id)

watch(pin, (currentPin) => emit('change', currentPin))

// true mientras se guarda, para no pedir dos códigos con un doble clic
const isSaving = ref(false)

// Da a la persona un código nuevo, elegido al azar; el que tuviera deja de servir
async function handleAssign() {
  isSaving.value = true
  try {
    const newPin = await assignPin(props.companyId, props.member, pin.value)
    notifySuccess(`Código de ${props.member.name}: ${newPin}`)
  } catch {
    notifyError('No hemos podido asignar el código. Inténtalo de nuevo.')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <section v-if="!isLoading" class="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-noche/5 p-5 dark:bg-white/5">
    <div>
      <h2 class="text-sm font-bold">Código de quiosco</h2>
      <p v-if="pin" class="font-display text-3xl font-semibold tracking-widest tabular-nums">{{ pin }}</p>
      <p v-else class="text-sm text-noche/70 dark:text-white/70">Sin código todavía</p>
    </div>
    <button
      type="button"
      class="h-11 cursor-pointer rounded-xl border-2 border-noche/15 px-4 text-sm font-extrabold transition-colors hover:border-noche/40 disabled:cursor-wait disabled:opacity-60 dark:border-white/15 dark:hover:border-white/40"
      :disabled="isSaving"
      @click="handleAssign"
    >
      {{ pin ? 'Cambiar código' : 'Generar código' }}
    </button>
  </section>
</template>
