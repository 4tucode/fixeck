import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AuthField from '@/components/AuthField.vue'
import { playKeySound } from '@/utils/sounds'

// El sonido se sustituye por una función espía: solo interesa saber si se ha llamado
vi.mock('@/utils/sounds', () => ({ playKeySound: vi.fn() }))

// Monta un campo de contraseña vacío
function mountPasswordField() {
  return mount(AuthField, {
    props: { id: 'password', label: 'Contraseña', type: 'password', modelValue: '' },
  })
}

describe('AuthField', () => {
  beforeEach(() => vi.clearAllMocks())

  it('suena al escribir una letra y al borrar', async () => {
    const input = mountPasswordField().find('input')

    await input.trigger('keydown', { key: 'a' })
    await input.trigger('keydown', { key: 'Backspace' })

    expect(playKeySound).toHaveBeenCalledTimes(2)
  })

  it('no suena con teclas que no cambian el texto', async () => {
    const input = mountPasswordField().find('input')

    await input.trigger('keydown', { key: 'Tab' })
    await input.trigger('keydown', { key: 'Shift' })

    expect(playKeySound).not.toHaveBeenCalled()
  })

  it('el botón del ojo muestra y vuelve a ocultar la contraseña', async () => {
    const wrapper = mountPasswordField()
    const input = wrapper.find('input')
    const eyeButton = wrapper.find('button')

    expect(input.attributes('type')).toBe('password')

    await eyeButton.trigger('click')
    expect(input.attributes('type')).toBe('text')

    await eyeButton.trigger('click')
    expect(input.attributes('type')).toBe('password')
  })

  it('un campo que no es de contraseña no tiene botón del ojo', () => {
    const wrapper = mount(AuthField, {
      props: { id: 'email', label: 'Correo electrónico', type: 'email', modelValue: '' },
    })

    expect(wrapper.find('button').exists()).toBe(false)
  })
})
