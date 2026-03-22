import { useI18n } from '../i18n'

interface ChallengeProgram {
  id: string
  title_de: string
  title_en: string
  description_de: string | null
  description_en: string | null
  duration_days: number
  difficulty: string | null
  cover_image_url: string | null
}

interface ChallengeCardProps {
  challenge: ChallengeProgram
  isEnrolled?: boolean
  onClick: () => void
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
}

export default function ChallengeCard({ challenge, isEnrolled, onClick }: ChallengeCardProps) {
  const { lang } = useI18n()

  const title = lang === 'de' ? challenge.title_de : challenge.title_en
  const description = lang === 'de' ? challenge.description_de : challenge.description_en
  const difficultyClass = difficultyColors[challenge.difficulty || ''] || 'bg-gray-100 text-gray-800'

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm overflow-hidden text-left w-full hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Cover image or gradient placeholder */}
      {challenge.cover_image_url ? (
        <img
          src={challenge.cover_image_url}
          alt={title}
          className="w-full h-40 object-cover"
          width={400}
          height={160}
        />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-kraft-dark to-kraft-accent" />
      )}

      <div className="p-5">
        {/* Badges row */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-block bg-kraft-accent/10 text-kraft-accent text-xs font-semibold px-2.5 py-1 rounded-full">
            {challenge.duration_days} {lang === 'de' ? 'Tage' : 'Days'}
          </span>

          {challenge.difficulty && (
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${difficultyClass}`}>
              {challenge.difficulty}
            </span>
          )}

          {isEnrolled && (
            <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              {lang === 'de' ? 'Eingeschrieben' : 'Enrolled'}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-kraft-dark mb-1">{title}</h3>

        {description && (
          <p className="text-sm text-gray-500 line-clamp-2">{description}</p>
        )}
      </div>
    </button>
  )
}
