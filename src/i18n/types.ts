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

  // Partner Challenges
  partnerChallenges: {
    pageTitle: string
    pageSubtitle: string
    newChallenge: string
    newChallengeTitle: string
    newChallengeSubtitle: string
    statusWaiting: string
    statusActive: string
    statusPaused: string
    enrollments: string
    editButton: string
    statsButton: string
    deleteButton: string
    deleteConfirm: string
    noChallenges: string
    formTitleDe: string
    formTitleEn: string
    formDescriptionDe: string
    formDuration: string
    formDifficulty: string
    formTargetTypes: string
    formVisibility: string
    visibilityDirect: string
    visibilityDownline: string
    durationDays: string
    difficultyEasy: string
    difficultyMedium: string
    difficultyHard: string
    dayModuleTitle: string
    dayTitle: string
    dayTaskDescription: string
    dayRestToggle: string
    dayWorkoutSelect: string
    dayWorkoutNone: string
    saveChallenge: string
    saving: string
    savedSuccess: string
    errorMinDays: string
    errorDayTitle: string
    errorTitleLength: string
    errorTitleRequired: string
    errorGeneric: string
    statsTitle: string
    statsEnrollments: string
    statsAvgProgress: string
    statsCompletionRate: string
    statsDropouts: string
    backToList: string
    targetLeererAkku: string
    targetFunktionierer: string
    targetStillerKaempfer: string
    targetPerformerAufReserve: string
  }

  // Network
  network: {
    pageTitle: string
    backToPartner: string
    statTotal: string
    statActive: string
    statDirect: string
    statNewThisWeek: string
    maxDepthWarning: string
    emptyTree: string
    levelLabel: string
    statusActive: string
    statusSuspended: string
    statusPending: string
    showNetwork: string
  }

  // Token Manager
  tokenManager: {
    title: string
    createTitle: string
    labelField: string
    labelPlaceholder: string
    maxUsesField: string
    maxUsesPlaceholder: string
    expiryField: string
    createButton: string
    noTokens: string
    copyLink: string
    copied: string
    deactivate: string
    deleteToken: string
    usesLabel: string
    expiresLabel: string
    statusActive: string
    statusInactive: string
    statusExpired: string
    statusMaxUsed: string
    whatsappText: string
    errorGeneric: string
  }

  // License
  license: {
    title: string
    currentTier: string
    freeTier: string
    activeDownline: string
    progressText: string
    manageSubscription: string
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
