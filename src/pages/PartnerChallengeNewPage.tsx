import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import LanguageSwitcher from '../components/LanguageSwitcher'
import ChallengeCreatorForm from '../components/partner/ChallengeCreatorForm'

export default function PartnerChallengeNewPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const pc = t.partnerChallenges

  const handleSaved = () => {
    navigate('/partner/challenges')
  }

  return (
    <div className="min-h-screen bg-kraft-offwhite">
      <LanguageSwitcher />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/partner/challenges')}
          className="text-sm text-kraft-muted hover:text-kraft-dark mb-4 cursor-pointer"
        >
          {pc.backToList}
        </button>

        <h1 className="text-2xl font-bold text-kraft-dark mb-1">{pc.newChallengeTitle}</h1>
        <p className="text-kraft-muted text-sm mb-6">{pc.newChallengeSubtitle}</p>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <ChallengeCreatorForm onSaved={handleSaved} />
        </div>
      </div>
    </div>
  )
}
