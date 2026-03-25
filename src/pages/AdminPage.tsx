import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useI18n } from '../i18n'
import type { ResultTypeId } from '../data/quiz'
import AdminLeadsPage from './AdminLeadsPage'
import AdminEmailStatsPage from './AdminEmailStatsPage'
import AdminFunnelPage from './AdminFunnelPage'

const RESULT_TYPES: ResultTypeId[] = ['leerer_akku', 'funktionierer', 'stiller_kaempfer', 'performer_auf_reserve']
const LANGUAGES = ['de', 'en'] as const

type TabId = 'kpis' | 'leads' | 'videos' | 'email' | 'funnel' | 'partners'

const TABS: { id: TabId; label: string }[] = [
  { id: 'kpis', label: 'KPIs' },
  { id: 'leads', label: 'Leads CRM' },
  { id: 'videos', label: 'Videos' },
  { id: 'email', label: 'E-Mail Stats' },
  { id: 'funnel', label: 'Funnel' },
  { id: 'partners', label: 'Partner' },
]

interface KPIs {
  leadsTotal: number
  leadsToday: number
  quizCompleted: number
  conversion: number
}

interface ResultVideo {
  id: string
  result_type: string
  language: string
  url: string
  asset_type: string
  is_public: boolean
}

export default function AdminPage() {
  const { t } = useI18n()
  const a = t.admin

  // Dashboard State
  const [kpis, setKpis] = useState<KPIs>({ leadsTotal: 0, leadsToday: 0, quizCompleted: 0, conversion: 0 })
  const [videos, setVideos] = useState<ResultVideo[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('kpis')

  // Video Upload State
  const [uploadType, setUploadType] = useState<ResultTypeId>('leerer_akku')
  const [uploadLang, setUploadLang] = useState<'de' | 'en'>('de')
  const [uploadMode, setUploadMode] = useState<'upload' | 'youtube'>('youtube')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Load Dashboard Data (KPIs + Videos only — leads moved to AdminLeadsPage)
  const loadData = useCallback(async () => {
    // KPIs
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })

    const today = new Date().toISOString().split('T')[0]
    const { count: todayLeads } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today)

    const { count: quizEvents } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('event_name', 'quiz_completed')

    const total = totalLeads || 0
    const quizCount = quizEvents || 0
    const conversion = quizCount > 0 ? Math.round((total / quizCount) * 100) : 0

    setKpis({
      leadsTotal: total,
      leadsToday: todayLeads || 0,
      quizCompleted: quizCount,
      conversion,
    })

    // Videos
    const { data: videosData } = await supabase
      .from('content_assets')
      .select('id, result_type, language, url, asset_type, is_public')
      .order('result_type')

    setVideos(videosData || [])
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Video Upload
  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      let videoUrl = ''

      if (uploadMode === 'youtube') {
        videoUrl = youtubeUrl
      } else if (uploadFile) {
        const fileName = `${uploadType}_${uploadLang}_${Date.now()}.mp4`
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, uploadFile)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('videos')
          .getPublicUrl(fileName)

        videoUrl = urlData.publicUrl
      }

      if (!videoUrl) return

      await supabase
        .from('content_assets')
        .delete()
        .eq('asset_type', 'video')
        .eq('result_type', uploadType)
        .eq('language', uploadLang)

      const { error } = await supabase
        .from('content_assets')
        .insert({
          asset_type: 'video',
          title: `Video: ${uploadType} (${uploadLang})`,
          result_type: uploadType,
          language: uploadLang,
          url: videoUrl,
          is_public: true,
        })

      if (error) throw error

      setYoutubeUrl('')
      setUploadFile(null)
      await loadData()
    } catch (err) {
      console.error('Upload error:', err)
      alert('Upload fehlgeschlagen')
    } finally {
      setUploading(false)
    }
  }

  const deleteVideo = async (id: string) => {
    await supabase.from('content_assets').delete().eq('id', id)
    await loadData()
  }

  return (
    <div className="min-h-screen bg-kraft-offwhite">
      {/* Header */}
      <header className="bg-kraft-dark text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">daddypower {a.dashboard}</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-kraft-border hover:text-white underline cursor-pointer"
        >
          {a.logout}
        </button>
      </header>

      {/* Tabs */}
      <div className="px-6 pt-6 max-w-6xl mx-auto">
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'bg-kraft-dark text-white'
                  : 'bg-white text-kraft-dark border border-kraft-border hover:bg-kraft-offwhite'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* KPIs Tab */}
        {activeTab === 'kpis' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: a.kpiLeadsTotal, value: kpis.leadsTotal },
              { label: a.kpiLeadsToday, value: kpis.leadsToday },
              { label: a.kpiQuizCompleted, value: kpis.quizCompleted },
              { label: a.kpiConversion, value: `${kpis.conversion}%` },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-sm text-kraft-muted mb-1">{kpi.label}</p>
                <p className="text-3xl font-bold text-kraft-dark">{kpi.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Leads CRM Tab */}
        {activeTab === 'leads' && <AdminLeadsPage />}

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <div>
            {/* Aktuelle Videos */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="font-bold text-kraft-dark mb-4">Aktuelle Videos</h3>
              <div className="grid gap-3">
                {RESULT_TYPES.map((type) =>
                  LANGUAGES.map((lang) => {
                    const video = videos.find(
                      (v) => v.result_type === type && v.language === lang
                    )
                    return (
                      <div
                        key={`${type}-${lang}`}
                        className="flex items-center justify-between border border-kraft-border/50 rounded-lg px-4 py-3"
                      >
                        <div>
                          <span className="font-medium text-kraft-dark">
                            {t.results.types[type]?.title}
                          </span>
                          <span className="text-kraft-muted text-xs ml-2 uppercase">{lang}</span>
                        </div>
                        {video ? (
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                              {video.url?.includes('youtu') ? 'youtube' : 'upload'}
                            </span>
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-kraft-accent underline"
                            >
                              Ansehen
                            </a>
                            <button
                              onClick={() => deleteVideo(video.id)}
                              className="text-xs text-kraft-accent hover:text-kraft-accent-dark cursor-pointer"
                            >
                              {a.deleteVideo}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-kraft-muted">{a.noVideo}</span>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Upload Form */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-kraft-dark mb-4">{a.uploadVideo}</h3>
              <form onSubmit={handleVideoUpload} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-kraft-muted mb-1">Typ</label>
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value as ResultTypeId)}
                      className="w-full px-3 py-2 border border-kraft-border rounded-lg text-sm"
                    >
                      {RESULT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {t.results.types[type]?.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-kraft-muted mb-1">Sprache</label>
                    <select
                      value={uploadLang}
                      onChange={(e) => setUploadLang(e.target.value as 'de' | 'en')}
                      className="w-full px-3 py-2 border border-kraft-border rounded-lg text-sm"
                    >
                      <option value="de">Deutsch</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-kraft-muted mb-1">Quelle</label>
                    <select
                      value={uploadMode}
                      onChange={(e) => setUploadMode(e.target.value as 'upload' | 'youtube')}
                      className="w-full px-3 py-2 border border-kraft-border rounded-lg text-sm"
                    >
                      <option value="youtube">YouTube</option>
                      <option value="upload">Datei Upload</option>
                    </select>
                  </div>
                </div>

                {uploadMode === 'youtube' ? (
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="YouTube URL oder Video-ID"
                    className="w-full px-4 py-3 border-2 border-kraft-border rounded-xl focus:border-kraft-accent focus:outline-none"
                  />
                ) : (
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full text-sm"
                  />
                )}

                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-kraft-dark hover:bg-kraft-navy disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-xl transition-all cursor-pointer"
                >
                  {uploading ? 'Wird hochgeladen...' : a.uploadVideo}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Email Stats Tab */}
        {activeTab === 'email' && <AdminEmailStatsPage />}

        {/* Funnel Tab */}
        {activeTab === 'funnel' && <AdminFunnelPage />}

        {/* Partners Tab (Placeholder) */}
        {activeTab === 'partners' && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-kraft-muted text-lg">Partner-Verwaltung kommt bald.</p>
            <p className="text-kraft-muted text-sm mt-2">Hier werden Partner-Netzwerk, Lizenzen und Abrechnungen verwaltet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
