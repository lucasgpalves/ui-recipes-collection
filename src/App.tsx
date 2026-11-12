import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { PublicLayout } from './components/PublicLayout'
import { HomePage } from './pages/Home'
import { LoginPage } from './pages/Login'
import { RecipeDetailPage } from './pages/RecipeDetail'
import { SearchResultsPage } from './pages/SearchResults'

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
