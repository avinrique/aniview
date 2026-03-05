// AnimePahe provider - content source (search, details, episodes, video)
// Uses Puppeteer to bypass Cloudflare
import browserManager from "../browserManager.js"
import config from "../../config/index.js"

const BASE = config.baseUrl

async function ensureOnOrigin(page) {
  await browserManager.ensureCfCleared(page)
  const currentUrl = page.url()
  if (!currentUrl.startsWith(BASE)) {
    await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 })
  }
}

async function pageFetch(page, url) {
  return page.evaluate(async (u) => {
    const res = await fetch(u)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.text()
  }, url)
}

async function pageFetchJson(page, url) {
  const raw = await pageFetch(page, url)
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error(`Failed to parse JSON from ${url}`)
  }
}

export async function search(query) {
  const page = await browserManager.newPage()
  try {
    await ensureOnOrigin(page)
    const url = `${BASE}/api?m=search&q=${encodeURIComponent(query)}`
    const data = await pageFetchJson(page, url)
    if (!data.data || data.data.length === 0) return []
    return data.data.map((item) => ({
      title: item.title,
      animeId: item.session,
      thumbnail: item.poster,
      releaseYear: item.year,
      type: item.type,
      episodes: item.episodes,
      status: item.status,
      source: "animepahe",
    }))
  } finally {
    await page.close()
  }
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
}

function parseAnimeHtml(html) {
  const titleRaw = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/)?.[1] || ""
  const title = decodeHtmlEntities(titleRaw)
  const cover = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/)?.[1] || ""
  const synopsisRaw = html.match(/class="anime-synopsis"[^>]*>([\s\S]*?)<\/div>/)?.[1] || ""
  const synopsis = synopsisRaw.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, "").trim()

  const info = {}
  const infoBlock = html.match(/class="col-sm-4 anime-info">([\s\S]*?)<div class="anime-genre/)
  if (infoBlock) {
    const pTags = [...infoBlock[1].matchAll(/<p[^>]*>[\s\S]*?<strong>(.*?):?\s*<\/strong>([\s\S]*?)<\/p>/g)]
    for (const m of pTags) {
      const key = m[1].replace(/<[^>]+>/g, "").replace(/:$/, "").trim()
      const val = m[2].replace(/<[^>]+>/g, "").replace(/,\s*$/, "").trim()
      if (key && val) info[key] = val
    }
  }
  return { title, cover, synopsis, info }
}

async function fetchAllEpisodes(page, animeId) {
  const parseEps = (data) =>
    (data.data || []).map((ep) => ({
      episodeNumber: ep.episode,
      session: ep.session,
      title: `Episode ${ep.episode}`,
      snapshot: ep.snapshot,
      duration: ep.duration,
      createdAt: ep.created_at,
    }))

  const url1 = `${BASE}/api?m=release&id=${animeId}&sort=episode_asc&page=1`
  let firstData
  try {
    firstData = await pageFetchJson(page, url1)
  } catch {
    return []
  }

  const episodes = parseEps(firstData)
  const lastPage = firstData.last_page || 1

  if (lastPage > 1) {
    const remaining = Array.from({ length: lastPage - 1 }, (_, i) => i + 2)
    const pageResults = await Promise.all(
      remaining.map(async (p) => {
        try {
          const data = await pageFetchJson(page, `${BASE}/api?m=release&id=${animeId}&sort=episode_asc&page=${p}`)
          return parseEps(data)
        } catch {
          return []
        }
      }),
    )
    for (const eps of pageResults) episodes.push(...eps)
  }
  return episodes
}

export async function getDetails(animeId) {
  const page = await browserManager.newPage()
  try {
    await ensureOnOrigin(page)
    const html = await pageFetch(page, `${BASE}/anime/${animeId}`)
    const details = parseAnimeHtml(html)
    const episodes = await fetchAllEpisodes(page, animeId)
    return {
      title: details.title,
      cover: details.cover,
      synopsis: details.synopsis,
      info: details.info,
      animeId,
      episodes,
      source: "animepahe",
    }
  } finally {
    await page.close()
  }
}

export async function getVideo(animeId, episodeSession) {
  const page = await browserManager.newPage()
  try {
    await browserManager.ensureCfCleared(page)
    const watchUrl = `${BASE}/play/${animeId}/${episodeSession}`
    await page.goto(watchUrl, { waitUntil: "domcontentloaded", timeout: 45000 })

    const reloadBtn = await page.$(".click-to-load, .reload")
    if (reloadBtn) await reloadBtn.click()

    await page.waitForSelector("button.dropdown-item[data-src]", { timeout: 15000 })
      .catch(() => {})

    const sources = await page.evaluate(() => {
      const sub = {}, dub = {}
      document.querySelectorAll("button.dropdown-item[data-src]").forEach((btn) => {
        const url = btn.getAttribute("data-src") || ""
        const resolution = btn.getAttribute("data-resolution") || ""
        const audio = btn.getAttribute("data-audio") || ""
        if (!url || !resolution) return
        const target = audio === "eng" ? dub : sub
        target[resolution] = url
      })
      return { sub, dub }
    })

    return { episodeSession, sub: sources.sub, dub: sources.dub, watchUrl, source: "animepahe" }
  } finally {
    await page.close()
  }
}

export async function resolveEpisodeSession(animeId, episodeNumber) {
  const details = await getDetails(animeId)
  const ep = details.episodes.find((e) => String(e.episodeNumber) === String(episodeNumber))
  return ep?.session || null
}

export default { name: "animepahe", search, getDetails, getVideo, resolveEpisodeSession }
