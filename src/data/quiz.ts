// =============================================
// Quiz-Daten: Fragen, Antworten, Ergebnistypen
// Leicht erweiterbar – einfach Fragen/Typen anpassen
// =============================================

export interface QuizOption {
  id: string
  text: string
  // Punkte pro Ergebnistyp
  scores: Record<ResultTypeId, number>
}

export interface QuizQuestion {
  id: string
  question: string
  options: QuizOption[]
}

export type ResultTypeId = 'erschoepft' | 'funktionierer' | 'kaempfer' | 'performer'

export interface ResultType {
  id: ResultTypeId
  title: string
  subtitle: string
  description: string
  strengths: string[]
  risks: string[]
  nextStep: string
}

// ---- ERGEBNISTYPEN ----

export const resultTypes: Record<ResultTypeId, ResultType> = {
  erschoepft: {
    id: 'erschoepft',
    title: 'Der Leere Akku',
    subtitle: 'Du gibst mehr, als du hast.',
    description:
      'Du bist ständig müde, aber hörst nicht auf. Du funktionierst – irgendwie. Aber dein Körper sendet schon länger Signale, die du übergehst. Der Kaffee hält dich am Laufen, echte Energie fehlt seit Monaten.',
    strengths: [
      'Du bist extrem belastbar',
      'Du lässt deine Familie nie im Stich',
      'Du hast einen eisernen Willen',
    ],
    risks: [
      'Chronische Erschöpfung wird zur Gewohnheit',
      'Dein Körper wird irgendwann die Rechnung schicken',
      'Du verlierst den Zugang zu dem, was dir guttut',
    ],
    nextStep:
      'Du brauchst keine neue Disziplin. Du brauchst eine echte Grundlage – einen Reset, der dich wieder spüren lässt, was Energie wirklich bedeutet.',
  },
  funktionierer: {
    id: 'funktionierer',
    title: 'Der Funktionierer',
    subtitle: 'Es läuft – aber es fühlt sich nicht mehr gut an.',
    description:
      'Von außen sieht alles stabil aus: Job, Familie, Alltag. Aber innerlich spürst du, dass du nur noch abarbeitest. Die Freude fehlt. Die Leichtigkeit ist weg. Du fragst dich manchmal: War das schon alles?',
    strengths: [
      'Du bist verlässlich und strukturiert',
      'Du bekommst alles geregelt',
      'Dein Umfeld kann sich auf dich verlassen',
    ],
    risks: [
      'Funktionieren wird zum Autopilot',
      'Innerliche Leere trotz vollem Kalender',
      'Der Frust baut sich leise auf',
    ],
    nextStep:
      'Du brauchst keinen komplizierten Plan. Du brauchst den Moment, in dem du wieder merkst: Ich mach das hier für mich – nicht nur, weil es jemand erwartet.',
  },
  kaempfer: {
    id: 'kaempfer',
    title: 'Der stille Kämpfer',
    subtitle: 'Du trägst mehr, als andere sehen.',
    description:
      'Du schluckst viel runter. Du willst stark sein – für deine Familie, deinen Job, für alle. Aber du merkst, dass du an Grenzen kommst. Nicht, weil du schwach bist. Sondern weil niemand endlos geben kann, ohne aufzutanken.',
    strengths: [
      'Du stellst andere vor dich selbst',
      'Du hast eine enorme innere Stärke',
      'Du bist der Fels für dein Umfeld',
    ],
    risks: [
      'Du vergisst, dass auch du Unterstützung brauchst',
      'Stärke zeigen wird zum Zwang',
      'Irgendwann bricht der Fels',
    ],
    nextStep:
      'Stark sein heißt nicht, alles allein zu tragen. Der nächste Schritt ist nicht Schwäche – sondern der klügste Move, den du machen kannst: Hol dir Rückenwind.',
  },
  performer: {
    id: 'performer',
    title: 'Der Performer auf Reserve',
    subtitle: 'Du gibst Vollgas – aber der Tank ist nicht voll.',
    description:
      'Du hast Ehrgeiz, du lieferst ab. Im Job, beim Sport, in der Familie. Aber du merkst: Die Regeneration kommt zu kurz. Du pushst dich durch, aber die Recovery fehlt. Langfristig geht diese Rechnung nicht auf.',
    strengths: [
      'Du bist ehrgeizig und leistungsorientiert',
      'Du weißt, was du willst',
      'Du hast Disziplin und Antrieb',
    ],
    risks: [
      'Übertraining ohne echte Erholung',
      'Leistung sinkt trotz mehr Einsatz',
      'Burnout-Gefahr durch Dauerbelastung',
    ],
    nextStep:
      'Du brauchst keine Motivation. Du brauchst ein System, das deine Energie intelligent managt – damit dein Drive nachhaltig bleibt.',
  },
}

// ---- QUIZ-FRAGEN ----

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'Wie fühlst du dich morgens, wenn der Wecker klingelt?',
    options: [
      {
        id: 'q1a',
        text: 'Erschlagen. Ich könnte direkt weiterschlafen.',
        scores: { erschoepft: 3, funktionierer: 1, kaempfer: 1, performer: 0 },
      },
      {
        id: 'q1b',
        text: 'Okay, aber ohne echte Energie. Autopilot an.',
        scores: { erschoepft: 1, funktionierer: 3, kaempfer: 1, performer: 0 },
      },
      {
        id: 'q1c',
        text: 'Ich stehe auf, weil ich muss. Nicht weil ich will.',
        scores: { erschoepft: 1, funktionierer: 1, kaempfer: 3, performer: 0 },
      },
      {
        id: 'q1d',
        text: 'Wach, aber irgendwie nie richtig erholt.',
        scores: { erschoepft: 0, funktionierer: 1, kaempfer: 0, performer: 3 },
      },
    ],
  },
  {
    id: 'q2',
    question: 'Was beschreibt deinen typischen Abend am besten?',
    options: [
      {
        id: 'q2a',
        text: 'Couch, Netflix, einschlafen – keine Energie für mehr.',
        scores: { erschoepft: 3, funktionierer: 1, kaempfer: 0, performer: 0 },
      },
      {
        id: 'q2b',
        text: 'Ich erledige noch Dinge, obwohl ich eigentlich fertig bin.',
        scores: { erschoepft: 0, funktionierer: 3, kaempfer: 1, performer: 1 },
      },
      {
        id: 'q2c',
        text: 'Ich versuche, für alle da zu sein – und vergesse mich selbst.',
        scores: { erschoepft: 1, funktionierer: 0, kaempfer: 3, performer: 0 },
      },
      {
        id: 'q2d',
        text: 'Ich trainiere oder arbeite noch – Abschalten fällt mir schwer.',
        scores: { erschoepft: 0, funktionierer: 0, kaempfer: 1, performer: 3 },
      },
    ],
  },
  {
    id: 'q3',
    question: 'Wie gehst du mit Stress um?',
    options: [
      {
        id: 'q3a',
        text: 'Ich halte durch, bis nichts mehr geht.',
        scores: { erschoepft: 3, funktionierer: 1, kaempfer: 1, performer: 0 },
      },
      {
        id: 'q3b',
        text: 'Ich mach einfach weiter – wie immer.',
        scores: { erschoepft: 0, funktionierer: 3, kaempfer: 1, performer: 1 },
      },
      {
        id: 'q3c',
        text: "Ich rede nicht drüber. Ich schluck's runter.",
        scores: { erschoepft: 1, funktionierer: 0, kaempfer: 3, performer: 0 },
      },
      {
        id: 'q3d',
        text: 'Ich versuche, noch härter zu pushen.',
        scores: { erschoepft: 0, funktionierer: 0, kaempfer: 0, performer: 3 },
      },
    ],
  },
  {
    id: 'q4',
    question: 'Wann hast du zuletzt etwas nur für dich getan?',
    options: [
      {
        id: 'q4a',
        text: 'Kann mich nicht erinnern. Ist ewig her.',
        scores: { erschoepft: 3, funktionierer: 1, kaempfer: 1, performer: 0 },
      },
      {
        id: 'q4b',
        text: 'Ab und zu, aber es fühlt sich fast egoistisch an.',
        scores: { erschoepft: 0, funktionierer: 1, kaempfer: 3, performer: 0 },
      },
      {
        id: 'q4c',
        text: 'Ich schiebe es immer auf – die Liste ist zu lang.',
        scores: { erschoepft: 1, funktionierer: 3, kaempfer: 0, performer: 1 },
      },
      {
        id: 'q4d',
        text: 'Regelmäßig, aber selbst das fühlt sich nach Leistung an.',
        scores: { erschoepft: 0, funktionierer: 0, kaempfer: 0, performer: 3 },
      },
    ],
  },
  {
    id: 'q5',
    question: 'Was wünschst du dir am meisten?',
    options: [
      {
        id: 'q5a',
        text: 'Einfach mal wieder Energie haben. Richtig wach sein.',
        scores: { erschoepft: 3, funktionierer: 1, kaempfer: 0, performer: 0 },
      },
      {
        id: 'q5b',
        text: 'Dass sich der Alltag nicht mehr nur nach Pflicht anfühlt.',
        scores: { erschoepft: 0, funktionierer: 3, kaempfer: 1, performer: 0 },
      },
      {
        id: 'q5c',
        text: 'Dass jemand versteht, wie viel ich trage.',
        scores: { erschoepft: 1, funktionierer: 0, kaempfer: 3, performer: 0 },
      },
      {
        id: 'q5d',
        text: 'Nachhaltige Performance – ohne auszubrennen.',
        scores: { erschoepft: 0, funktionierer: 0, kaempfer: 0, performer: 3 },
      },
    ],
  },
  {
    id: 'q6',
    question: 'Was trifft auf dein Verhältnis zu Sport & Bewegung zu?',
    options: [
      {
        id: 'q6a',
        text: "Ich schaff's kaum noch. Keine Zeit, keine Kraft.",
        scores: { erschoepft: 3, funktionierer: 1, kaempfer: 1, performer: 0 },
      },
      {
        id: 'q6b',
        text: 'Ab und zu, aber es fehlt die Regelmäßigkeit.',
        scores: { erschoepft: 1, funktionierer: 3, kaempfer: 0, performer: 0 },
      },
      {
        id: 'q6c',
        text: 'Ich bewege mich – aber eher für die Familie als für mich.',
        scores: { erschoepft: 0, funktionierer: 0, kaempfer: 3, performer: 1 },
      },
      {
        id: 'q6d',
        text: 'Ich trainiere viel, aber die Ergebnisse stagnieren.',
        scores: { erschoepft: 0, funktionierer: 0, kaempfer: 0, performer: 3 },
      },
    ],
  },
]

// ---- SCORING ----

export function calculateResult(answers: Record<string, string>): ResultTypeId {
  const scores: Record<ResultTypeId, number> = {
    erschoepft: 0,
    funktionierer: 0,
    kaempfer: 0,
    performer: 0,
  }

  for (const question of quizQuestions) {
    const selectedOptionId = answers[question.id]
    const option = question.options.find((o) => o.id === selectedOptionId)
    if (option) {
      for (const [type, score] of Object.entries(option.scores)) {
        scores[type as ResultTypeId] += score
      }
    }
  }

  // Höchste Punktzahl gewinnt
  let best: ResultTypeId = 'erschoepft'
  for (const [type, score] of Object.entries(scores)) {
    if (score > scores[best]) {
      best = type as ResultTypeId
    }
  }
  return best
}
