export interface Translations {
  // Global
  langSwitch: string
  footer: string

  // Landing
  landing: {
    badge: string
    headline: string
    headlineAccent: string
    subheadline: string
    ctaPrimary: string
    problemTitle: string
    problems: string[]
    identTitle: string
    identText1: string
    identText2: string
    trustTitle: string
    trustText: string
    trustHighlight: string
    quizIntroTitle: string
    quizIntroSub: string
    quizIntroText: string
    ctaSecondary: string
    ctaNote: string
  }

  // Quiz
  quiz: {
    questionOf: string // "Frage {n} von {total}"
    back: string
    questions: {
      id: string
      question: string
      options: { id: string; text: string }[]
    }[]
  }

  // Results
  results: {
    badge: string
    videoPlaceholder: string
    strengthsTitle: string
    risksTitle: string
    ctaCommunity: string
    formTitle: string
    formText: string
    labelFirstName: string
    labelEmail: string
    optional: string
    placeholderName: string
    placeholderEmail: string
    consent: string
    submit: string
    submitting: string
    note: string
    errorRequired: string
    errorGeneric: string
    types: Record<string, {
      title: string
      subtitle: string
      description: string
      strengths: string[]
      risks: string[]
      nextStep: string
    }>
  }

  // Welcome / ThankYou
  welcome: {
    title: string
    titleWithName: string
    subtitle: string
    energyType: string
    whatsappTitle: string
    whatsappText: string
    whatsappButton: string
    stepsTitle: string
    steps: string[]
    footer: string
  }

  // Admin
  admin: {
    loginTitle: string
    email: string
    password: string
    loginButton: string
    loggingIn: string
    loginError: string
    logout: string
    dashboard: string
    kpiLeadsTotal: string
    kpiLeadsToday: string
    kpiQuizCompleted: string
    kpiConversion: string
    leadsTable: string
    videoManagement: string
    uploadVideo: string
    deleteVideo: string
    noVideo: string
    allTypes: string
    filterByType: string
  }
}
