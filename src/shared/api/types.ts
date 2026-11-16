export type RecipeSummary = {
  id: number | null
  userId?: number | null
  userName: string | null
  name: string | null
  categoryName: string | null
  /** Presente na demo; a API real pode omitir até expor mídia. */
  imageUrl?: string | null
  description?: string | null
  isPublished?: boolean | null
}

export type RecipeIngredient = {
  amount: number | null
  ingredientName: string | null
  measurementName: string | null
}

export type Recipe = {
  id: number | null
  userId?: number | null
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
  /** Tempo de preparo (API: preparationTime). */
  preparationTime?: number | null
  /** Presente na demo; a API real pode omitir até expor mídia/tempo. */
  imageUrl?: string | null
  /** Alias demo legado; preferir preparationTime. */
  durationMinutes?: number | null
}

/** Espelha RecipeIngredientsRequestDTO. */
export type RecipeIngredientRequest = {
  amount: number
  ingredientName: string
  measurementName: string
}

/** Espelha RecipeRequestDTO (JSON camelCase). */
export type RecipeRequest = {
  userId: number
  name: string
  categoryName: string
  preparationMethod: string
  portions: number
  preparationTime: number
  ingredientsRecipe: RecipeIngredientRequest[]
  description?: string | null
}

export type Category = {
  id: number
  name: string | null
  description: string | null
}

/** Espelha CategoryRequestDTO (JSON camelCase). */
export type CategoryRequest = {
  name: string
  description?: string | null
}

export type Review = {
  id?: number | null
  rating: number | null
  description: string | null
  userId: number | null
  recipeId: number | null
}

/** Espelha ReviewRequestDTO (JSON camelCase) — create. */
export type ReviewRequest = {
  rating: number
  description: string
  recipeId: number
}

/** Update de review: apenas rating + description (RN-REV-06). */
export type ReviewUpdateRequest = {
  rating: number
  description: string
}

export type LoginRequest = {
  username: string
  password: string
}

export type TokenResponse = {
  token: string | null
  role?: string | null
  userId?: number | null
  username?: string | null
}

/** Espelha AuthMeResponseDTO (sessão via cookie HttpOnly / Bearer). */
export type AuthMeResponse = {
  username: string | null
  role: string | null
  userId: number | null
}

/** Espelha RoleResponseDTO (JSON camelCase). `id` só no demo; a API real ainda não devolve. */
export type Role = {
  id?: number | null
  name: string | null
  description: string | null
}

/** Espelha RoleRequestDTO (JSON camelCase). */
export type RoleRequest = {
  name: string
  description?: string | null
}

/** Espelha GoalRequestDTO (JSON camelCase). */
export type GoalRequest = {
  title: string
  amount: number
  description?: string | null
  roleName: string
}

/** Espelha GoalResponseDTO (JSON camelCase). */
export type Goal = {
  id: number | null
  title: string | null
  amount: number
  description: string | null
  startsAt: string | null
  role: Role | null
}

/** Espelha GoalProgressResponse. */
export type GoalProgress = {
  userId: number | null
  target: number
  progress: number
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

/** Espelha RestaurantRequestDTO (JSON camelCase). */
export type RestaurantRequest = {
  name: string
  city: string
  address: string
  restaurantType: string
  cnpj?: string | null
  categoryId: number
}

/**
 * Espelha RestaurantResponseDTO.
 * `id` e `categoryId` existem no demo para edição; a API real ainda não devolve `id`.
 */
export type Restaurant = {
  id?: number | null
  name: string | null
  city: string | null
  address: string | null
  restaurantType: string | null
  cnpj: string | null
  categoryName: string | null
  categoryId?: number | null
}

/** Espelha UserSummaryResponseDTO. */
export type UserSummary = {
  name: string | null
  roleName: string | null
  fantasyName: string | null
}

/** Espelha JobReferenceRequestDTO (JSON camelCase). Datas em ISO `YYYY-MM-DD`. */
export type JobReferenceRequest = {
  restaurantName: string
  startsAt: string
  endsAt?: string | null
  contactNumber: string
  userId: number
}

/**
 * Espelha JobReferenceResponseDTO.
 * Datas na API vêm como `dd/MM/yyyy`. `id`/`userId` só no demo para edição.
 */
export type JobReference = {
  id?: number | null
  restaurantName: string | null
  startsAt: string | null
  endsAt: string | null
  contactNumber: string | null
  user: UserSummary | null
  userId?: number | null
}
