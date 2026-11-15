import type { Recipe } from '../../../../shared/api/types'

type Actor = {
  userId: number | null
  username: string | null
}

/** Preferência: userId (BUG-07). Fallback: username vs userName (demo legado). */
export function isOwnRecipe(recipe: Pick<Recipe, 'userId' | 'userName'>, actor: Actor): boolean {
  if (actor.userId != null && recipe.userId != null) {
    return recipe.userId === actor.userId
  }
  if (!actor.username) return false
  return (recipe.userName ?? '').toLowerCase() === actor.username.trim().toLowerCase()
}

export function recipePreparationMinutes(recipe: Pick<Recipe, 'preparationTime' | 'durationMinutes'>): number {
  if (typeof recipe.preparationTime === 'number' && Number.isFinite(recipe.preparationTime)) {
    return recipe.preparationTime
  }
  if (typeof recipe.durationMinutes === 'number' && Number.isFinite(recipe.durationMinutes)) {
    return recipe.durationMinutes
  }
  return 30
}
