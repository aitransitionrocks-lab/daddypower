// wger.de Exercise API Service
// Free API, no key needed. Results cached 24h in localStorage.

const WGER_BASE = 'https://wger.de/api/v2'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

// ---------- Types ----------

export interface WgerExercise {
  id: number
  name: string
  description: string
  category: string
  muscles: string[]
  muscles_secondary: string[]
  equipment: string[]
  images: WgerExerciseImage[]
}

export interface WgerExerciseImage {
  image: string
  is_main: boolean
}

interface WgerExerciseRaw {
  id: number
  name: string
  description: string
  category: { id: number; name: string } | number
  muscles: { id: number; name: string; name_en: string }[]
  muscles_secondary: { id: number; name: string; name_en: string }[]
  equipment: { id: number; name: string }[]
  images: WgerExerciseImage[]
}

interface WgerListResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// ---------- Cache helpers ----------

interface CacheEntry<T> {
  data: T
  timestamp: number
}

function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      localStorage.removeItem(key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

function cacheKey(endpoint: string): string {
  return `wger-cache-${endpoint}`
}

// ---------- Category / Muscle / Equipment maps ----------

const CATEGORY_MAP: Record<number, string> = {
  8: 'Arms',
  9: 'Legs',
  10: 'Abs',
  11: 'Chest',
  12: 'Back',
  13: 'Shoulders',
  14: 'Calves',
  15: 'Cardio',
  16: 'Stretching',
}

function mapRawExercise(raw: WgerExerciseRaw): WgerExercise {
  const categoryId = typeof raw.category === 'number' ? raw.category : raw.category?.id
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description || '',
    category: (typeof raw.category === 'object' && raw.category !== null)
      ? raw.category.name
      : (CATEGORY_MAP[categoryId as number] || 'Other'),
    muscles: (raw.muscles || []).map((m) => m.name_en || m.name),
    muscles_secondary: (raw.muscles_secondary || []).map((m) => m.name_en || m.name),
    equipment: (raw.equipment || []).map((e) => e.name),
    images: raw.images || [],
  }
}

// ---------- Public API ----------

export interface FetchExercisesOptions {
  limit?: number
  offset?: number
  category?: number
  language?: number
}

export async function fetchExercises(
  options: FetchExercisesOptions = {}
): Promise<WgerExercise[]> {
  const { limit = 50, offset = 0, category, language = 2 } = options

  let url = `${WGER_BASE}/exercise/?format=json&language=${language}&limit=${limit}&offset=${offset}`
  if (category) url += `&category=${category}`

  const key = cacheKey(url)
  const cached = getCached<WgerExercise[]>(key)
  if (cached) return cached

  try {
    const res = await fetch(url)
    if (!res.ok) return []

    const json: WgerListResponse<WgerExerciseRaw> = await res.json()
    const exercises = json.results.map(mapRawExercise)
    setCache(key, exercises)
    return exercises
  } catch {
    return []
  }
}

export async function fetchExerciseImages(
  exerciseId: number
): Promise<WgerExerciseImage[]> {
  const url = `${WGER_BASE}/exerciseimage/?format=json&exercise=${exerciseId}`
  const key = cacheKey(url)
  const cached = getCached<WgerExerciseImage[]>(key)
  if (cached) return cached

  try {
    const res = await fetch(url)
    if (!res.ok) return []

    const json: WgerListResponse<WgerExerciseImage> = await res.json()
    const images = json.results || []
    setCache(key, images)
    return images
  } catch {
    return []
  }
}

export async function searchExercises(query: string): Promise<WgerExercise[]> {
  if (!query.trim()) return []

  // wger search endpoint
  const url = `${WGER_BASE}/exercise/search/?term=${encodeURIComponent(query)}&language=english&format=json`
  const key = cacheKey(url)
  const cached = getCached<WgerExercise[]>(key)
  if (cached) return cached

  try {
    const res = await fetch(url)
    if (!res.ok) {
      // Fallback: fetch all and filter client-side
      return fallbackSearch(query)
    }

    const json = await res.json()
    // search endpoint returns { suggestions: [...] }
    const suggestions: { data: WgerExerciseRaw }[] = json.suggestions || []
    const exercises = suggestions.map((s) => mapRawExercise(s.data))
    setCache(key, exercises)
    return exercises
  } catch {
    return fallbackSearch(query)
  }
}

async function fallbackSearch(query: string): Promise<WgerExercise[]> {
  const all = await fetchExercises({ limit: 200 })
  const lower = query.toLowerCase()
  return all.filter((e) => e.name.toLowerCase().includes(lower))
}

// ---------- Category list for filters ----------

export const EXERCISE_CATEGORIES = [
  { id: 8, name: 'Arms' },
  { id: 9, name: 'Legs' },
  { id: 10, name: 'Abs' },
  { id: 11, name: 'Chest' },
  { id: 12, name: 'Back' },
  { id: 13, name: 'Shoulders' },
  { id: 14, name: 'Calves' },
  { id: 15, name: 'Cardio' },
  { id: 16, name: 'Stretching' },
]
