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
import InvitePage from './pages/InvitePage'

// Code-split protected routes
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const WorkoutsPage = lazy(() => import('./pages/WorkoutsPage'))
const WorkoutDetailPage = lazy(() => import('./pages/WorkoutDetailPage'))
const CheckInPage = lazy(() => import('./pages/CheckInPage'))
const ChallengesPage = lazy(() => import('./pages/ChallengesPage'))
const ChallengeDetailPage = lazy(() => import('./pages/ChallengeDetailPage'))
const PartnerDashboardPage = lazy(() => import('./pages/PartnerDashboardPage'))

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
            <Route path="/invite/:token" element={<InvitePage />} />

            {/* Protected: Member */}
            <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/workouts" element={<PrivateRoute><WorkoutsPage /></PrivateRoute>} />
            <Route path="/workouts/:id" element={<PrivateRoute><WorkoutDetailPage /></PrivateRoute>} />
            <Route path="/checkin" element={<PrivateRoute><CheckInPage /></PrivateRoute>} />
            <Route path="/challenges" element={<PrivateRoute><ChallengesPage /></PrivateRoute>} />
            <Route path="/challenges/:id" element={<PrivateRoute><ChallengeDetailPage /></PrivateRoute>} />

            {/* Protected: Partner */}
            <Route path="/partner" element={<PrivateRoute requiredRoles={['partner', 'super_admin', 'operator']}><PartnerDashboardPage /></PrivateRoute>} />

            {/* Protected: Admin */}
            <Route path="/admin" element={<PrivateRoute requiredRoles={['super_admin', 'operator']}><AdminPage /></PrivateRoute>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </I18nProvider>
  )
}
