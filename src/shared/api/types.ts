export type RecipeSummary = {
  id: number | null
  userName: string | null
  name: string | null
  categoryName: string | null
  /** Presente na demo; a API real pode omitir até expor mídia. */
  imageUrl?: string | null
  description?: string | null
}

export type RecipeIngredient = {
  amount: number | null
  ingredientName: string | null
  measurementName: string | null
}

export type Recipe = {
  id: number | null
  userName: string | null
  name: string | null
  categoryName: string | null
  createdAt: string | null
  preparationMethod: string | null
  portions: number | null
  ingredients: RecipeIngredient[]
  description: string | null
  isPublished: boolean | null
  isRated: boolean | null
  /** Presente na demo; a API real pode omitir até expor mídia/tempo. */
  imageUrl?: string | null
  durationMinutes?: number | null
}

export type Category = {
  id: number
  name: string | null
  description: string | null
}

export type Review = {
  rating: number | null
  description: string | null
  userId: number | null
  recipeId: number | null
}

export type LoginRequest = {
  username: string
  password: string
}

export type TokenResponse = {
  token: string | null
}

/** Espelha RoleResponseDTO (JSON camelCase). */
export type Role = {
  name: string | null
  description: string | null
}

/** Espelha UserRequestDTO (JSON camelCase). */
export type UserRequest = {
  cpf: string
  name: string
  roleName: string
  salary: number
  fantasyName?: string | null
  restaurantName?: string | null
}

/**
 * Espelha UserResponseDTO.
 * `id` existe no demo para listagem; a API real ainda não devolve.
 */
export type UserResponse = {
  id?: number | null
  cpf: string | null
  name: string | null
  roleName: string | null
  salary: number | null
  ingressedAt: string | null
  terminatedAt: string | null
  fantasyName: string | null
}

/** Espelha RegisterRequestDTO — tipado para o próximo corte. */
export type RegisterRequest = {
  username: string
  password: string
  userId: number
}
