import axios from "axios"

const API = "http://localhost:3001/api/chat"

function authHeader() {
  const token = localStorage.getItem("aniview_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getMessages(animeId, { episode, page } = {}) {
  const params = { page: page || 1 }
  if (episode != null) params.episode = episode
  const { data } = await axios.get(`${API}/${encodeURIComponent(animeId)}`, { params })
  return data
}

export async function sendMessage(animeId, { message, animeTitle, episodeNumber }) {
  const { data } = await axios.post(
    `${API}/${encodeURIComponent(animeId)}`,
    { message, animeTitle, episodeNumber },
    { headers: authHeader() },
  )
  return data
}

export async function deleteMessage(id) {
  const { data } = await axios.delete(`${API}/message/${id}`, { headers: authHeader() })
  return data
}

export async function getActiveChats() {
  const { data } = await axios.get(`${API}/active`)
  return data
}
