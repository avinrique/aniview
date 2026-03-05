// AniList GraphQL API - metadata provider (trending, search, genres, categories)
const ANILIST_URL = "https://graphql.anilist.co"

async function gql(query, variables = {}) {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`AniList HTTP ${res.status}`)
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
}

const MEDIA_FIELDS = `
  id
  title { english romaji }
  coverImage { large extraLarge }
  bannerImage
  episodes
  status
  format
  genres
  averageScore
  popularity
  season
  seasonYear
  startDate { year }
  description(asHtml: false)
`

function mapMedia(m) {
  return {
    title: m.title.english || m.title.romaji,
    thumbnail: m.coverImage.extraLarge || m.coverImage.large,
    banner: m.bannerImage,
    episodes: m.episodes || 0,
    status: m.status === "RELEASING" ? "Currently Airing" : m.status === "FINISHED" ? "Finished Airing" : m.status,
    type: m.format || "TV",
    genres: m.genres || [],
    score: m.averageScore,
    popularity: m.popularity,
    releaseYear: m.startDate?.year || m.seasonYear,
    season: m.season,
    description: m.description,
    source: "anilist",
  }
}

export async function getTrending(limit = 20) {
  const data = await gql(`
    query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, sort: TRENDING_DESC) { ${MEDIA_FIELDS} }
      }
    }
  `, { perPage: limit })
  return data.Page.media.map(mapMedia)
}

export async function getPopular(limit = 20) {
  const data = await gql(`
    query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, sort: POPULARITY_DESC, status: RELEASING) { ${MEDIA_FIELDS} }
      }
    }
  `, { perPage: limit })
  return data.Page.media.map(mapMedia)
}

export async function getTopRated(limit = 20) {
  const data = await gql(`
    query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, sort: SCORE_DESC, status: FINISHED) { ${MEDIA_FIELDS} }
      }
    }
  `, { perPage: limit })
  return data.Page.media.map(mapMedia)
}

export async function getRecent(limit = 20) {
  const data = await gql(`
    query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, sort: START_DATE_DESC, status: RELEASING) { ${MEDIA_FIELDS} }
      }
    }
  `, { perPage: limit })
  return data.Page.media.map(mapMedia)
}

export async function getByGenre(genre, page = 1, limit = 24) {
  const data = await gql(`
    query ($genre: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(type: ANIME, genre: $genre, sort: POPULARITY_DESC) { ${MEDIA_FIELDS} }
      }
    }
  `, { genre, page, perPage: limit })
  return {
    results: data.Page.media.map(mapMedia),
    pageInfo: data.Page.pageInfo,
  }
}

export async function getGenres() {
  const data = await gql(`{ GenreCollection }`)
  // Filter out adult genre
  return (data.GenreCollection || []).filter((g) => g !== "Hentai")
}

export async function getRelations(title) {
  const data = await gql(`
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        relations {
          edges {
            relationType
            node {
              id
              title { english romaji }
              coverImage { large extraLarge }
              format
              status
              episodes
              startDate { year }
              averageScore
            }
          }
        }
      }
    }
  `, { search: title })

  if (!data.Media?.relations?.edges) return {}

  const groups = { sequels: [], prequels: [], sideStories: [], spinOffs: [], others: [] }
  const typeMap = {
    SEQUEL: "sequels",
    PREQUEL: "prequels",
    SIDE_STORY: "sideStories",
    SPIN_OFF: "spinOffs",
  }

  for (const edge of data.Media.relations.edges) {
    const node = edge.node
    if (node.format !== "TV" && node.format !== "TV_SHORT" && node.format !== "MOVIE" && node.format !== "OVA" && node.format !== "ONA" && node.format !== "SPECIAL") continue

    const group = typeMap[edge.relationType] || "others"
    groups[group].push({
      anilistId: node.id,
      title: node.title.english || node.title.romaji,
      thumbnail: node.coverImage?.extraLarge || node.coverImage?.large,
      episodes: node.episodes || 0,
      status: node.status === "RELEASING" ? "Currently Airing" : node.status === "FINISHED" ? "Finished Airing" : node.status,
      type: node.format || "TV",
      releaseYear: node.startDate?.year,
      score: node.averageScore,
    })
  }

  return groups
}

export async function searchByTitle(query, limit = 10) {
  const data = await gql(`
    query ($search: String, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(search: $search, type: ANIME, sort: SEARCH_MATCH) { ${MEDIA_FIELDS} }
      }
    }
  `, { search: query, perPage: limit })
  return data.Page.media.map(mapMedia)
}

export default {
  name: "anilist",
  getTrending,
  getPopular,
  getTopRated,
  getRecent,
  getByGenre,
  getGenres,
  searchByTitle,
  getRelations,
}
