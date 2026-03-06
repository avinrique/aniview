import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001/api/gacha",
  timeout: 10000,
});

function authHeader(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export async function getCoins(token) {
  const { data } = await api.get("/coins", authHeader(token));
  return data;
}

export async function claimDailyLogin(token) {
  const { data } = await api.post("/coins/daily", {}, authHeader(token));
  return data;
}

export async function awardCoins(token, amount, reason) {
  const { data } = await api.post("/coins/award", { amount, reason }, authHeader(token));
  return data;
}

export async function singlePull(token) {
  const { data } = await api.post("/pull", {}, authHeader(token));
  return data;
}

export async function multiPull(token) {
  const { data } = await api.post("/pull-multi", {}, authHeader(token));
  return data;
}

export async function getCollection(token) {
  const { data } = await api.get("/collection", authHeader(token));
  return data;
}
