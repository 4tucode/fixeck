<script setup>
// Botón principal de los formularios de acceso.
// Mientras se espera a Firebase se desactiva y cambia el texto, para evitar envíos repetidos.
defineProps({
  loading: { type: Boolean, default: false },
})
</script>

<template>
  <button
    type="submit"
    class="h-12 w-full cursor-pointer rounded-xl bg-alba text-lg font-extrabold text-noche transition-colors hover:bg-alba-mid disabled:cursor-wait disabled:opacity-60"
    :disabled="loading"
  >
    <template v-if="loading">Un momento…</template>
    <slot v-else />
  </button>
</template>
