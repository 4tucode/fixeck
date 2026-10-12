import { beforeEach, describe, expect, it, vi } from 'vitest'
import ForgotPasswordView from '@/views/ForgotPasswordView.vue'
import { notifyError, notifySuccess } from '@/utils/notify'
import { firebaseError, mountView, submitForm } from './helpers'

// Función falsa que sustituye al envío del correo de Firebase (ver LoginView.test.js)
const mocks = vi.hoisted(() => ({ sendResetEmail: vi.fn() }))

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({ sendResetEmail: mocks.sendResetEmail }),
}))
vi.mock('@/utils/notify', () => ({ notifySuccess: vi.fn(), notifyError: vi.fn() }))

describe('ForgotPasswordView', () => {
  beforeEach(() => vi.clearAllMocks())

  it('pide el correo de recuperación y avisa de que se ha enviado', async () => {
    mocks.sendResetEmail.mockResolvedValue()
    const wrapper = mountView(ForgotPasswordView)
    await wrapper.find('#email').setValue('ana@fixeck.test')

    await submitForm(wrapper)

    expect(mocks.sendResetEmail).toHaveBeenCalledWith('ana@fixeck.test')
    expect(notifySuccess).toHaveBeenCalledOnce()
  })

  it('muestra el error si el correo no es válido', async () => {
    mocks.sendResetEmail.mockRejectedValue(firebaseError('auth/invalid-email'))
    const wrapper = mountView(ForgotPasswordView)
    await wrapper.find('#email').setValue('esto-no-es-un-correo')

    await submitForm(wrapper)

    expect(notifyError).toHaveBeenCalledWith('Ese correo no tiene un formato válido.')
    expect(notifySuccess).not.toHaveBeenCalled()
  })

  it('avisa si se han hecho demasiados intentos', async () => {
    mocks.sendResetEmail.mockRejectedValue(firebaseError('auth/too-many-requests'))
    const wrapper = mountView(ForgotPasswordView)
    await wrapper.find('#email').setValue('ana@fixeck.test')

    await submitForm(wrapper)

    expect(notifyError).toHaveBeenCalledWith('Demasiados intentos. Espera unos minutos y vuelve a probar.')
  })
})
