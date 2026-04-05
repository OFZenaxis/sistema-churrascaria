import { describe, it, expect } from 'vitest'
import { SLUG_REGEX, RESERVED_SLUGS } from '../lib/validation'

describe('SLUG_REGEX', () => {
  it('aceita slugs válidos', () => {
    expect(SLUG_REGEX.test('minha-pizzaria')).toBe(true)
    expect(SLUG_REGEX.test('burger123')).toBe(true)
    expect(SLUG_REGEX.test('a')).toBe(true)
    expect(SLUG_REGEX.test('abc-def-ghi')).toBe(true)
  })

  it('rejeita slugs com letras maiúsculas', () => {
    expect(SLUG_REGEX.test('Pizzaria')).toBe(false)
    expect(SLUG_REGEX.test('LOJA')).toBe(false)
  })

  it('rejeita slugs com espaços', () => {
    expect(SLUG_REGEX.test('minha pizzaria')).toBe(false)
  })

  it('rejeita slugs com caracteres especiais', () => {
    expect(SLUG_REGEX.test('loja@example')).toBe(false)
    expect(SLUG_REGEX.test('loja.com')).toBe(false)
    expect(SLUG_REGEX.test('loja_nome')).toBe(false)
  })

  it('rejeita slugs que começam ou terminam com hífen', () => {
    expect(SLUG_REGEX.test('-loja')).toBe(false)
    expect(SLUG_REGEX.test('loja-')).toBe(false)
    expect(SLUG_REGEX.test('-loja-')).toBe(false)
  })

  it('rejeita hifens consecutivos', () => {
    expect(SLUG_REGEX.test('loja--nome')).toBe(false)
  })
})

describe('RESERVED_SLUGS', () => {
  it('bloqueia slugs reservados da plataforma', () => {
    expect(RESERVED_SLUGS.has('admin')).toBe(true)
    expect(RESERVED_SLUGS.has('api')).toBe(true)
    expect(RESERVED_SLUGS.has('login')).toBe(true)
    expect(RESERVED_SLUGS.has('dashboard')).toBe(true)
    expect(RESERVED_SLUGS.has('saiu')).toBe(true)
    expect(RESERVED_SLUGS.has('webhook')).toBe(true)
  })

  it('permite slugs de clientes comuns', () => {
    expect(RESERVED_SLUGS.has('minha-pizzaria')).toBe(false)
    expect(RESERVED_SLUGS.has('burger-do-ze')).toBe(false)
    expect(RESERVED_SLUGS.has('churrascaria123')).toBe(false)
  })
})
