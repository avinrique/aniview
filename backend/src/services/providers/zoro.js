// Zoro/Aniwatch/HiAnime provider - content source via direct scraping
const BASES = [
  "https://hianime.sx",
  "https://hianime.nz",
  "https://kaido.to",
  "https://aniwatchtv.to",
  "https://hianime.to",
]

let workingBase = null

async function fetchHtml(path) {
  const bases = workingBase ? [workingBase, ...BASES.filter((b) => b !== workingBase)] : BASES

  for (const base of bases) {
    try {
      const res = await fetch(`${base}${path}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": base,
        },
      })
      if (!res.ok) continue
      workingBase = base
      return await res.text()
    } catch {
      continue
    }
  }
  throw new Error("All Zoro/HiAnime mirrors failed")
}

async function fetchJson(path) {
  const bases = workingBase ? [workingBase, ...BASES.filter((b) => b !== workingBase)] : BASES

  for (const base of bases) {
    try {
      const res = await fetch(`${base}${path}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "X-Requested-With": "XMLHttpRequest",
          "Referer": base,
        },
      })
      if (!res.ok) continue
      workingBase = base
      return await res.json()
    } catch {
      continue
    }
  }
  throw new Error("All Zoro/HiAnime mirrors failed")
}

export async function search(query) {
  const html = await fetchHtml(`/search?keyword=${encodeURIComponent(query)}`)

  // Split by flw-item to parse each card independently (avoids cross-item regex jumps)
  const parts = html.split("flw-item")
  const results = []
  for (let i = 1; i < parts.length && results.length < 20; i++) {
    const chunk = parts[i]
    const link = chunk.match(/href="\/([^"]+)"/)
    const title = chunk.match(/class="film-name[^"]*">\s*<a[^>]*>([^<]+)/)
    const img = chunk.match(/data-src="([^"]+)"/)
    if (link && title) {
      results.push({
        title: title[1].trim(),
        animeId: link[1],
        thumbnail: img ? img[1] : "",
        releaseYear: null,
        type: "TV",
        episodes: 0,
        status: "Unknown",
        source: "zoro",
      })
    }
  }
  return results
}

export async function getDetails(animeId) {
  // Strip "watch/" prefix — info page is at /slug-12345, not /watch/slug-12345
  const infoPath = animeId.replace(/^watch\//, "")
  const html = await fetchHtml(`/${infoPath}`)

  const title = html.match(/<h2[^>]*class="film-name[^"]*"[^>]*>([^<]+)/)?.[1]?.trim() || ""
  const cover = html.match(/anisc-poster[\s\S]*?(?:src|data-src)="(https?:\/\/[^"]+)"/)?.[1] || ""
  const synopsis = (html.match(/class="film-description[^"]*"[^>]*>\s*<div class="text">([\s\S]*?)<\/div>/)?.[1] || "")
    .replace(/<[^>]+>/g, "").trim()

  // Extract data-id for episode fetching
  const dataId = html.match(/data-id="(\d+)"/)?.[1]

  let episodes = []
  if (dataId) {
    try {
      const epData = await fetchJson(`/ajax/v2/episode/list/${dataId}`)
      const epHtml = epData.html || ""
      const epMatches = [...epHtml.matchAll(/data-number="(\d+)"[\s\S]*?data-id="(\d+)"[\s\S]*?href="\/watch\/([^"]+)"/g)]
      episodes = epMatches.map((m) => ({
        episodeNumber: parseInt(m[1]),
        session: m[3],
        title: `Episode ${m[1]}`,
      }))
    } catch {
      // Could not fetch episodes
    }
  }

  return {
    title,
    cover,
    synopsis,
    info: {},
    animeId,
    episodes,
    source: "zoro",
  }
}

export async function getVideo(animeId, episodeSession) {
  // Get server list
  const episodeId = episodeSession.split("?ep=")[1] || episodeSession
  let servers
  try {
    servers = await fetchJson(`/ajax/v2/episode/servers?episodeId=${episodeId}`)
  } catch {
    return { episodeSession, sub: {}, dub: {}, watchUrl: "", source: "zoro" }
  }

  const sub = {}
  const dub = {}
  const serverHtml = servers.html || ""

  // Extract server IDs for sub and dub
  const subServers = [...serverHtml.matchAll(/data-type="sub"[\s\S]*?data-id="(\d+)"/g)]
  const dubServers = [...serverHtml.matchAll(/data-type="dub"[\s\S]*?data-id="(\d+)"/g)]

  for (const [i, m] of subServers.entries()) {
    try {
      const src = await fetchJson(`/ajax/v2/episode/sources?id=${m[1]}`)
      if (src.link) sub[`server${i + 1}`] = src.link
    } catch { /* skip */ }
  }

  for (const [i, m] of dubServers.entries()) {
    try {
      const src = await fetchJson(`/ajax/v2/episode/sources?id=${m[1]}`)
      if (src.link) dub[`server${i + 1}`] = src.link
    } catch { /* skip */ }
  }

  return {
    episodeSession,
    sub,
    dub,
    watchUrl: `${workingBase || BASES[0]}/watch/${episodeSession}`,
    source: "zoro",
  }
}

export async function resolveEpisodeSession(animeId, episodeNumber) {
  const details = await getDetails(animeId)
  const ep = details.episodes.find((e) => String(e.episodeNumber) === String(episodeNumber))
  return ep?.session || null
}

export default { name: "zoro", search, getDetails, getVideo, resolveEpisodeSession }
