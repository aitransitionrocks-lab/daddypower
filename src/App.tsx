import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { I18nProvider } from './i18n'
import PrivateRoute from './components/PrivateRoute'
import LandingPage from './pages/LandingPage'
import QuizPage from './pages/QuizPage'
import ResultPage from './pages/ResultPage'
import ThankYouPage from './pages/ThankYouPage'
import LoginPage from './pages/LoginPage'
import UnsubscribePage from './pages/UnsubscribePage'

// Code-split protected routes
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-kraft-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/ergebnis" element={<ResultPage />} />
            <Route path="/willkommen" element={<ThankYouPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/abmelden" element={<UnsubscribePage />} />

            {/* Protected: Member */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />

            {/* Protected: Admin */}
            <Route
              path="/admin"
              element={
                <PrivateRoute requiredRoles={['super_admin', 'operator']}>
                  <AdminPage />
                </PrivateRoute>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </I18nProvider>
  )
}
