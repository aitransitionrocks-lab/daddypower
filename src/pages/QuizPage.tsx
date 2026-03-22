import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { quizQuestions } from '../data/quiz'
import { trackEvent } from '../lib/tracking'

export default function QuizPage() {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const total = quizQuestions.length
  const question = quizQuestions[currentIndex]
  const progress = ((currentIndex) / total) * 100

  useEffect(() => {
    trackEvent('quiz_started')
  }, [])

  const selectAnswer = (optionId: string) => {
    const updated = { ...answers, [question.id]: optionId }
    setAnswers(updated)

    trackEvent('quiz_answer', {
      question_id: question.id,
      option_id: optionId,
      step: currentIndex + 1,
    })

    if (currentIndex < total - 1) {
      // Kurze Verzögerung für visuelles Feedback
      setTimeout(() => setCurrentIndex(currentIndex + 1), 300)
    } else {
      // Quiz abgeschlossen
      trackEvent('quiz_completed', { answers: updated })
      // Antworten über State an die Ergebnis-Seite übergeben
      navigate('/ergebnis', { state: { answers: updated } })
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Progress Bar */}
      <div className="w-full bg-gray-100 h-2">
        <div
          className="bg-kraft-accent h-2 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="px-6 pt-8 pb-4 text-center">
        <p className="text-sm text-kraft-muted">
          Frage {currentIndex + 1} von {total}
        </p>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-12 max-w-2xl mx-auto w-full">
        <h2 className="text-2xl md:text-3xl font-bold text-kraft-dark text-center mb-8">
          {question.question}
        </h2>

        <div className="space-y-3">
          {question.options.map((option) => {
            const isSelected = answers[question.id] === option.id
            return (
              <button
                key={option.id}
                onClick={() => selectAnswer(option.id)}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-kraft-accent bg-red-50 text-kraft-dark'
                    : 'border-gray-200 hover:border-kraft-accent/50 text-kraft-dark'
                }`}
              >
                {option.text}
              </button>
            )
          })}
        </div>
      </div>

      {/* Back Button (ab Frage 2) */}
      {currentIndex > 0 && (
        <div className="px-6 pb-8 text-center">
          <button
            onClick={() => setCurrentIndex(currentIndex - 1)}
            className="text-kraft-muted hover:text-kraft-dark text-sm underline cursor-pointer"
          >
            ← Zurück
          </button>
        </div>
      )}
    </div>
  )
}
