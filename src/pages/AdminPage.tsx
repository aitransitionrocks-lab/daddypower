import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useI18n } from '../i18n'
import type { ResultTypeId } from '../data/quiz'

const RESULT_TYPES: ResultTypeId[] = ['leerer_akku', 'funktionierer', 'stiller_kaempfer', 'performer_auf_reserve']
const LANGUAGES = ['de', 'en'] as const

interface Lead {
  id: string
  email: string
  first_name: string | null
  result_type: string | null
  biggest_challenge: string | null
  created_at: string
}

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
  const [leads, setLeads] = useState<Lead[]>([])
  const [filterType, setFilterType] = useState<string>('')
  const [videos, setVideos] = useState<ResultVideo[]>([])
  const [activeTab, setActiveTab] = useState<'kpis' | 'leads' | 'videos'>('kpis')

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

  // Load Dashboard Data
  const loadData = useCallback(async () => {
    // KPIs
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })

    const today = new Date().toISOString().split('T')[0]
    const { count: todayLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)

    const { count: quizEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
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

    // Leads
    let query = supabase
      .from('leads')
      .select('id, email, first_name, result_type, biggest_challenge, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (filterType) {
      query = query.eq('result_type', filterType)
    }

    const { data: leadsData } = await query
    setLeads(leadsData || [])

    // Videos
    const { data: videosData } = await supabase
      .from('content_assets')
      .select('*')
      .order('result_type')

    setVideos(videosData || [])
  }, [filterType])

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

      // Existierendes Video löschen falls vorhanden, dann neu einfügen
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

  // ---- DASHBOARD ----
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
        <div className="flex gap-2 mb-6">
          {(['kpis', 'leads', 'videos'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium text-sm cursor-pointer transition-all ${
                activeTab === tab
                  ? 'bg-kraft-dark text-white'
                  : 'bg-white text-kraft-dark border border-kraft-border hover:bg-kraft-offwhite'
              }`}
            >
              {tab === 'kpis' ? 'KPIs' : tab === 'leads' ? a.leadsTable : a.videoManagement}
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

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div>
            <div className="mb-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-kraft-border rounded-lg text-sm"
              >
                <option value="">{a.allTypes}</option>
                {RESULT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t.results.types[type].title}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-kraft-offwhite">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-kraft-muted">Datum</th>
                    <th className="text-left px-4 py-3 font-medium text-kraft-muted">{a.email}</th>
                    <th className="text-left px-4 py-3 font-medium text-kraft-muted">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-kraft-muted">Typ</th>
                    <th className="text-left px-4 py-3 font-medium text-kraft-muted">Challenge</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-t border-kraft-border/50">
                      <td className="px-4 py-3 text-kraft-muted">
                        {new Date(lead.created_at).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-4 py-3 text-kraft-dark">{lead.email}</td>
                      <td className="px-4 py-3 text-kraft-dark">{lead.first_name || '–'}</td>
                      <td className="px-4 py-3">
                        {lead.result_type ? (
                          <span className="bg-kraft-accent/10 text-kraft-accent text-xs px-2 py-1 rounded-full">
                            {t.results.types[lead.result_type]?.title || lead.result_type}
                          </span>
                        ) : '–'}
                      </td>
                      <td className="px-4 py-3 text-kraft-muted text-xs max-w-[200px] truncate">
                        {lead.biggest_challenge || '–'}
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-kraft-muted">
                        Keine Leads gefunden.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
      </div>
    </div>
  )
}
