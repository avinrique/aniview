import {
  searchAnime,
  getAnimeDetails,
  getEpisodeVideo,
  resolveEpisodeSession,
  getFeaturedAnime,
  getProviderStatus,
  getGenres,
  getByGenre,
  getPopular,
  getTopRated,
  getRecent,
  getRelatedAnime,
} from "../services/sourceManager.js"

/**
 * GET /api/featured
 */
export async function featured(req, res, next) {
  try {
    const results = await getFeaturedAnime()
    res.json({ results })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/search?q=naruto
 */
export async function search(req, res, next) {
  try {
    const query = req.query.q
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({ error: "Query parameter 'q' is required" })
    }

    if (query.length > 200) {
      return res.status(400).json({ error: "Query too long" })
    }

    const results = await searchAnime(query.trim())
    res.json({ results })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/anime/:animeId
 */
export async function animeDetails(req, res, next) {
  try {
    const { animeId } = req.params
    if (!animeId || !/^[a-zA-Z0-9_?=&./-]+$/.test(animeId)) {
      return res.status(400).json({ error: "Invalid anime ID" })
    }

    const details = await getAnimeDetails(animeId)
    if (!details) {
      return res.status(404).json({ error: "Anime not found" })
    }
    res.json(details)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/episode/:animeId/:episodeNumber
 */
export async function episode(req, res, next) {
  try {
    const { animeId, episodeNumber } = req.params

    if (!animeId || !/^[a-zA-Z0-9_?=&./-]+$/.test(animeId)) {
      return res.status(400).json({ error: "Invalid anime ID" })
    }
    if (!episodeNumber || !/^\d+(\.\d+)?$/.test(episodeNumber)) {
      return res.status(400).json({ error: "Invalid episode number" })
    }

    const session = await resolveEpisodeSession(animeId, episodeNumber)
    if (!session) {
      return res.status(404).json({ error: "Episode not found" })
    }

    const video = await getEpisodeVideo(animeId, session)
    if (!video) {
      return res.status(404).json({ error: "Video sources not found" })
    }
    res.json({ episodeNumber, ...video })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/genres
 */
export async function genres(req, res, next) {
  try {
    const list = await getGenres()
    res.json({ genres: list })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/genre/:genre?page=1
 */
export async function genre(req, res, next) {
  try {
    const { genre: genreName } = req.params
    const page = parseInt(req.query.page) || 1

    if (!genreName || genreName.length > 50) {
      return res.status(400).json({ error: "Invalid genre" })
    }

    const result = await getByGenre(genreName, page)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/popular
 */
export async function popular(req, res, next) {
  try {
    const results = await getPopular()
    res.json({ results })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/top-rated
 */
export async function topRated(req, res, next) {
  try {
    const results = await getTopRated()
    res.json({ results })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/recent
 */
export async function recent(req, res, next) {
  try {
    const results = await getRecent()
    res.json({ results })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/related?title=...
 */
export async function related(req, res, next) {
  try {
    const title = req.query.title
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "Query parameter 'title' is required" })
    }
    if (title.length > 200) {
      return res.status(400).json({ error: "Title too long" })
    }
    const result = await getRelatedAnime(title.trim())
    res.json(result || { sequels: [], prequels: [], sideStories: [], spinOffs: [], others: [] })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/sources/status
 */
export async function sourcesStatus(req, res) {
  res.json(getProviderStatus())
}
