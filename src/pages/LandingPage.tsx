import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { trackEvent } from '../lib/tracking'

export default function LandingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    trackEvent('page_view', { page: 'landing' })
  }, [])

  const startQuiz = () => {
    trackEvent('quiz_cta_clicked', { source: 'landing' })
    navigate('/quiz')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="px-6 pt-16 pb-12 md:pt-24 md:pb-16 text-center max-w-3xl mx-auto">
        <p className="text-kraft-accent font-semibold text-sm uppercase tracking-wider mb-4">
          Für Väter, die mehr wollen als nur funktionieren
        </p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-kraft-dark leading-tight mb-6">
          Du gibst alles für deine Familie.
          <br />
          <span className="text-kraft-accent">Wer gibt dir Energie zurück?</span>
        </h1>
        <p className="text-lg md:text-xl text-kraft-muted max-w-2xl mx-auto mb-8">
          Finde in 2 Minuten heraus, welcher Energie-Typ du bist – und was du
          konkret tun kannst, um wieder mit voller Kraft da zu sein.
        </p>
        <button
          onClick={startQuiz}
          className="bg-kraft-accent hover:bg-red-600 text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
        >
          Jetzt Quiz starten →
        </button>
      </section>

      {/* Problem Mirroring */}
      <section className="bg-gray-50 px-6 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-kraft-dark text-center mb-10">
            Kommt dir das bekannt vor?
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              'Der Wecker klingelt – und du bist schon müde.',
              'Du funktionierst im Job, aber die Energie für die Kids fehlt abends.',
              'Sport? Wann denn. Zwischen Meetings und Abendritual ist keine Lücke.',
              "Du schläfst zu wenig, isst zu schnell und weißt: So geht's nicht weiter.",
              'Am Wochenende versuchst du aufzuholen – und bist Montag genauso platt.',
              'Du willst stark sein. Für deine Familie. Aber du spürst: Du läufst auf Reserve.',
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-sm"
              >
                <span className="text-kraft-accent text-xl mt-0.5">✗</span>
                <p className="text-kraft-dark">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Identifikation */}
      <section className="px-6 py-12 md:py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-kraft-dark mb-6">
            Wenn du dich hier wiedererkennst, bist du nicht allein.
          </h2>
          <p className="text-kraft-muted text-lg mb-4">
            Tausende Väter stehen jeden Tag vor der gleichen Frage: Wie soll ich
            für alle da sein, wenn ich selbst auf dem letzten Loch pfeife?
          </p>
          <p className="text-kraft-dark text-lg font-medium">
            Die Antwort ist nicht: noch mehr Disziplin.
            <br />
            Die Antwort ist: verstehen, wo du stehst – und den richtigen
            nächsten Schritt machen.
          </p>
        </div>
      </section>

      {/* Vertrauensblock */}
      <section className="bg-kraft-dark text-white px-6 py-12 md:py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Kein Guru-Gelaber. Kein Fitnessprogramm.
          </h2>
          <p className="text-gray-300 text-lg mb-4">
            Wir bauen eine Community für Männer, die im Alltag stehen – mit Job,
            Kindern und dem echten Leben. Keine unrealistischen Versprechen.
            Sondern echte Strategien für mehr Kraft, Fokus und Energie.
          </p>
          <p className="text-kraft-warm font-semibold text-lg">
            Alltagstauglich. Ehrlich. Auf Augenhöhe.
          </p>
        </div>
      </section>

      {/* Quiz Einführung + CTA */}
      <section className="px-6 py-12 md:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-kraft-dark mb-4">
            Finde heraus, welcher Energie-Typ du bist
          </h2>
          <p className="text-kraft-muted text-lg mb-3">
            6 ehrliche Fragen. 2 Minuten. Null Bullshit.
          </p>
          <p className="text-kraft-muted mb-8">
            Am Ende weißt du, wo du stehst – und bekommst eine klare
            Einschätzung, was dein nächster Schritt sein kann.
          </p>
          <button
            onClick={startQuiz}
            className="bg-kraft-accent hover:bg-red-600 text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            Quiz starten – kostenlos →
          </button>
          <p className="text-sm text-kraft-muted mt-4">
            Kein Login nötig. Kein Spam. Dein Ergebnis gehört dir.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-100 text-center">
        <p className="text-sm text-kraft-muted">
          © 2026 daddypower · Für Väter, die mehr wollen.
        </p>
      </footer>
    </div>
  )
}
