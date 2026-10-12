import { ref, watchEffect } from 'vue'

const STORAGE_KEY = 'fixeck-theme'

// Lee la preferencia guardada; si no hay, usa la del sistema operativo
function getInitialTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) return saved === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

// Estado fuera de la función: todos los componentes comparten el mismo tema
const isDark = ref(getInitialTheme())

// Cada vez que cambia isDark, actualiza la clase de <html> y guarda la elección
watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
})

export function useTheme() {
  function toggleTheme() {
    isDark.value = !isDark.value
  }

  return { isDark, toggleTheme }
}
