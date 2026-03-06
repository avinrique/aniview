import axios from "axios"

const API = "http://localhost:3001/api/reels"

function authHeader() {
  const token = localStorage.getItem("aniview_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getReels(page = 1) {
  const { data } = await axios.get(API, { params: { page } })
  return data
}

export async function createReel(formData) {
  const { data } = await axios.post(API, formData, {
    headers: { ...authHeader(), "Content-Type": "multipart/form-data" },
    timeout: 60000,
  })
  return data
}

export async function toggleLike(id) {
  const { data } = await axios.post(`${API}/${id}/like`, {}, { headers: authHeader() })
  return data
}

export async function getPendingReels() {
  const { data } = await axios.get(`${API}/pending`, { headers: authHeader() })
  return data
}

export async function approveReel(id) {
  const { data } = await axios.put(`${API}/${id}/approve`, {}, { headers: authHeader() })
  return data
}

export async function rejectReel(id) {
  const { data } = await axios.put(`${API}/${id}/reject`, {}, { headers: authHeader() })
  return data
}

export async function deleteReel(id) {
  const { data } = await axios.delete(`${API}/${id}`, { headers: authHeader() })
  return data
}
