import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import QuizPage from './pages/QuizPage'
import ResultPage from './pages/ResultPage'
import ThankYouPage from './pages/ThankYouPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/ergebnis" element={<ResultPage />} />
        <Route path="/willkommen" element={<ThankYouPage />} />
      </Routes>
    </BrowserRouter>
  )
}
