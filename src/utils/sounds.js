// Sonidos de la interfaz generados con la Web Audio API del navegador.
// Así no hay que descargar archivos de audio: cada sonido es una nota muy corta.

// El contexto de audio se crea la primera vez que hace falta y se reutiliza después
let audioContext = null

// Devuelve el contexto de audio, o null si el navegador no lo soporta.
// Los navegadores lo dejan en pausa hasta que el usuario interactúa con la página,
// por eso se reanuda en cada uso
function getAudioContext() {
  if (!window.AudioContext) return null
  if (!audioContext) audioContext = new AudioContext()
  if (audioContext.state === 'suspended') audioContext.resume()
  return audioContext
}

// Reproduce una nota.
//  - frequency: tono en hercios (más alto = más agudo)
//  - duration: cuánto dura, en segundos
//  - delay: cuánto espera antes de sonar, para encadenar varias notas
//  - type: forma de la onda ('sine' suena suave, 'triangle' algo más áspero)
//  - volume: de 0 a 1
function playTone({ frequency, duration, delay = 0, type = 'sine', volume = 0.08 }) {
  const context = getAudioContext()
  if (!context) return

  const oscillator = context.createOscillator()
  const gain = context.createGain()
  const start = context.currentTime + delay

  oscillator.type = type
  oscillator.frequency.value = frequency

  // El volumen baja hasta casi cero al final para que la nota no termine con un chasquido
  gain.gain.setValueAtTime(volume, start)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  oscillator.connect(gain).connect(context.destination)
  oscillator.start(start)
  oscillator.stop(start + duration)
}

// Toque corto y agudo, como el de un teclado de móvil
export function playKeySound() {
  playTone({ frequency: 1100, duration: 0.04, type: 'triangle', volume: 0.04 })
}

// Dos notas que suben: algo ha salido bien
export function playSuccessSound() {
  playTone({ frequency: 660, duration: 0.12 })
  playTone({ frequency: 990, duration: 0.2, delay: 0.1 })
}

// Dos notas graves que bajan: algo ha salido mal
export function playErrorSound() {
  playTone({ frequency: 240, duration: 0.14, type: 'triangle' })
  playTone({ frequency: 170, duration: 0.24, delay: 0.12, type: 'triangle' })
}
