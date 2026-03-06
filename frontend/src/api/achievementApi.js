import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001/api/achievements",
  timeout: 10000,
});

export async function getMyAchievements(token) {
  const { data } = await api.get("/", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.achievements;
}

export async function getUserAchievements(userId) {
  const { data } = await api.get(`/${userId}`);
  return data.achievements;
}
