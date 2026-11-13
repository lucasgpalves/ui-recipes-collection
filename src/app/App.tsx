import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
  AdminCategoriesListPage,
  AdminCategoryCreatePage,
  AdminCategoryEditPage,
  AdminGoalCreatePage,
  AdminGoalEditPage,
  AdminGoalsListPage,
  AdminRoleCreatePage,
  AdminRoleEditPage,
  AdminRolesListPage,
  AdminUserCreatePage,
  AdminUserCredentialsPage,
  AdminUserEditPage,
  AdminUserProfilePage,
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
import { RecipeDetailPage, SearchResultsPage } from '../features/recipes'
import { ConfirmProvider } from '../shared/ui/confirm'
import { NotifyProvider } from '../shared/ui/notify'
import { AdminLayout } from './layout/AdminLayout'
import { CookLayout } from './layout/CookLayout'
import { PublicLayout } from './layout/PublicLayout'
import { HomePage } from './pages/Home'

export default function App() {
  return (
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
                  <Route path="categorias" element={<AdminCategoriesListPage />} />
                  <Route path="categorias/nova" element={<AdminCategoryCreatePage />} />
                  <Route path="categorias/:id/editar" element={<AdminCategoryEditPage />} />
                  <Route path="papeis" element={<AdminRolesListPage />} />
                  <Route path="papeis/novo" element={<AdminRoleCreatePage />} />
                  <Route path="papeis/:id/editar" element={<AdminRoleEditPage />} />
                  <Route path="metas" element={<AdminGoalsListPage />} />
                  <Route path="metas/nova" element={<AdminGoalCreatePage />} />
                  <Route path="metas/:id/editar" element={<AdminGoalEditPage />} />
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
  )
}
