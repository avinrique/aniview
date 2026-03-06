// Gogoanime provider - content source via direct scraping (no Puppeteer needed)
const BASES = [
  "https://anitaku.to",
  "https://gogotaku.info",
  "https://gogoanime3.co",
  "https://gogoanime.gg",
]

let workingBase = null

async function fetchHtml(path) {
  const bases = workingBase ? [workingBase, ...BASES.filter((b) => b !== workingBase)] : BASES

  for (const base of bases) {
    try {
      const res = await fetch(`${base}${path}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      })
      if (!res.ok) continue
      workingBase = base
      return await res.text()
    } catch {
      continue
    }
  }
  throw new Error("All Gogoanime mirrors failed")
}

function extractText(html, regex) {
  const m = html.match(regex)
  return m ? m[1].trim() : ""
}

export async function search(query) {
  const html = await fetchHtml(`/search.html?keyword=${encodeURIComponent(query)}`)
  const items = [...html.matchAll(/<li>\s*<div class="img">\s*<a href="\/category\/([^"]+)"[^>]*title="([^"]*)"[\s\S]*?<img src="([^"]*)"[\s\S]*?<p class="released">(\d{4})?/g)]

  return items.slice(0, 20).map((m) => ({
    title: m[2],
    animeId: m[1].replace(/^watch\//, ""),
    thumbnail: m[3],
    releaseYear: m[4] ? parseInt(m[4]) : null,
    type: "TV",
    episodes: 0,
    status: "Unknown",
    source: "gogoanime",
  }))
}

export async function getDetails(animeId) {
  const html = await fetchHtml(`/category/${animeId}`)

  const title = extractText(html, /<h1>([^<]+)<\/h1>/)
  const cover = extractText(html, /<div class="anime_info_body_bg">\s*<img src="([^"]+)"/)
  const synopsis = extractText(html, /<div class="description">\s*(?:<p>)?([\s\S]*?)(?:<\/p>)?\s*<\/div>/)
    .replace(/<[^>]+>/g, "").trim()
  const status = extractText(html, /Status:\s*<\/span>\s*<a[^>]*>([^<]+)/)
  const releaseYear = extractText(html, /Released:\s*<\/span>\s*(\d{4})/)

  // Try AJAX episode list first (older gogoanime mirrors)
  const lastEpMatch = html.match(/ep_end\s*=\s*'(\d+)'/)
  const movieIdMatch = html.match(/value="(\d+)"\s*id="movie_id"/)
  const totalEps = lastEpMatch ? parseInt(lastEpMatch[1]) : 0
  const movieId = movieIdMatch ? movieIdMatch[1] : null

  let episodes = []
  if (movieId && totalEps > 0) {
    try {
      const ajaxUrl = `https://ajax.gogocdn.net/ajax/load-list-episode?ep_start=0&ep_end=${totalEps}&id=${movieId}&default_ep=0`
      const res = await fetch(ajaxUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      })
      const epHtml = await res.text()
      const epMatches = [...epHtml.matchAll(/<a href="\s*\/([^"]+)"[\s\S]*?EP\s*(\d+)/gi)]
      episodes = epMatches.reverse().map((m) => ({
        episodeNumber: parseInt(m[2]),
        session: m[1].trim(),
        title: `Episode ${m[2]}`,
      }))
    } catch {
      // handled below
    }
  }

  // Fallback: scrape episode links directly from the page HTML (only for THIS anime)
  if (episodes.length === 0) {
    const epPattern = new RegExp(`href="/(${animeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-episode-(\\d+))"`, "g")
    const epLinks = [...html.matchAll(epPattern)]
    const seen = new Set()
    for (const m of epLinks) {
      const num = parseInt(m[2])
      if (!seen.has(num)) {
        seen.add(num)
        episodes.push({
          episodeNumber: num,
          session: m[1].trim(),
          title: `Episode ${num}`,
        })
      }
    }
    episodes.sort((a, b) => a.episodeNumber - b.episodeNumber)
  }

  // Last fallback: extract episode count from page text and generate list
  if (episodes.length === 0) {
    const epCountMatch = html.match(/Episodes:\s*<\/span>\s*(\d+)/)
    if (epCountMatch) {
      const count = parseInt(epCountMatch[1])
      episodes = Array.from({ length: count }, (_, i) => ({
        episodeNumber: i + 1,
        session: `${animeId}-episode-${i + 1}`,
        title: `Episode ${i + 1}`,
      }))
    }
  }

  return {
    title,
    cover,
    synopsis,
    info: { Status: status, Released: releaseYear },
    animeId,
    episodes,
    source: "gogoanime",
  }
}

export async function getVideo(animeId, episodeSession) {
  const html = await fetchHtml(`/${episodeSession}`)

  // Extract embed URLs from the video player links
  const sub = {}
  const embedMatch = html.match(/data-video="([^"]*)"/)
  if (embedMatch) {
    sub["default"] = embedMatch[1].startsWith("//") ? `https:${embedMatch[1]}` : embedMatch[1]
  }

  // Try to get multiple quality sources
  const serverMatches = [...html.matchAll(/data-video="([^"]*)"/g)]
  serverMatches.forEach((m, i) => {
    const url = m[1].startsWith("//") ? `https:${m[1]}` : m[1]
    if (i === 0) sub["default"] = url
    else sub[`server${i + 1}`] = url
  })

  if (Object.keys(sub).length === 0) return null

  return {
    episodeSession,
    sub,
    dub: {},
    watchUrl: `${workingBase || BASES[0]}/${episodeSession}`,
    source: "gogoanime",
  }
}

export async function resolveEpisodeSession(animeId, episodeNumber) {
  // Verify the episode page actually exists before returning
  const session = `${animeId}-episode-${episodeNumber}`
  try {
    const html = await fetchHtml(`/${session}`)
    // If we get a valid page with a video player, the episode exists
    if (html.includes("data-video") || html.includes("anime_video_body")) {
      return session
    }
    return null
  } catch {
    return null
  }
}

export default { name: "gogoanime", search, getDetails, getVideo, resolveEpisodeSession }
