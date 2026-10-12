import { beforeEach, describe, expect, it, vi } from 'vitest'
import RegisterView from '@/views/RegisterView.vue'
import { notifyError, notifySuccess } from '@/utils/notify'
import { firebaseError, mountView, submitForm } from './helpers'

// Funciones falsas que sustituyen a Firebase y al router (ver LoginView.test.js)
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  register: vi.fn(),
  loginWithGoogle: vi.fn(),
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({ register: mocks.register, loginWithGoogle: mocks.loginWithGoogle }),
}))
vi.mock('@/utils/notify', () => ({ notifySuccess: vi.fn(), notifyError: vi.fn() }))

// Monta el registro y rellena el formulario con los datos indicados
async function mountAndFill(email, password) {
  const wrapper = mountView(RegisterView)
  await wrapper.find('#email').setValue(email)
  await wrapper.find('#password').setValue(password)
  return wrapper
}

describe('RegisterView', () => {
  beforeEach(() => vi.clearAllMocks())

  it('crea la cuenta, avisa y lleva al panel', async () => {
    mocks.register.mockResolvedValue()
    const wrapper = await mountAndFill('nuevo@fixeck.test', 'secreta123')

    await submitForm(wrapper)

    expect(mocks.register).toHaveBeenCalledWith('nuevo@fixeck.test', 'secreta123')
    expect(notifySuccess).toHaveBeenCalledOnce()
    expect(mocks.push).toHaveBeenCalledWith({ name: 'panel' })
  })

  it('avisa si ya existe una cuenta con ese correo', async () => {
    mocks.register.mockRejectedValue(firebaseError('auth/email-already-in-use'))
    const wrapper = await mountAndFill('repetido@fixeck.test', 'secreta123')

    await submitForm(wrapper)

    expect(notifyError).toHaveBeenCalledWith('Ya existe una cuenta con ese correo. Prueba a entrar.')
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('avisa si Firebase rechaza la contraseña por corta', async () => {
    mocks.register.mockRejectedValue(firebaseError('auth/weak-password'))
    const wrapper = await mountAndFill('nuevo@fixeck.test', '123')

    await submitForm(wrapper)

    expect(notifyError).toHaveBeenCalledWith('La contraseña debe tener al menos 6 caracteres.')
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('el campo de contraseña exige al menos 6 caracteres', () => {
    const wrapper = mountView(RegisterView)

    expect(wrapper.find('#password').attributes('minlength')).toBe('6')
  })
})
