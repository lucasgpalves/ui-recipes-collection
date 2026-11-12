export type RecipeSummary = {
  id: number | null
  userName: string | null
  name: string | null
  categoryName: string | null
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
