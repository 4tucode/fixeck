import { describe, expect, it } from 'vitest'
import { getAuthErrorMessage } from '@/utils/authErrors'

describe('getAuthErrorMessage', () => {
  it('traduce un código de error conocido', () => {
    const message = getAuthErrorMessage({ code: 'auth/invalid-credential' })
    expect(message).toBe('El correo o la contraseña no son correctos.')
  })

  it('devuelve un mensaje genérico si no conoce el código', () => {
    const message = getAuthErrorMessage({ code: 'auth/algo-nuevo' })
    expect(message).toBe('No hemos podido completar la acción. Inténtalo de nuevo.')
  })

  it('no muestra nada si el usuario cierra la ventana de Google', () => {
    expect(getAuthErrorMessage({ code: 'auth/popup-closed-by-user' })).toBe('')
  })
})
