import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import LoginView from '@/views/LoginView.vue'
import { notifyError, notifySuccess } from '@/utils/notify'
import { firebaseError, mountView, submitForm } from './helpers'

// Funciones falsas que sustituyen a Firebase y al router.
// vi.hoisted las crea antes que los vi.mock de abajo, que se ejecutan lo primero de todo
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  login: vi.fn(),
  loginWithGoogle: vi.fn(),
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({ login: mocks.login, loginWithGoogle: mocks.loginWithGoogle }),
}))
// El reloj del servidor se sustituye por el del dispositivo, para no conectar con Firebase
vi.mock('@/utils/serverClock', () => ({ serverNow: () => new Date() }))
vi.mock('@/utils/notify', () => ({ notifySuccess: vi.fn(), notifyError: vi.fn() }))

// Monta el login y rellena el formulario con los datos indicados
async function mountAndFill(email, password) {
  const wrapper = mountView(LoginView)
  await wrapper.find('#email').setValue(email)
  await wrapper.find('#password').setValue(password)
  return wrapper
}

describe('LoginView', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra la hora actual y saluda según el momento del día', () => {
    // Reloj falso para fijar la hora: las 08:05:09 de un lunes
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 12, 8, 5, 9))

    const morning = mountView(LoginView)
    expect(morning.find('[role="timer"]').text()).toContain('08:05')
    expect(morning.text()).toContain('Lunes, 12 de octubre'.toLowerCase())
    expect(morning.find('h1').text()).toBe('¡Buenos días!')

    vi.setSystemTime(new Date(2026, 9, 12, 17, 30))
    expect(mountView(LoginView).find('h1').text()).toBe('¡Buenas tardes!')

    vi.setSystemTime(new Date(2026, 9, 12, 23, 30))
    expect(mountView(LoginView).find('h1').text()).toBe('¡Buenas noches!')

    vi.useRealTimers()
  })

  it('con datos correctos entra, avisa y lleva al panel', async () => {
    mocks.login.mockResolvedValue()
    const wrapper = await mountAndFill('ana@fixeck.test', 'secreta123')

    await submitForm(wrapper)

    expect(mocks.login).toHaveBeenCalledWith('ana@fixeck.test', 'secreta123')
    expect(notifySuccess).toHaveBeenCalledOnce()
    expect(mocks.push).toHaveBeenCalledWith({ name: 'panel' })
  })

  it('con la contraseña mal muestra el error y se queda en el login', async () => {
    mocks.login.mockRejectedValue(firebaseError('auth/invalid-credential'))
    const wrapper = await mountAndFill('ana@fixeck.test', 'incorrecta')

    await submitForm(wrapper)

    expect(notifyError).toHaveBeenCalledWith('El correo o la contraseña no son correctos.')
    expect(notifySuccess).not.toHaveBeenCalled()
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('quita los espacios sobrantes del correo antes de enviarlo', async () => {
    mocks.login.mockResolvedValue()
    const wrapper = await mountAndFill('  ana@fixeck.test  ', 'secreta123')

    await submitForm(wrapper)

    expect(mocks.login).toHaveBeenCalledWith('ana@fixeck.test', 'secreta123')
  })

  it('desactiva el botón mientras espera la respuesta', async () => {
    // Promesa que no termina hasta que el test lo decide, para poder mirar el estado intermedio
    let finishLogin
    mocks.login.mockReturnValue(new Promise((resolve) => (finishLogin = resolve)))
    const wrapper = await mountAndFill('ana@fixeck.test', 'secreta123')
    const submitButton = wrapper.find('button[type="submit"]')

    await wrapper.find('form').trigger('submit')
    expect(submitButton.attributes('disabled')).toBeDefined()

    finishLogin()
    await flushPromises()
    expect(submitButton.attributes('disabled')).toBeUndefined()
  })

  it('entra con Google y lleva al panel', async () => {
    mocks.loginWithGoogle.mockResolvedValue()
    const wrapper = mountView(LoginView)

    await wrapper.findComponent({ name: 'GoogleButton' }).find('button').trigger('click')
    await flushPromises()

    expect(mocks.push).toHaveBeenCalledWith({ name: 'panel' })
  })

  it('no muestra ningún aviso si se cierra la ventana de Google', async () => {
    mocks.loginWithGoogle.mockRejectedValue(firebaseError('auth/popup-closed-by-user'))
    const wrapper = mountView(LoginView)

    await wrapper.findComponent({ name: 'GoogleButton' }).find('button').trigger('click')
    await flushPromises()

    expect(notifyError).not.toHaveBeenCalled()
    expect(mocks.push).not.toHaveBeenCalled()
  })
})
