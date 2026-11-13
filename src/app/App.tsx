import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
  AdminUserCreatePage,
  AdminUserEditPage,
  AdminUserProfilePage,
  AdminUsersListPage,
  RequireAdmin,
} from '../features/admin'
import { AuthProvider, LoginPage } from '../features/auth'
import { RecipeDetailPage, SearchResultsPage } from '../features/recipes'
import { AdminLayout } from './layout/AdminLayout'
import { PublicLayout } from './layout/PublicLayout'
import { HomePage } from './pages/Home'

export default function App() {
  return (
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
  )
}
