import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ResetPasswordView from '@/views/ResetPasswordView.vue'
import { notifyError, notifySuccess } from '@/utils/notify'
import { firebaseError, mountView, submitForm } from './helpers'

// Funciones falsas que sustituyen a Firebase y al router (ver LoginView.test.js).
// "query" son los parámetros de la URL: cada test decide si trae código o no
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  query: {},
  checkResetCode: vi.fn(),
  saveNewPassword: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.push }),
  useRoute: () => ({ query: mocks.query }),
}))
vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({ checkResetCode: mocks.checkResetCode, saveNewPassword: mocks.saveNewPassword }),
}))
vi.mock('@/utils/notify', () => ({ notifySuccess: vi.fn(), notifyError: vi.fn() }))

// Monta la vista como si se hubiera abierto el enlace del correo con ese código
async function mountWithCode(code) {
  mocks.query = code ? { oobCode: code } : {}
  const wrapper = mountView(ResetPasswordView)
  await flushPromises()
  return wrapper
}

describe('ResetPasswordView', () => {
  beforeEach(() => vi.clearAllMocks())

  it('con un enlace válido enseña el formulario y el correo de la cuenta', async () => {
    mocks.checkResetCode.mockResolvedValue('ana@fixeck.test')

    const wrapper = await mountWithCode('codigo-valido')

    expect(mocks.checkResetCode).toHaveBeenCalledWith('codigo-valido')
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.text()).toContain('ana@fixeck.test')
  })

  it('guarda la contraseña nueva, avisa y manda al login', async () => {
    mocks.checkResetCode.mockResolvedValue('ana@fixeck.test')
    mocks.saveNewPassword.mockResolvedValue()
    const wrapper = await mountWithCode('codigo-valido')
    await wrapper.find('#password').setValue('nueva-clave-456')

    await submitForm(wrapper)

    expect(mocks.saveNewPassword).toHaveBeenCalledWith('codigo-valido', 'nueva-clave-456')
    expect(notifySuccess).toHaveBeenCalledOnce()
    expect(mocks.push).toHaveBeenCalledWith({ name: 'login' })
  })

  it('con un enlace caducado no enseña el formulario y ofrece pedir otro', async () => {
    mocks.checkResetCode.mockRejectedValue(firebaseError('auth/expired-action-code'))

    const wrapper = await mountWithCode('codigo-caducado')

    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).toContain('Pedir un enlace nuevo')
  })

  it('sin código en la URL trata el enlace como no válido sin llamar a Firebase', async () => {
    const wrapper = await mountWithCode(null)

    expect(mocks.checkResetCode).not.toHaveBeenCalled()
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('muestra el error si el código caduca mientras se escribe la contraseña', async () => {
    mocks.checkResetCode.mockResolvedValue('ana@fixeck.test')
    mocks.saveNewPassword.mockRejectedValue(firebaseError('auth/expired-action-code'))
    const wrapper = await mountWithCode('codigo-valido')
    await wrapper.find('#password').setValue('nueva-clave-456')

    await submitForm(wrapper)

    expect(notifyError).toHaveBeenCalledWith('El enlace ha caducado. Pide uno nuevo.')
    expect(mocks.push).not.toHaveBeenCalled()
  })
})
