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

  // Check-in
  checkIn: {
    title: string
    subtitle: string
    energyLevel: string
    moodScore: string
    sleepHours: string
    stressLevel: string
    notes: string
    notesPlaceholder: string
    submit: string
    submitting: string
    successTitle: string
    successMessage: string
    streakLabel: string
    streakDays: string
    alreadyCheckedIn: string
    updateButton: string
    energyLow: string
    energyHigh: string
    moodLow: string
    moodHigh: string
    stressLow: string
    stressHigh: string
    sleepPlaceholder: string
    errorGeneric: string
  }

  // Partner Dashboard
  partner: {
    title: string
    subtitle: string
    statusLabel: string
    levelLabel: string
    displayNameLabel: string
    downlineTitle: string
    downlineCount: string
    inviteTokensTitle: string
    noTokens: string
    createInviteButton: string
    copyLink: string
    copied: string
    tokenExpires: string
    tokenUsed: string
    challengesTitle: string
    noChallenges: string
    notPartnerTitle: string
    notPartnerMessage: string
    errorGeneric: string
  }

  // Invite
  invite: {
    title: string
    subtitle: string
    invitedBy: string
    ctaSignup: string
    invalidTitle: string
    invalidMessage: string
    loadingMessage: string
    errorGeneric: string
  }

  // Workouts
  workouts: {
    title: string
    filterType: string
    filterDuration: string
    filterDifficulty: string
    all: string
    minutes: string
    easy: string
    medium: string
    hard: string
    noEquipment: string
    completeWorkout: string
    completed: string
    exercises: string
    sets: string
    reps: string
    rest: string
    empty: string
    back: string
  }

  // Challenges
  challenges: {
    title: string
    days: string
    enroll: string
    enrolled: string
    active: string
    completedLabel: string
    completeDay: string
    dayOf: string
    restDay: string
    progress: string
    empty: string
    allCompleted: string
    back: string
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
