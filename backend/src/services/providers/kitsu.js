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

export default { name: "kitsu", getTrending, searchByTitle }
