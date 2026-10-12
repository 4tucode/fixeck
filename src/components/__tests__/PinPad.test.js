import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PinPad from '@/components/PinPad.vue'

vi.mock('@/utils/sounds', () => ({ playKeySound: vi.fn() }))

// Teclados montados en cada test; se desmontan al acabar para que dejen de escuchar el teclado físico
let mounted = []

function mountPad(props = {}) {
  const wrapper = mount(PinPad, { props })
  mounted.push(wrapper)
  return wrapper
}

// Pulsa en pantalla, una a una, las teclas indicadas ("482" pulsa el 4, el 8 y el 2)
async function tap(wrapper, keys) {
  for (const key of keys) {
    await wrapper.findAll('button').find((button) => button.text() === key).trigger('click')
  }
}

// Número de puntos rellenos (cifras tecleadas)
function filledDots(wrapper) {
  return wrapper.findAll('[role="status"] span').filter((dot) => dot.classes().includes('bg-alba-mid')).length
}

describe('PinPad', () => {
  afterEach(() => {
    mounted.forEach((wrapper) => wrapper.unmount())
    mounted = []
  })

  it('rellena un punto por cada cifra, sin enseñar los números', async () => {
    const wrapper = mountPad()

    await tap(wrapper, '48')

    expect(filledDots(wrapper)).toBe(2)
    expect(wrapper.find('[role="status"]').text()).toBe('')
    expect(wrapper.emitted('complete')).toBeUndefined()
  })

  it('con la cuarta cifra entrega el código y se vacía', async () => {
    const wrapper = mountPad()

    await tap(wrapper, '4821')

    expect(wrapper.emitted('complete')).toEqual([['4821']])
    expect(filledDots(wrapper)).toBe(0)
  })

  it('borra la última cifra', async () => {
    const wrapper = mountPad()

    await tap(wrapper, '48')
    await wrapper.find('[aria-label="Borrar"]').trigger('click')
    await tap(wrapper, '123')

    expect(wrapper.emitted('complete')).toEqual([['4123']])
  })

  it('acepta el teclado físico', async () => {
    const wrapper = mountPad()

    for (const key of ['0', '0', '4', 'x', 'Backspace', '4', '2']) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key }))
    }

    expect(wrapper.emitted('complete')).toEqual([['0042']])
  })

  it('desactivado no admite cifras', async () => {
    const wrapper = mountPad({ disabled: true })

    await tap(wrapper, '4821')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }))

    expect(filledDots(wrapper)).toBe(0)
    expect(wrapper.emitted('complete')).toBeUndefined()
  })
})
