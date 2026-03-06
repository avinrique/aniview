import axios from "axios"

const API = "http://localhost:3001/api/ratings"

function authHeader() {
  const token = localStorage.getItem("aniview_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getAnimeRating(animeId) {
  const { data } = await axios.get(`${API}/${encodeURIComponent(animeId)}`, {
    headers: authHeader(),
  })
  return data
}

export async function rateAnime(animeId, animeTitle, rating) {
  const { data } = await axios.post(API, { animeId, animeTitle, rating }, {
    headers: authHeader(),
  })
  return data
}
