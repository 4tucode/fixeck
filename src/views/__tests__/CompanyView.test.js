import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref, shallowRef } from 'vue'
import CompanyView from '@/views/CompanyView.vue'
import { notifyError, notifySuccess } from '@/utils/notify'
import { mountView, submitForm } from './helpers'

// Estado y funciones falsas que sustituyen a Firebase (ver LoginView.test.js)
const mocks = vi.hoisted(() => ({ company: null, createCompany: vi.fn() }))

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({ user: { value: { uid: 'uid-ana', email: 'ana@fixeck.test', displayName: null } } }),
}))
vi.mock('@/composables/useCompany', () => ({ useCompany: () => mocks.company }))
// La lista del equipo tiene sus propias piezas; aquí basta con saber si se enseña y con qué empresa
vi.mock('@/components/TeamList.vue', () => ({
  default: { props: ['company'], template: '<div data-test="equipo">{{ company.name }}</div>' },
}))
// El código de quiosco del empleado se lee de Firestore; aquí basta con saber que se enseña
vi.mock('@/components/MyKioskPin.vue', () => ({
  default: { props: ['companyId', 'uid'], template: '<div data-test="codigo">{{ uid }}</div>' },
}))
vi.mock('@/utils/serverClock', () => ({ syncServerClock: vi.fn() }))
vi.mock('@/utils/notify', () => ({ notifySuccess: vi.fn(), notifyError: vi.fn() }))

// Prepara la situación del usuario: su empresa (o null) y los estados de carga
function setCompany({ company = null, isLoading = false, hasError = false } = {}) {
  const companyRef = shallowRef(company)
  mocks.company = {
    company: companyRef,
    isManager: computed(() => companyRef.value?.ownerId === 'uid-ana'),
    isLoading: ref(isLoading),
    hasError: ref(hasError),
    createCompany: mocks.createCompany,
  }
}

describe('CompanyView', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sin empresa, ofrece crear una', () => {
    setCompany()
    const wrapper = mountView(CompanyView)

    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('[data-test="equipo"]').exists()).toBe(false)
  })

  it('crea la empresa con los nombres del formulario y avisa', async () => {
    setCompany()
    mocks.createCompany.mockResolvedValue()
    const wrapper = mountView(CompanyView)

    await wrapper.find('#companyName').setValue('Panadería El Gallo')
    await wrapper.find('#memberName').setValue('Ana García')
    await submitForm(wrapper)

    expect(mocks.createCompany).toHaveBeenCalledWith('Panadería El Gallo', 'Ana García')
    expect(notifySuccess).toHaveBeenCalledOnce()
  })

  it('avisa si no se puede crear la empresa', async () => {
    setCompany()
    mocks.createCompany.mockRejectedValue(new Error())
    const wrapper = mountView(CompanyView)

    await wrapper.find('#companyName').setValue('Panadería El Gallo')
    await wrapper.find('#memberName').setValue('Ana García')
    await submitForm(wrapper)

    expect(notifyError).toHaveBeenCalledOnce()
    expect(notifySuccess).not.toHaveBeenCalled()
  })

  it('al responsable le enseña su equipo', () => {
    setCompany({ company: { id: 'empresa-1', name: 'Panadería El Gallo', ownerId: 'uid-ana' } })
    const wrapper = mountView(CompanyView)

    expect(wrapper.find('h1').text()).toBe('Panadería El Gallo')
    expect(wrapper.find('[data-test="equipo"]').text()).toBe('Panadería El Gallo')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('al empleado le dice a qué empresa pertenece, sin enseñarle el equipo', () => {
    setCompany({ company: { id: 'empresa-1', name: 'Panadería El Gallo', ownerId: 'uid-jefa' } })
    const wrapper = mountView(CompanyView)

    expect(wrapper.text()).toContain('Formas parte del equipo de Panadería El Gallo')
    expect(wrapper.find('[data-test="codigo"]').text()).toBe('uid-ana')
    expect(wrapper.find('[data-test="equipo"]').exists()).toBe(false)
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('mientras carga no ofrece crear una empresa', () => {
    setCompany({ isLoading: true })
    const wrapper = mountView(CompanyView)

    expect(wrapper.text()).toContain('Cargando tu empresa')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('avisa si no puede cargar la empresa', () => {
    setCompany({ hasError: true })
    const wrapper = mountView(CompanyView)

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.find('form').exists()).toBe(false)
  })
})
