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
const contentProviders = [animepahe, gogoanime, zoro]

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

async function tryProviders(providers, operation, label) {
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
        markHealthy(provider)
        return result
      }
    } catch (err) {
      errors.push(`${provider.name} (retry): ${err.message}`)
    }
  }

  console.error(`[SourceManager] All providers failed for ${label}:`, errors)
  return Array.isArray(errors) ? [] : null
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

  // Extract season/part numbers
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

  // If target has a season but candidate doesn't (base series), penalize
  if (tSeason && !cSeason && !candidate.match(/culling|game|part|arc/i)) return 0.2
  // If both have seasons and they differ, heavy penalty
  if (tSeason && cSeason && tSeason !== cSeason) return 0.1
  if (tPart && cPart && tPart !== cPart) return 0.15

  // Word overlap using actual words (not bigrams)
  const targetWords = extractWords(target)
  const candidateWords = extractWords(candidate)
  const targetSet = new Set(targetWords)
  const candidateSet = new Set(candidateWords)

  let matchCount = 0
  for (const w of candidateSet) {
    if (targetSet.has(w)) matchCount++
  }

  // Jaccard-like score: overlap / union
  const union = new Set([...targetWords, ...candidateWords]).size
  const wordScore = matchCount / Math.max(union, 1)

  // Bonus for substring containment (longer match = better)
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
  return best
}

// --- Public API ---

export async function getFeaturedAnime() {
  const cacheKey = "featured"
  const cached = cache.get(cacheKey)
  if (cached) return cached

  // Step 1: Get trending titles from metadata providers
  const trending = await tryProviders(
    metadataProviders,
    (p) => p.getTrending(20),
    "trending",
  )

  if (!trending || trending.length === 0) return []

  // Step 2: For each title, try to find it on a content provider to get animeId
  const page = await getContentSearcher()
  const results = []

  for (const anime of trending) {
    // Try to search on the primary content provider to get a playable animeId
    const matched = await tryProviders(
      contentProviders,
      async (p) => {
        const searchResults = await p.search(anime.title)
        const match = bestMatch(searchResults, anime.title)
        if (match) {
          console.log(`[SourceManager] Matched "${anime.title}" -> "${match.title}"`)
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
      results.push(matched)
    } else {
      // Still include the anime even without a content match (metadata only)
      results.push(anime)
    }
  }

  console.log(`[SourceManager] Featured: ${results.length} anime resolved`)
  cache.set(cacheKey, results, ONE_DAY_MS)
  return results
}

async function getContentSearcher() {
  return null // placeholder - content providers manage their own pages
}

export async function searchAnime(query) {
  const cacheKey = `search:${query.toLowerCase().trim()}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const results = await tryProviders(
    contentProviders,
    (p) => p.search(query),
    `search "${query}"`,
  )

  if (results && results.length > 0) {
    cache.set(cacheKey, results)
  }
  return results || []
}

export async function getAnimeDetails(animeId) {
  const cacheKey = `anime:${animeId}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  // Determine which provider this animeId belongs to based on format
  const orderedProviders = getProvidersForId(animeId)

  const result = await tryProviders(
    orderedProviders,
    (p) => p.getDetails(animeId),
    `details "${animeId}"`,
  )

  if (result) cache.set(cacheKey, result)
  return result
}

export async function getEpisodeVideo(animeId, episodeSession) {
  const cacheKey = `episode:${animeId}:${episodeSession}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const orderedProviders = getProvidersForId(animeId)

  const result = await tryProviders(
    orderedProviders,
    (p) => p.getVideo(animeId, episodeSession),
    `video "${animeId}/${episodeSession}"`,
  )

  if (result) cache.set(cacheKey, result)
  return result
}

export async function resolveEpisodeSession(animeId, episodeNumber) {
  const orderedProviders = getProvidersForId(animeId)

  return await tryProviders(
    orderedProviders,
    (p) => p.resolveEpisodeSession(animeId, episodeNumber),
    `resolve ep ${episodeNumber} of "${animeId}"`,
  )
}

// Heuristic: determine which provider an animeId likely came from
function getProvidersForId(animeId) {
  // AnimePahe IDs are UUIDs (8-4-4-4-12 hex)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(animeId)) {
    return [animepahe, ...contentProviders.filter((p) => p.name !== "animepahe")]
  }
  // Gogoanime IDs are slugs like "one-piece"
  if (/^[a-z0-9-]+$/.test(animeId) && !animeId.includes("/")) {
    return [gogoanime, ...contentProviders.filter((p) => p.name !== "gogoanime")]
  }
  // Zoro IDs contain a slug with possible ?ep= or numeric suffix
  if (animeId.includes("?ep=") || /\d+$/.test(animeId)) {
    return [zoro, ...contentProviders.filter((p) => p.name !== "zoro")]
  }
  // Default order
  return contentProviders
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

  // For each related anime, try to resolve a content provider animeId
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
