// Kitsu API - metadata provider
const BASE = "https://kitsu.io/api/edge"
const HEADERS = {
  Accept: "application/vnd.api+json",
  "Content-Type": "application/vnd.api+json",
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`Kitsu HTTP ${res.status}`)
  return res.json()
}

function mapAnime(item) {
  const a = item.attributes
  return {
    title: a.titles?.en || a.titles?.en_jp || a.canonicalTitle,
    thumbnail: a.posterImage?.medium || a.posterImage?.original,
    episodes: a.episodeCount || 0,
    status: a.status === "current" ? "Currently Airing" : a.status,
    type: (a.subtype || "TV").toUpperCase(),
    releaseYear: a.startDate ? parseInt(a.startDate.split("-")[0]) : null,
    source: "kitsu",
  }
}

export async function getTrending(limit = 20) {
  const json = await fetchJson(`${BASE}/trending/anime?limit=${limit}`)
  return (json.data || []).map(mapAnime)
}

export async function searchByTitle(query, limit = 10) {
  const json = await fetchJson(`${BASE}/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=${limit}`)
  return (json.data || []).map(mapAnime)
}

/**
 * Get episode thumbnails and titles from Kitsu for a given anime title.
 * Returns a map of episodeNumber -> { snapshot, title }
 */
export async function getEpisodeMeta(animeTitle) {
  // Clean title for better Kitsu matching — strip common suffixes
  const cleanTitle = animeTitle
    .replace(/\s*\(TV\)\s*$/i, "")
    .replace(/\s*\(OVA\)\s*$/i, "")
    .replace(/\s*Season\s*\d+/i, "")
    .trim()

  // Step 1: Find the anime on Kitsu
  const searchJson = await fetchJson(
    `${BASE}/anime?filter[text]=${encodeURIComponent(cleanTitle)}&page[limit]=5`
  )
  if (!searchJson.data || searchJson.data.length === 0) return null

  // Pick best match by title and episode count
  const cleanLower = cleanTitle.toLowerCase()
  let best = searchJson.data[0]
  for (const item of searchJson.data) {
    const t = (item.attributes.canonicalTitle || "").toLowerCase()
    const tEn = (item.attributes.titles?.en || "").toLowerCase()
    if (t === cleanLower || tEn === cleanLower) {
      best = item
      break
    }
    // Prefer entries with more episodes (likely the main series)
    if ((item.attributes.episodeCount || 0) > (best.attributes.episodeCount || 0)) {
      best = item
    }
  }

  const kitsuId = best.id
  const totalEps = best.attributes.episodeCount || 0

  // Step 2: Fetch all episodes (paginated, max 20 per request)
  const episodeMap = {}
  let offset = 0
  const limit = 20
  const maxFetch = Math.min(totalEps || 500, 500) // safety cap

  while (offset < maxFetch) {
    const epJson = await fetchJson(
      `${BASE}/anime/${kitsuId}/episodes?page[limit]=${limit}&page[offset]=${offset}&sort=number`
    )
    const episodes = epJson.data || []
    if (episodes.length === 0) break

    for (const ep of episodes) {
      const a = ep.attributes
      if (a.number != null) {
        episodeMap[a.number] = {
          snapshot: a.thumbnail?.original || null,
          title: a.canonicalTitle || a.titles?.en_jp || null,
        }
      }
    }

    offset += limit
    if (episodes.length < limit) break
  }

  return episodeMap
}

export default { name: "kitsu", getTrending, searchByTitle, getEpisodeMeta }
