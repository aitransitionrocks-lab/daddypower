import type { Translations } from './types'

export const en: Translations = {
  langSwitch: 'DE',
  footer: '© 2026 daddypower · For dads who want more.',

  landing: {
    badge: 'For dads who want more than just getting by',
    headline: 'You give everything for your family.',
    headlineAccent: 'Who gives you energy back?',
    subheadline:
      'Find out in 2 minutes which energy type you are – and what you can do to show up with full power again.',
    ctaPrimary: 'Start the quiz →',
    problemTitle: 'Does this sound familiar?',
    problems: [
      'The alarm goes off – and you already feel exhausted.',
      "You function at work, but there's no energy left for the kids in the evening.",
      "Exercise? When? There's no gap between meetings and bedtime routines.",
      "You sleep too little, eat too fast, and know: this can't go on.",
      "You try to catch up on weekends – and feel just as drained on Monday.",
      "You want to be strong. For your family. But you feel: you're running on empty.",
    ],
    identTitle: "If you see yourself here, you're not alone.",
    identText1:
      "Thousands of dads face the same question every day: How can I be there for everyone when I'm running on fumes?",
    identText2:
      "The answer isn't more discipline. The answer is: understand where you stand – and take the right next step.",
    trustTitle: 'No guru talk. No fitness program.',
    trustText:
      "We're building a community for men who are in the thick of it – with jobs, kids, and real life. No unrealistic promises. Just real strategies for more strength, focus, and energy.",
    trustHighlight: 'Practical. Honest. Eye to eye.',
    quizIntroTitle: 'Find out which energy type you are',
    quizIntroSub: '6 honest questions. 2 minutes. Zero BS.',
    quizIntroText:
      "At the end, you'll know where you stand – and get a clear assessment of what your next step could be.",
    ctaSecondary: 'Start quiz – free →',
    ctaNote: 'No login required. No spam. Your result belongs to you.',
  },

  quiz: {
    questionOf: 'Question {n} of {total}',
    back: '← Back',
    questions: [
      {
        id: 'q1',
        question: 'How do you feel in the morning when the alarm goes off?',
        options: [
          { id: 'q1a', text: 'Wrecked. I could just keep sleeping.' },
          { id: 'q1b', text: 'Okay, but no real energy. Autopilot on.' },
          { id: 'q1c', text: "I get up because I have to. Not because I want to." },
          { id: 'q1d', text: 'Awake, but somehow never truly rested.' },
        ],
      },
      {
        id: 'q2',
        question: 'What best describes your typical evening?',
        options: [
          { id: 'q2a', text: 'Couch, Netflix, fall asleep – no energy for more.' },
          { id: 'q2b', text: "I still get things done, even though I'm spent." },
          { id: 'q2c', text: 'I try to be there for everyone – and forget about myself.' },
          { id: 'q2d', text: "I still train or work – switching off is hard for me." },
        ],
      },
      {
        id: 'q3',
        question: 'How do you handle stress?',
        options: [
          { id: 'q3a', text: "I push through until I can't anymore." },
          { id: 'q3b', text: 'I just keep going – like always.' },
          { id: 'q3c', text: "I don't talk about it. I swallow it." },
          { id: 'q3d', text: 'I try to push even harder.' },
        ],
      },
      {
        id: 'q4',
        question: 'When was the last time you did something just for yourself?',
        options: [
          { id: 'q4a', text: "Can't remember. It's been ages." },
          { id: 'q4b', text: 'Sometimes, but it almost feels selfish.' },
          { id: 'q4c', text: 'I keep postponing it – the list is too long.' },
          { id: 'q4d', text: 'Regularly, but even that feels like a performance.' },
        ],
      },
      {
        id: 'q5',
        question: 'What do you wish for most?',
        options: [
          { id: 'q5a', text: 'Just having energy again. Actually feeling awake.' },
          { id: 'q5b', text: "That daily life doesn't just feel like duty anymore." },
          { id: 'q5c', text: 'That someone understands how much I carry.' },
          { id: 'q5d', text: 'Sustainable performance – without burning out.' },
        ],
      },
      {
        id: 'q6',
        question: 'What applies to your relationship with sports & exercise?',
        options: [
          { id: 'q6a', text: "I barely manage. No time, no energy." },
          { id: 'q6b', text: "Now and then, but consistency is missing." },
          { id: 'q6c', text: 'I move – but more for the family than for myself.' },
          { id: 'q6d', text: "I train a lot, but results are stagnating." },
        ],
      },
    ],
  },

  results: {
    badge: 'Your Result',
    videoPlaceholder: 'Video coming soon – tailored to your type.',
    strengthsTitle: 'Your Strengths',
    risksTitle: 'Your Risks',
    ctaCommunity: 'Join the community now →',
    formTitle: 'Your spot in the community',
    formText:
      "Sign up – you'll get instant access to our WhatsApp group and be there from the start when the first challenge launches.",
    labelFirstName: 'First name',
    labelEmail: 'Email',
    optional: '(optional)',
    placeholderName: 'Your first name',
    placeholderEmail: 'your@email.com',
    consent:
      'I agree that my data will be stored to inform me about the community and challenge launch. No spam, unsubscribe anytime.',
    submit: 'Sign up & join community →',
    submitting: 'Signing up...',
    note: 'Free. No subscription. No spam.',
    errorRequired: 'Please enter your email and confirm the privacy policy.',
    errorGeneric: 'Something went wrong. Please try again.',
    types: {
      leerer_akku: {
        title: 'The Empty Battery',
        subtitle: "You give more than you've got.",
        description:
          "You're constantly tired but you don't stop. You function – somehow. But your body has been sending signals for a while that you ignore. Coffee keeps you going, real energy has been missing for months.",
        strengths: [
          "You're extremely resilient",
          'You never let your family down',
          'You have an iron will',
        ],
        risks: [
          'Chronic exhaustion becomes the norm',
          'Your body will present the bill eventually',
          'You lose touch with what truly energizes you',
        ],
        nextStep:
          "You don't need more discipline. You need a real foundation – a reset that lets you feel what energy truly means again.",
      },
      funktionierer: {
        title: 'The Operator',
        subtitle: "It runs – but it doesn't feel good anymore.",
        description:
          "From the outside, everything looks stable: job, family, daily life. But inside, you feel like you're just checking boxes. The joy is gone. The ease is gone. Sometimes you wonder: Is this all there is?",
        strengths: [
          "You're reliable and structured",
          'You get everything handled',
          'Your people can count on you',
        ],
        risks: [
          'Operating becomes autopilot',
          'Inner emptiness despite a full calendar',
          'Frustration builds silently',
        ],
        nextStep:
          "You don't need a complicated plan. You need the moment when you realize: I'm doing this for me – not just because someone expects it.",
      },
      stiller_kaempfer: {
        title: 'The Silent Fighter',
        subtitle: 'You carry more than others see.',
        description:
          "You swallow a lot. You want to be strong – for your family, your job, for everyone. But you notice you're hitting limits. Not because you're weak. But because nobody can give endlessly without refueling.",
        strengths: [
          'You put others before yourself',
          'You have enormous inner strength',
          "You're the rock for those around you",
        ],
        risks: [
          'You forget that you need support too',
          'Showing strength becomes compulsory',
          'Eventually the rock breaks',
        ],
        nextStep:
          "Being strong doesn't mean carrying everything alone. The next step isn't weakness – it's the smartest move you can make: get some tailwind.",
      },
      performer_auf_reserve: {
        title: 'The Performer on Reserve',
        subtitle: "You're going full throttle – but the tank isn't full.",
        description:
          "You have ambition, you deliver. At work, in sports, in the family. But you notice: recovery falls short. You push through, but the recovery is missing. Long-term, this equation doesn't add up.",
        strengths: [
          "You're ambitious and performance-driven",
          'You know what you want',
          'You have discipline and drive',
        ],
        risks: [
          'Overtraining without real recovery',
          'Performance drops despite more effort',
          'Burnout risk from constant strain',
        ],
        nextStep:
          "You don't need motivation. You need a system that manages your energy intelligently – so your drive stays sustainable.",
      },
    },
  },

  welcome: {
    title: "You're in!",
    titleWithName: 'Welcome, {name}!',
    subtitle: "Your spot is secured. Just one more step.",
    energyType: 'Your Energy Type',
    whatsappTitle: 'Join the community now',
    whatsappText:
      "In our WhatsApp group, you'll meet other dads who want more than just getting by. Exchange, motivation, and first challenge info – straight to your phone.",
    whatsappButton: 'Join WhatsApp group',
    stepsTitle: 'What happens now?',
    steps: [
      "Join the WhatsApp group – that's where the exchange happens.",
      "You'll get an email with your result and first impulses.",
      "As soon as the first challenge launches, you'll be first in line.",
    ],
    footer: "Questions? Write us anytime. We're real humans, not a bot.",
  },

  checkIn: {
    title: 'Daily Check-in',
    subtitle: 'How are you today? 30 seconds is all it takes.',
    energyLevel: 'Energy Level',
    moodScore: 'Mood',
    sleepHours: 'Sleep (hours)',
    stressLevel: 'Stress Level',
    notes: 'Notes',
    notesPlaceholder: 'How was your day? (optional)',
    submit: 'Save check-in',
    submitting: 'Saving...',
    successTitle: 'Check-in saved!',
    successMessage: 'Well done. Keep it up!',
    streakLabel: 'Your Streak',
    streakDays: '{count} days in a row',
    alreadyCheckedIn: 'You already checked in today. You can update your values.',
    updateButton: 'Update check-in',
    energyLow: 'Exhausted',
    energyHigh: 'Full power',
    moodLow: 'Bad',
    moodHigh: 'Great',
    stressLow: 'Relaxed',
    stressHigh: 'Very stressed',
    sleepPlaceholder: 'e.g. 6.5',
    errorGeneric: 'Something went wrong. Please try again.',
  },

  partner: {
    title: 'Partner Dashboard',
    subtitle: 'Your network at a glance.',
    statusLabel: 'Status',
    levelLabel: 'Level',
    displayNameLabel: 'Display Name',
    downlineTitle: 'Your Downline',
    downlineCount: '{count} direct partners',
    inviteTokensTitle: 'Invite Links',
    noTokens: 'No invite links created yet.',
    createInviteButton: 'Create new invite link',
    copyLink: 'Copy link',
    copied: 'Copied!',
    tokenExpires: 'Valid until {date}',
    tokenUsed: 'Already used',
    challengesTitle: 'Your Challenges',
    noChallenges: 'You have not created any challenges yet.',
    notPartnerTitle: 'You are not a partner yet',
    notPartnerMessage: 'You do not have partner status yet. Contact us to become a partner.',
    errorGeneric: 'Something went wrong. Please try again.',
  },

  invite: {
    title: 'You have been invited!',
    subtitle: 'Join the daddypower community.',
    invitedBy: 'Invited by {name}',
    ctaSignup: 'Sign up for free',
    invalidTitle: 'Invalid Invitation',
    invalidMessage: 'This invite link is invalid or has expired.',
    loadingMessage: 'Verifying invitation...',
    errorGeneric: 'Something went wrong. Please try again.',
  },

  workouts: {
    title: 'Workout Library',
    filterType: 'Type',
    filterDuration: 'Duration',
    filterDifficulty: 'Difficulty',
    all: 'All',
    minutes: 'min',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    noEquipment: 'No equipment',
    completeWorkout: 'Workout completed',
    completed: 'Done!',
    exercises: 'Exercises',
    sets: 'Sets',
    reps: 'Reps',
    rest: 'Rest',
    empty: 'No workouts available yet.',
    back: '← Back',
  },

  challenges: {
    title: 'Challenges',
    days: 'Days',
    enroll: 'Start challenge',
    enrolled: 'Enrolled',
    active: 'Active',
    completedLabel: 'Completed',
    completeDay: 'Complete day',
    dayOf: 'Day {n} of {total}',
    restDay: 'Rest day',
    progress: 'Progress',
    empty: 'No challenges available yet.',
    allCompleted: 'All days completed! Strong!',
    back: '← Back',
  },

  admin: {
    loginTitle: 'Admin Login',
    email: 'Email',
    password: 'Password',
    loginButton: 'Log in',
    loggingIn: 'Logging in...',
    loginError: 'Login failed. Please check your credentials.',
    logout: 'Log out',
    dashboard: 'Dashboard',
    kpiLeadsTotal: 'Total Leads',
    kpiLeadsToday: 'Leads Today',
    kpiQuizCompleted: 'Quiz Completed',
    kpiConversion: 'Conversion Rate',
    leadsTable: 'Leads',
    videoManagement: 'Manage Videos',
    uploadVideo: 'Upload Video',
    deleteVideo: 'Delete',
    noVideo: 'No video',
    allTypes: 'All types',
    filterByType: 'Filter by type',
  },
}
