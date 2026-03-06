// Source Manager - orchestrates multiple providers with automatic fallback
import cache from "../utils/cache.js"

// Metadata providers (for trending/featured lists)
import anilist from "./providers/anilist.js"
import jikan from "./providers/jikan.js"
import kitsu from "./providers/kitsu.js"

// Content providers (for search, details, episodes, video)
import animepahe from "./providers/animepahe.js"
import gogoanime from "./providers/gogoanime.js"
import zoro from "./providers/zoro.js"

const metadataProviders = [anilist, jikan, kitsu]
const contentProviders = [zoro, gogoanime, animepahe]

const ONE_DAY_MS = 86400000

// Track which providers are healthy (avoid retrying broken ones too often)
const healthStatus = new Map()
const COOLDOWN_MS = 60000 // 1 min cooldown after failure

function isHealthy(provider) {
  const status = healthStatus.get(provider.name)
  if (!status) return true
  if (Date.now() - status.failedAt > COOLDOWN_MS) return true
  return false
}

function markFailed(provider) {
  healthStatus.set(provider.name, { failedAt: Date.now() })
  console.log(`[SourceManager] ${provider.name} marked unhealthy for ${COOLDOWN_MS / 1000}s`)
}

function markHealthy(provider) {
  healthStatus.delete(provider.name)
}

/**
 * Try providers in order. Optional validator function checks if result is "good enough".
 * If validator returns false, the result is treated as empty and next provider is tried.
 */
async function tryProviders(providers, operation, label, validator) {
  const errors = []

  for (const provider of providers) {
    if (!isHealthy(provider)) {
      console.log(`[SourceManager] Skipping ${provider.name} (cooldown)`)
      continue
    }

    try {
      console.log(`[SourceManager] Trying ${provider.name} for ${label}...`)
      const result = await operation(provider)
      if (result && (Array.isArray(result) ? result.length > 0 : true)) {
        if (validator && !validator(result)) {
          console.log(`[SourceManager] ${provider.name} result failed validation for ${label}`)
          continue
        }
        markHealthy(provider)
        console.log(`[SourceManager] ${provider.name} succeeded for ${label}`)
        return result
      }
      console.log(`[SourceManager] ${provider.name} returned empty for ${label}`)
    } catch (err) {
      markFailed(provider)
      errors.push(`${provider.name}: ${err.message}`)
      console.error(`[SourceManager] ${provider.name} failed for ${label}: ${err.message}`)
    }
  }

  // If all healthy ones failed, retry unhealthy ones as last resort
  for (const provider of providers) {
    if (isHealthy(provider)) continue
    try {
      console.log(`[SourceManager] Last resort: trying ${provider.name} for ${label}...`)
      const result = await operation(provider)
      if (result && (Array.isArray(result) ? result.length > 0 : true)) {
        if (validator && !validator(result)) continue
        markHealthy(provider)
        return result
      }
    } catch (err) {
      errors.push(`${provider.name} (retry): ${err.message}`)
    }
  }

  console.error(`[SourceManager] All providers failed for ${label}:`, errors)
  return null
}

// --- Title Matching ---

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim()
}

function extractWords(str) {
  return normalize(str).split(" ").filter(Boolean)
}

function titleSimilarity(candidate, target) {
  const nc = normalize(candidate)
  const nt = normalize(target)
  if (nc === nt) return 1

  const seasonOf = (s) => {
    const m = s.match(/season\s*(\d+)/i)
    return m ? parseInt(m[1]) : null
  }
  const partOf = (s) => {
    const m = s.match(/part\s*(\d+)/i)
    return m ? parseInt(m[1]) : null
  }

  const tSeason = seasonOf(target)
  const cSeason = seasonOf(candidate)
  const tPart = partOf(target)
  const cPart = partOf(candidate)

  if (tSeason && !cSeason && !candidate.match(/culling|game|part|arc/i)) return 0.2
  if (tSeason && cSeason && tSeason !== cSeason) return 0.1
  if (tPart && cPart && tPart !== cPart) return 0.15

  const targetWords = extractWords(target)
  const candidateWords = extractWords(candidate)
  const targetSet = new Set(targetWords)
  const candidateSet = new Set(candidateWords)

  let matchCount = 0
  for (const w of candidateSet) {
    if (targetSet.has(w)) matchCount++
  }

  const union = new Set([...targetWords, ...candidateWords]).size
  const wordScore = matchCount / Math.max(union, 1)

  let bonus = 0
  if (nc.includes(nt) || nt.includes(nc)) bonus = 0.3

  return Math.min(wordScore + bonus, 1)
}

function bestMatch(searchResults, targetTitle) {
  if (searchResults.length === 0) return null
  let best = searchResults[0]
  let bestScore = titleSimilarity(best.title, targetTitle)
  for (let i = 1; i < searchResults.length; i++) {
    const score = titleSimilarity(searchResults[i].title, targetTitle)
    if (score > bestScore) {
      best = searchResults[i]
      bestScore = score
    }
  }
  console.log(`[Match] "${targetTitle}" -> "${best.title}" (score: ${bestScore.toFixed(2)})`)
  if (bestScore < 0.3) {
    console.log(`[Match] Score too low, rejecting match`)
    return null
  }
  return best
}

// --- Helpers ---

// Heuristic: determine which provider an animeId likely came from
function getProvidersForId(animeId) {
  // AnimePahe IDs are UUIDs (8-4-4-4-12 hex)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(animeId)) {
    return [animepahe, ...contentProviders.filter((p) => p.name !== "animepahe")]
  }
  // Zoro/HiAnime IDs start with "watch/" or have numeric suffix like "slug-12345"
  if (animeId.startsWith("watch/") || (animeId.includes("-") && /\d{3,}$/.test(animeId))) {
    return [zoro, ...contentProviders.filter((p) => p.name !== "zoro")]
  }
  // Gogoanime IDs are simple slugs like "one-piece"
  if (/^[a-z0-9-]+$/.test(animeId)) {
    return [gogoanime, ...contentProviders.filter((p) => p.name !== "gogoanime")]
  }
  return contentProviders
}

// Extract a human-readable title from an animeId slug for cross-provider search
function titleFromSlug(animeId) {
  return animeId
    .replace(/^watch\//, "")
    .replace(/-\d+$/, "")      // remove trailing numeric ID (zoro)
    .replace(/-episode-\d+$/, "") // remove episode suffix (gogoanime)
    .replace(/-/g, " ")
}

// In-memory map: animeId -> title (populated when we get details)
const titleMap = new Map()

function rememberTitle(animeId, title) {
  if (title) titleMap.set(animeId, title)
}

function getKnownTitle(animeId) {
  return titleMap.get(animeId) || null
}

/**
 * Cross-provider fallback: search for anime by title on ALL providers,
 * get details from whoever has the best match with actual episodes.
 */
async function crossProviderDetails(title) {
  if (!title) return null
  console.log(`[SourceManager] Cross-provider fallback search for "${title}"`)

  for (const provider of contentProviders) {
    if (!isHealthy(provider)) continue
    try {
      const results = await provider.search(title)
      const match = bestMatch(results, title)
      if (!match) continue

      const details = await provider.getDetails(match.animeId)
      if (details && details.episodes && details.episodes.length > 0) {
        console.log(`[SourceManager] Cross-provider: ${provider.name} has "${match.title}" with ${details.episodes.length} episodes`)
        markHealthy(provider)
        return details
      }
    } catch (err) {
      console.error(`[SourceManager] Cross-provider ${provider.name} failed: ${err.message}`)
    }
  }
  return null
}

/**
 * Cross-provider fallback for video: search by title, find the episode, get video.
 */
async function crossProviderVideo(title, episodeNumber) {
  if (!title) return null
  console.log(`[SourceManager] Cross-provider video fallback for "${title}" ep ${episodeNumber}`)

  for (const provider of contentProviders) {
    if (!isHealthy(provider)) continue
    try {
      const results = await provider.search(title)
      const match = bestMatch(results, title)
      if (!match) continue

      const session = await provider.resolveEpisodeSession(match.animeId, episodeNumber)
      if (!session) continue

      const video = await provider.getVideo(match.animeId, session)
      if (video && hasVideoSources(video)) {
        console.log(`[SourceManager] Cross-provider: ${provider.name} has video for "${match.title}" ep ${episodeNumber}`)
        markHealthy(provider)
        return video
      }
    } catch (err) {
      console.error(`[SourceManager] Cross-provider video ${provider.name} failed: ${err.message}`)
    }
  }
  return null
}

function hasVideoSources(video) {
  if (!video) return false
  const subKeys = video.sub ? Object.keys(video.sub).length : 0
  const dubKeys = video.dub ? Object.keys(video.dub).length : 0
  return subKeys + dubKeys > 0
}

function hasGoodDetails(details) {
  return details && details.episodes && details.episodes.length > 0
}

/**
 * Enrich episode list with thumbnails and titles from Kitsu.
 * Falls back to the anime cover image if no snapshot is available.
 */
async function enrichEpisodes(details) {
  if (!details || !details.episodes || details.episodes.length === 0) return
  try {
    const title = details.title
    if (!title) return

    const epMeta = await kitsu.getEpisodeMeta(title)
    if (!epMeta) return

    for (const ep of details.episodes) {
      const meta = epMeta[ep.episodeNumber]
      if (meta) {
        if (meta.snapshot) ep.snapshot = meta.snapshot
        if (meta.title && meta.title !== `Episode ${ep.episodeNumber}`) {
          ep.title = meta.title
        }
      }
      // Fallback: use anime cover if no snapshot
      if (!ep.snapshot && details.cover) {
        ep.snapshot = details.cover
      }
    }
    console.log(`[SourceManager] Enriched ${details.episodes.length} episodes with Kitsu thumbnails for "${title}"`)
  } catch (err) {
    console.error(`[SourceManager] Episode enrichment failed: ${err.message}`)
    // Non-critical — fall back to cover for all
    for (const ep of details.episodes) {
      if (!ep.snapshot && details.cover) {
        ep.snapshot = details.cover
      }
    }
  }
}

// --- Public API ---

export async function getFeaturedAnime() {
  const cacheKey = "featured"
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const trending = await tryProviders(
    metadataProviders,
    (p) => p.getTrending(20),
    "trending",
  )

  if (!trending || trending.length === 0) return []

  const results = []

  for (const anime of trending) {
    const matched = await tryProviders(
      contentProviders,
      async (p) => {
        const searchResults = await p.search(anime.title)
        const match = bestMatch(searchResults, anime.title)
        if (match) {
          return {
            ...anime,
            animeId: match.animeId,
            thumbnail: anime.thumbnail || match.thumbnail,
            contentSource: match.source,
          }
        }
        return null
      },
      `featured search "${anime.title}"`,
    )

    if (matched) {
      rememberTitle(matched.animeId, anime.title)
      results.push(matched)
    } else {
      results.push(anime)
    }
  }

  console.log(`[SourceManager] Featured: ${results.length} anime resolved`)
  cache.set(cacheKey, results, ONE_DAY_MS)
  return results
}

export async function searchAnime(query) {
  const cacheKey = `search:${query.toLowerCase().trim()}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  // Search ALL providers and merge results (deduplicated by title similarity)
  const allResults = []
  const seenTitles = new Set()

  for (const provider of contentProviders) {
    if (!isHealthy(provider)) continue
    try {
      const results = await provider.search(query)
      if (results && results.length > 0) {
        markHealthy(provider)
        for (const r of results) {
          const norm = normalize(r.title)
          if (!seenTitles.has(norm)) {
            seenTitles.add(norm)
            allResults.push(r)
            rememberTitle(r.animeId, r.title)
          }
        }
      }
    } catch (err) {
      markFailed(provider)
      console.error(`[SourceManager] ${provider.name} search failed: ${err.message}`)
    }
  }

  if (allResults.length > 0) {
    cache.set(cacheKey, allResults)
  }
  return allResults
}

export async function getAnimeDetails(animeId) {
  const cacheKey = `anime:${animeId}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const orderedProviders = getProvidersForId(animeId)

  // Try the primary provider(s) for this ID format
  const result = await tryProviders(
    orderedProviders,
    (p) => p.getDetails(animeId),
    `details "${animeId}"`,
    hasGoodDetails, // validate: must have episodes
  )

  if (result) {
    rememberTitle(animeId, result.title)
    // Enrich episodes with Kitsu thumbnails
    await enrichEpisodes(result)
    cache.set(cacheKey, result)
    return result
  }

  // Primary provider returned empty/broken data — cross-provider fallback
  const title = getKnownTitle(animeId) || titleFromSlug(animeId)
  const fallback = await crossProviderDetails(title)
  if (fallback) {
    rememberTitle(animeId, fallback.title)
    await enrichEpisodes(fallback)
    cache.set(cacheKey, fallback)
    return fallback
  }

  // Last resort: return whatever partial data we got (at least shows something)
  const partial = await tryProviders(
    orderedProviders,
    (p) => p.getDetails(animeId),
    `details partial "${animeId}"`,
  )
  if (partial) {
    rememberTitle(animeId, partial.title)
    cache.set(cacheKey, partial)
  }
  return partial
}

export async function getEpisodeVideo(animeId, episodeSession) {
  const cacheKey = `episode:${animeId}:${episodeSession}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const orderedProviders = getProvidersForId(animeId)

  // Try primary provider
  const result = await tryProviders(
    orderedProviders,
    (p) => p.getVideo(animeId, episodeSession),
    `video "${animeId}/${episodeSession}"`,
    hasVideoSources, // validate: must have actual video URLs
  )

  if (result) {
    cache.set(cacheKey, result)
    return result
  }

  // Cross-provider fallback: search by title and get video from another provider
  const title = getKnownTitle(animeId) || titleFromSlug(animeId)
  // Extract episode number from the session
  const epNumMatch = episodeSession.match(/episode[- ]?(\d+)/i) || episodeSession.match(/ep=(\d+)/)
  const epNum = epNumMatch ? epNumMatch[1] : null

  if (title && epNum) {
    const fallback = await crossProviderVideo(title, epNum)
    if (fallback) {
      cache.set(cacheKey, fallback)
      return fallback
    }
  }

  // Return empty result rather than null (so the UI can show "no sources" vs error)
  return { episodeSession, sub: {}, dub: {}, watchUrl: "", source: "fallback" }
}

export async function resolveEpisodeSession(animeId, episodeNumber) {
  const orderedProviders = getProvidersForId(animeId)

  const session = await tryProviders(
    orderedProviders,
    (p) => p.resolveEpisodeSession(animeId, episodeNumber),
    `resolve ep ${episodeNumber} of "${animeId}"`,
  )

  if (session) return session

  // Cross-provider fallback: search by title, get episodes, find the right one
  const title = getKnownTitle(animeId) || titleFromSlug(animeId)
  if (title) {
    console.log(`[SourceManager] Cross-provider resolve for "${title}" ep ${episodeNumber}`)
    for (const provider of contentProviders) {
      if (!isHealthy(provider)) continue
      try {
        const results = await provider.search(title)
        const match = bestMatch(results, title)
        if (!match) continue
        const s = await provider.resolveEpisodeSession(match.animeId, episodeNumber)
        if (s) {
          console.log(`[SourceManager] Cross-provider: ${provider.name} resolved ep ${episodeNumber}`)
          // Store the cross-provider animeId so getEpisodeVideo can use it
          cache.set(`xprovider:${animeId}:${episodeNumber}`, {
            animeId: match.animeId,
            session: s,
            provider: provider.name,
          })
          return s
        }
      } catch (err) {
        console.error(`[SourceManager] Cross-provider resolve ${provider.name} failed: ${err.message}`)
      }
    }
  }

  return null
}

// --- Genre & Category APIs (AniList-powered, no content provider needed) ---

export async function getGenres() {
  const cacheKey = "genres"
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const genres = await anilist.getGenres()
  cache.set(cacheKey, genres, ONE_DAY_MS)
  return genres
}

export async function getByGenre(genre, page = 1, limit = 24) {
  const cacheKey = `genre:${genre}:${page}:${limit}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const result = await anilist.getByGenre(genre, page, limit)
  cache.set(cacheKey, result)
  return result
}

export async function getPopular() {
  const cacheKey = "popular"
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const results = await anilist.getPopular(20)
  cache.set(cacheKey, results)
  return results
}

export async function getTopRated() {
  const cacheKey = "top-rated"
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const results = await anilist.getTopRated(20)
  cache.set(cacheKey, results)
  return results
}

export async function getRecent() {
  const cacheKey = "recent"
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const results = await anilist.getRecent(20)
  cache.set(cacheKey, results)
  return results
}

export async function getRelatedAnime(title) {
  const cacheKey = `related:${title.toLowerCase().trim()}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const groups = await anilist.getRelations(title)
  if (!groups || Object.values(groups).every((arr) => arr.length === 0)) return groups

  for (const groupName of Object.keys(groups)) {
    const resolved = []
    for (const anime of groups[groupName]) {
      const matched = await tryProviders(
        contentProviders,
        async (p) => {
          const searchResults = await p.search(anime.title)
          const match = bestMatch(searchResults, anime.title)
          if (match) {
            return { ...anime, animeId: match.animeId, contentSource: match.source }
          }
          return null
        },
        `related search "${anime.title}"`,
      )
      resolved.push(matched || anime)
    }
    groups[groupName] = resolved
  }

  cache.set(cacheKey, groups, ONE_DAY_MS)
  return groups
}

export function getProviderStatus() {
  return {
    metadata: metadataProviders.map((p) => ({
      name: p.name,
      healthy: isHealthy(p),
    })),
    content: contentProviders.map((p) => ({
      name: p.name,
      healthy: isHealthy(p),
    })),
  }
}
