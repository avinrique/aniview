import axios from "axios";

const api = axios.create({
  baseURL: "aniview-kkz1exag6-avinriques-projects.vercel.app/api",
  timeout: 60000,
});

export async function getFeaturedAnime() {
  const { data } = await api.get("/featured");
  return data.results;
}

export async function searchAnime(query) {
  const { data } = await api.get("/search", { params: { q: query } });
  return data.results;
}

export async function getAnimeDetails(animeId) {
  const { data } = await api.get(`/anime/${animeId}`);
  return data;
}

export async function getEpisodeVideo(animeId, episodeNumber) {
  const { data } = await api.get(`/episode/${animeId}/${episodeNumber}`);
  return data;
}

export async function getGenres() {
  const { data } = await api.get("/genres");
  return data.genres;
}

export async function getByGenre(genre, page = 1) {
  const { data } = await api.get(`/genre/${encodeURIComponent(genre)}`, {
    params: { page },
  });
  return data;
}

export async function getPopular() {
  const { data } = await api.get("/popular");
  return data.results;
}

export async function getTopRated() {
  const { data } = await api.get("/top-rated");
  return data.results;
}

export async function getRecent() {
  const { data } = await api.get("/recent");
  return data.results;
}

export async function getRelatedAnime(title) {
  const { data } = await api.get("/related", { params: { title } });
  return data;
}
