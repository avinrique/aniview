// Jikan API (MyAnimeList wrapper) - metadata provider
const BASE = "https://api.jikan.moe/v4"

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Jikan HTTP ${res.status}`)
  return res.json()
}

function mapAnime(a) {
  return {
    title: a.title_english || a.title,
    thumbnail: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url,
    episodes: a.episodes || 0,
    status: a.status || "Unknown",
    type: a.type || "TV",
    releaseYear: a.year || a.aired?.prop?.from?.year,
    source: "jikan",
  }
}

export async function getTrending(limit = 20) {
  const json = await fetchJson(`${BASE}/top/anime?filter=airing&limit=${limit}`)
  return (json.data || []).map(mapAnime)
}

export async function searchByTitle(query, limit = 10) {
  const json = await fetchJson(`${BASE}/anime?q=${encodeURIComponent(query)}&limit=${limit}`)
  return (json.data || []).map(mapAnime)
}

export default { name: "jikan", getTrending, searchByTitle }
