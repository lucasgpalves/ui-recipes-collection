import { describe, expect, it } from 'vitest'
import { isOwnRecipe, recipePreparationMinutes } from './ownership'

describe('isOwnRecipe', () => {
  it('usa userId quando disponível (API real)', () => {
    expect(
      isOwnRecipe({ userId: 42, userName: 'Marcos Lima' }, { userId: 42, username: 'cook' }),
    ).toBe(true)
    expect(
      isOwnRecipe({ userId: 42, userName: 'Marcos Lima' }, { userId: 99, username: 'cook' }),
    ).toBe(false)
  })

  it('faz fallback para username quando userId falta (demo)', () => {
    expect(
      isOwnRecipe({ userId: null, userName: 'cook' }, { userId: null, username: 'cook' }),
    ).toBe(true)
    expect(
      isOwnRecipe({ userName: 'cook' }, { userId: null, username: 'other' }),
    ).toBe(false)
  })
})

describe('recipePreparationMinutes', () => {
  it('prioriza preparationTime da API', () => {
    expect(recipePreparationMinutes({ preparationTime: 45, durationMinutes: 30 })).toBe(45)
  })

  it('usa durationMinutes da demo quando preparationTime ausente', () => {
    expect(recipePreparationMinutes({ durationMinutes: 55 })).toBe(55)
  })

  it('default 30', () => {
    expect(recipePreparationMinutes({})).toBe(30)
  })
})
