import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
  AdminCategoriesListPage,
  AdminCategoryCreatePage,
  AdminCategoryEditPage,
  AdminGoalCreatePage,
  AdminGoalEditPage,
  AdminGoalsListPage,
  AdminReferenceCreatePage,
  AdminReferenceEditPage,
  AdminReferencesListPage,
  AdminRestaurantCreatePage,
  AdminRestaurantEditPage,
  AdminRestaurantsListPage,
  AdminRoleCreatePage,
  AdminRoleEditPage,
  AdminRolesListPage,
  AdminUserCreatePage,
  AdminUserCredentialsPage,
  AdminUserEditPage,
  AdminUserProfilePage,
  AdminUserReferenceCreatePage,
  AdminUserReferenceEditPage,
  AdminUsersListPage,
  RequireAdmin,
} from '../features/admin'
import { AuthProvider, LoginPage } from '../features/auth'
import {
  CookRecipeCreatePage,
  CookRecipeEditPage,
  CookRecipesListPage,
  RequireCook,
} from '../features/cook'
import {
  EditorBookCreatePage,
  EditorBookDetailPage,
  EditorBooksListPage,
  EditorEditorialPage,
  EditorIngredientAliasesPage,
  EditorIngredientsListPage,
  EditorIngredientsMergePage,
  RequireEditor,
  RequireEditorOrAdmin,
} from '../features/editor'
import { RecipeDetailPage, SearchResultsPage } from '../features/recipes'
import { ThemeProvider } from '../shared/theme'
import { ConfirmProvider } from '../shared/ui/confirm'
import { NotifyProvider } from '../shared/ui/notify'
import { AdminLayout } from './layout/AdminLayout'
import { CookLayout } from './layout/CookLayout'
import { EditorLayout } from './layout/EditorLayout'
import { PublicLayout } from './layout/PublicLayout'
import { HomePage } from './pages/Home'

export default function App() {
  return (
    <ThemeProvider>
      <NotifyProvider>
        <ConfirmProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<RequireAdmin />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="usuarios" replace />} />
                    <Route path="usuarios" element={<AdminUsersListPage />} />
                    <Route path="usuarios/novo" element={<AdminUserCreatePage />} />
                    <Route path="usuarios/:id" element={<AdminUserProfilePage />} />
                    <Route path="usuarios/:id/editar" element={<AdminUserEditPage />} />
                    <Route path="usuarios/:id/credenciais" element={<AdminUserCredentialsPage />} />
                    <Route
                      path="usuarios/:id/referencias/nova"
                      element={<AdminUserReferenceCreatePage />}
                    />
                    <Route
                      path="usuarios/:id/referencias/:referenceId/editar"
                      element={<AdminUserReferenceEditPage />}
                    />
                    <Route path="categorias" element={<AdminCategoriesListPage />} />
                    <Route path="categorias/nova" element={<AdminCategoryCreatePage />} />
                    <Route path="categorias/:id/editar" element={<AdminCategoryEditPage />} />
                    <Route path="papeis" element={<AdminRolesListPage />} />
                    <Route path="papeis/novo" element={<AdminRoleCreatePage />} />
                    <Route path="papeis/:id/editar" element={<AdminRoleEditPage />} />
                    <Route path="metas" element={<AdminGoalsListPage />} />
                    <Route path="metas/nova" element={<AdminGoalCreatePage />} />
                    <Route path="metas/:id/editar" element={<AdminGoalEditPage />} />
                    <Route path="restaurantes" element={<AdminRestaurantsListPage />} />
                    <Route path="restaurantes/novo" element={<AdminRestaurantCreatePage />} />
                    <Route path="restaurantes/:id/editar" element={<AdminRestaurantEditPage />} />
                    <Route path="referencias" element={<AdminReferencesListPage />} />
                    <Route path="referencias/nova" element={<AdminReferenceCreatePage />} />
                    <Route path="referencias/:id/editar" element={<AdminReferenceEditPage />} />
                  </Route>
                </Route>
                <Route element={<RequireCook />}>
                  <Route path="/cook" element={<CookLayout />}>
                    <Route index element={<Navigate to="receitas" replace />} />
                    <Route path="receitas" element={<CookRecipesListPage />} />
                    <Route path="receitas/nova" element={<CookRecipeCreatePage />} />
                    <Route path="receitas/:id/editar" element={<CookRecipeEditPage />} />
                  </Route>
                </Route>
                <Route element={<RequireEditor />}>
                  <Route path="/editor" element={<EditorLayout />}>
                    <Route index element={<Navigate to="ingredientes" replace />} />
                    <Route path="ingredientes" element={<EditorIngredientsListPage />} />
                    <Route path="ingredientes/merge" element={<EditorIngredientsMergePage />} />
                    <Route
                      path="ingredientes/:id/aliases"
                      element={<EditorIngredientAliasesPage />}
                    />
                    <Route path="livros" element={<EditorBooksListPage />} />
                    <Route path="livros/novo" element={<EditorBookCreatePage />} />
                    <Route path="livros/:id" element={<EditorBookDetailPage />} />
                  </Route>
                </Route>
                <Route element={<RequireEditorOrAdmin />}>
                  <Route path="/editor" element={<EditorLayout />}>
                    <Route path="receitas" element={<EditorEditorialPage />} />
                  </Route>
                </Route>
                <Route element={<PublicLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="receitas" element={<SearchResultsPage />} />
                  <Route path="receitas/:id" element={<RecipeDetailPage />} />
                  <Route path="categorias/:name" element={<SearchResultsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ConfirmProvider>
      </NotifyProvider>
    </ThemeProvider>
  )
}
