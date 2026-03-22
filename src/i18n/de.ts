import type { Translations } from './types'

export const de: Translations = {
  langSwitch: 'EN',
  footer: '© 2026 daddypower · Für Väter, die mehr wollen.',

  landing: {
    badge: 'Für Väter, die mehr wollen als nur funktionieren',
    headline: 'Du gibst alles für deine Familie.',
    headlineAccent: 'Wer gibt dir Energie zurück?',
    subheadline:
      'Finde in 2 Minuten heraus, welcher Energie-Typ du bist – und was du konkret tun kannst, um wieder mit voller Kraft da zu sein.',
    ctaPrimary: 'Jetzt Quiz starten →',
    problemTitle: 'Kommt dir das bekannt vor?',
    problems: [
      'Der Wecker klingelt – und du bist schon müde.',
      'Du funktionierst im Job, aber die Energie für die Kids fehlt abends.',
      'Sport? Wann denn. Zwischen Meetings und Abendritual ist keine Lücke.',
      "Du schläfst zu wenig, isst zu schnell und weißt: So geht's nicht weiter.",
      'Am Wochenende versuchst du aufzuholen – und bist Montag genauso platt.',
      'Du willst stark sein. Für deine Familie. Aber du spürst: Du läufst auf Reserve.',
    ],
    identTitle: 'Wenn du dich hier wiedererkennst, bist du nicht allein.',
    identText1:
      'Tausende Väter stehen jeden Tag vor der gleichen Frage: Wie soll ich für alle da sein, wenn ich selbst auf dem letzten Loch pfeife?',
    identText2:
      'Die Antwort ist nicht: noch mehr Disziplin. Die Antwort ist: verstehen, wo du stehst – und den richtigen nächsten Schritt machen.',
    trustTitle: 'Kein Guru-Gelaber. Kein Fitnessprogramm.',
    trustText:
      'Wir bauen eine Community für Männer, die im Alltag stehen – mit Job, Kindern und dem echten Leben. Keine unrealistischen Versprechen. Sondern echte Strategien für mehr Kraft, Fokus und Energie.',
    trustHighlight: 'Alltagstauglich. Ehrlich. Auf Augenhöhe.',
    quizIntroTitle: 'Finde heraus, welcher Energie-Typ du bist',
    quizIntroSub: '6 ehrliche Fragen. 2 Minuten. Null Bullshit.',
    quizIntroText:
      'Am Ende weißt du, wo du stehst – und bekommst eine klare Einschätzung, was dein nächster Schritt sein kann.',
    ctaSecondary: 'Quiz starten – kostenlos →',
    ctaNote: 'Kein Login nötig. Kein Spam. Dein Ergebnis gehört dir.',
  },

  quiz: {
    questionOf: 'Frage {n} von {total}',
    back: '← Zurück',
    questions: [
      {
        id: 'q1',
        question: 'Wie fühlst du dich morgens, wenn der Wecker klingelt?',
        options: [
          { id: 'q1a', text: 'Erschlagen. Ich könnte direkt weiterschlafen.' },
          { id: 'q1b', text: 'Okay, aber ohne echte Energie. Autopilot an.' },
          { id: 'q1c', text: 'Ich stehe auf, weil ich muss. Nicht weil ich will.' },
          { id: 'q1d', text: 'Wach, aber irgendwie nie richtig erholt.' },
        ],
      },
      {
        id: 'q2',
        question: 'Was beschreibt deinen typischen Abend am besten?',
        options: [
          { id: 'q2a', text: 'Couch, Netflix, einschlafen – keine Energie für mehr.' },
          { id: 'q2b', text: 'Ich erledige noch Dinge, obwohl ich eigentlich fertig bin.' },
          { id: 'q2c', text: 'Ich versuche, für alle da zu sein – und vergesse mich selbst.' },
          { id: 'q2d', text: 'Ich trainiere oder arbeite noch – Abschalten fällt mir schwer.' },
        ],
      },
      {
        id: 'q3',
        question: 'Wie gehst du mit Stress um?',
        options: [
          { id: 'q3a', text: 'Ich halte durch, bis nichts mehr geht.' },
          { id: 'q3b', text: 'Ich mach einfach weiter – wie immer.' },
          { id: 'q3c', text: "Ich rede nicht drüber. Ich schluck's runter." },
          { id: 'q3d', text: 'Ich versuche, noch härter zu pushen.' },
        ],
      },
      {
        id: 'q4',
        question: 'Wann hast du zuletzt etwas nur für dich getan?',
        options: [
          { id: 'q4a', text: 'Kann mich nicht erinnern. Ist ewig her.' },
          { id: 'q4b', text: 'Ab und zu, aber es fühlt sich fast egoistisch an.' },
          { id: 'q4c', text: 'Ich schiebe es immer auf – die Liste ist zu lang.' },
          { id: 'q4d', text: 'Regelmäßig, aber selbst das fühlt sich nach Leistung an.' },
        ],
      },
      {
        id: 'q5',
        question: 'Was wünschst du dir am meisten?',
        options: [
          { id: 'q5a', text: 'Einfach mal wieder Energie haben. Richtig wach sein.' },
          { id: 'q5b', text: 'Dass sich der Alltag nicht mehr nur nach Pflicht anfühlt.' },
          { id: 'q5c', text: 'Dass jemand versteht, wie viel ich trage.' },
          { id: 'q5d', text: 'Nachhaltige Performance – ohne auszubrennen.' },
        ],
      },
      {
        id: 'q6',
        question: 'Was trifft auf dein Verhältnis zu Sport & Bewegung zu?',
        options: [
          { id: 'q6a', text: "Ich schaff's kaum noch. Keine Zeit, keine Kraft." },
          { id: 'q6b', text: 'Ab und zu, aber es fehlt die Regelmäßigkeit.' },
          { id: 'q6c', text: 'Ich bewege mich – aber eher für die Familie als für mich.' },
          { id: 'q6d', text: 'Ich trainiere viel, aber die Ergebnisse stagnieren.' },
        ],
      },
    ],
  },

  results: {
    badge: 'Dein Ergebnis',
    videoPlaceholder: 'Video kommt bald – speziell für deinen Typ.',
    strengthsTitle: 'Deine Stärken',
    risksTitle: 'Deine Risiken',
    ctaCommunity: 'Jetzt Community beitreten →',
    formTitle: 'Dein Platz in der Community',
    formText:
      'Trag dich ein – du bekommst sofort Zugang zu unserer WhatsApp-Gruppe und bist von Anfang an dabei, wenn die erste Challenge startet.',
    labelFirstName: 'Vorname',
    labelEmail: 'E-Mail',
    optional: '(optional)',
    placeholderName: 'Dein Vorname',
    placeholderEmail: 'deine@email.de',
    consent:
      'Ich bin einverstanden, dass meine Daten gespeichert werden, um mich über den Start der Community und Challenge zu informieren. Kein Spam, jederzeit abmeldbar.',
    submit: 'Eintragen & Community beitreten →',
    submitting: 'Wird eingetragen...',
    note: 'Kostenlos. Kein Abo. Kein Spam.',
    errorRequired: 'Bitte gib deine E-Mail ein und bestätige die Datenschutzerklärung.',
    errorGeneric: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
    types: {
      leerer_akku: {
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
      stiller_kaempfer: {
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
      performer_auf_reserve: {
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
    },
  },

  welcome: {
    title: 'Du bist dabei!',
    titleWithName: 'Willkommen, {name}!',
    subtitle: 'Dein Platz ist gesichert. Jetzt fehlt nur noch ein Schritt.',
    energyType: 'Dein Energie-Typ',
    whatsappTitle: 'Tritt jetzt der Community bei',
    whatsappText:
      'In unserer WhatsApp-Gruppe triffst du andere Väter, die mehr wollen als nur funktionieren. Austausch, Motivation und erste Challenge-Infos – direkt auf dein Handy.',
    whatsappButton: 'WhatsApp-Gruppe beitreten',
    stepsTitle: 'Was passiert jetzt?',
    steps: [
      'Tritt der WhatsApp-Gruppe bei – dort passiert der Austausch.',
      'Du bekommst eine Mail mit deinem Ergebnis und ersten Impulsen.',
      'Sobald die erste Challenge startet, bist du als Erster dabei.',
    ],
    footer: 'Fragen? Schreib uns jederzeit. Wir sind echte Menschen, kein Bot.',
  },

  checkIn: {
    title: 'Daily Check-in',
    subtitle: 'Wie geht es dir heute? 30 Sekunden reichen.',
    energyLevel: 'Energie-Level',
    moodScore: 'Stimmung',
    sleepHours: 'Schlaf (Stunden)',
    stressLevel: 'Stress-Level',
    notes: 'Notizen',
    notesPlaceholder: 'Wie war dein Tag? (optional)',
    submit: 'Check-in speichern',
    submitting: 'Wird gespeichert...',
    successTitle: 'Check-in gespeichert!',
    successMessage: 'Gut gemacht. Bleib dran!',
    streakLabel: 'Deine Streak',
    streakDays: '{count} Tage in Folge',
    alreadyCheckedIn: 'Du hast heute bereits eingecheckt. Du kannst deine Werte aktualisieren.',
    updateButton: 'Check-in aktualisieren',
    energyLow: 'Erschoepft',
    energyHigh: 'Volle Power',
    moodLow: 'Schlecht',
    moodHigh: 'Super',
    stressLow: 'Entspannt',
    stressHigh: 'Sehr gestresst',
    sleepPlaceholder: 'z.B. 6.5',
    errorGeneric: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
  },

  partner: {
    title: 'Partner Dashboard',
    subtitle: 'Dein Netzwerk auf einen Blick.',
    statusLabel: 'Status',
    levelLabel: 'Level',
    displayNameLabel: 'Anzeigename',
    downlineTitle: 'Deine Downline',
    downlineCount: '{count} direkte Partner',
    inviteTokensTitle: 'Einladungslinks',
    noTokens: 'Noch keine Einladungslinks erstellt.',
    createInviteButton: 'Neuen Einladungslink erstellen',
    copyLink: 'Link kopieren',
    copied: 'Kopiert!',
    tokenExpires: 'Gueltig bis {date}',
    tokenUsed: 'Bereits verwendet',
    challengesTitle: 'Deine Challenges',
    noChallenges: 'Du hast noch keine Challenges erstellt.',
    notPartnerTitle: 'Du bist noch kein Partner',
    notPartnerMessage: 'Du hast noch keinen Partner-Status. Kontaktiere uns, um Partner zu werden.',
    errorGeneric: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
  },

  invite: {
    title: 'Du wurdest eingeladen!',
    subtitle: 'Werde Teil der daddypower Community.',
    invitedBy: 'Eingeladen von {name}',
    ctaSignup: 'Jetzt kostenlos registrieren',
    invalidTitle: 'Einladung ungueltig',
    invalidMessage: 'Dieser Einladungslink ist ungueltig oder abgelaufen.',
    loadingMessage: 'Einladung wird geprueft...',
    errorGeneric: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
  },

  workouts: {
    title: 'Workout-Bibliothek',
    filterType: 'Typ',
    filterDuration: 'Dauer',
    filterDifficulty: 'Schwierigkeit',
    all: 'Alle',
    minutes: 'Min.',
    easy: 'Leicht',
    medium: 'Mittel',
    hard: 'Schwer',
    noEquipment: 'Kein Equipment',
    completeWorkout: 'Workout abgeschlossen',
    completed: 'Erledigt!',
    exercises: 'Übungen',
    sets: 'Sätze',
    reps: 'Wdh.',
    rest: 'Pause',
    empty: 'Noch keine Workouts verfügbar.',
    back: '← Zurück',
  },

  challenges: {
    title: 'Challenges',
    days: 'Tage',
    enroll: 'Challenge starten',
    enrolled: 'Eingeschrieben',
    active: 'Aktiv',
    completedLabel: 'Abgeschlossen',
    completeDay: 'Tag abschließen',
    dayOf: 'Tag {n} von {total}',
    restDay: 'Ruhetag',
    progress: 'Fortschritt',
    empty: 'Noch keine Challenges verfügbar.',
    allCompleted: 'Alle Tage geschafft! Stark!',
    back: '← Zurück',
  },

  admin: {
    loginTitle: 'Admin Login',
    email: 'E-Mail',
    password: 'Passwort',
    loginButton: 'Einloggen',
    loggingIn: 'Wird eingeloggt...',
    loginError: 'Login fehlgeschlagen. Bitte prüfe deine Zugangsdaten.',
    logout: 'Ausloggen',
    dashboard: 'Dashboard',
    kpiLeadsTotal: 'Leads gesamt',
    kpiLeadsToday: 'Leads heute',
    kpiQuizCompleted: 'Quiz abgeschlossen',
    kpiConversion: 'Conversion-Rate',
    leadsTable: 'Leads',
    videoManagement: 'Videos verwalten',
    uploadVideo: 'Video hochladen',
    deleteVideo: 'Löschen',
    noVideo: 'Kein Video',
    allTypes: 'Alle Typen',
    filterByType: 'Nach Typ filtern',
  },
}
