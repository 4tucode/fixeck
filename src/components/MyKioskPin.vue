<script setup>
import { useMemberPin } from '@/composables/useKiosk'

// Lo que ve un empleado en "Mi empresa": su código para fichar en el quiosco.
// El código se lo asigna su responsable; aquí solo se consulta.
const props = defineProps({
  companyId: { type: String, required: true },
  // uid del propio empleado
  uid: { type: String, required: true },
})

const { pin, isLoading } = useMemberPin(props.companyId, props.uid)
</script>

<template>
  <section v-if="!isLoading" class="mt-4 rounded-2xl bg-noche/5 p-6 dark:bg-white/5">
    <h2 class="font-bold">Tu código de quiosco</h2>

    <template v-if="pin">
      <!-- tracking-widest separa las cifras para que se lean de un vistazo -->
      <p class="mt-2 font-display text-5xl font-semibold tracking-widest tabular-nums">{{ pin }}</p>
      <p class="mt-2 text-sm text-noche/70 dark:text-white/70">
        Tecléalo en el quiosco de tu empresa para fichar sin correo ni contraseña. No lo compartas.
      </p>
    </template>
    <p v-else class="mt-1 text-sm text-noche/70 dark:text-white/70">
      Todavía no tienes. Pídeselo a tu responsable si en tu empresa se ficha en un quiosco.
    </p>
  </section>
</template>
