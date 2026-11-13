import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, LoginPage } from '../features/auth'
import { RecipeDetailPage, SearchResultsPage } from '../features/recipes'
import { PublicLayout } from './layout/PublicLayout'
import { HomePage } from './pages/Home'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
