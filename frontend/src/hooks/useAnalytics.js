import { useEffect, useRef } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001/api/analytics",
  timeout: 5000,
});

function getSessionId() {
  let sid = sessionStorage.getItem("aniview_sid");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("aniview_sid", sid);
  }
  return sid;
}

function getToken() {
  return localStorage.getItem("aniview_token");
}

function track(type, data = {}) {
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  api.post("/track", {
    type,
    sessionId: getSessionId(),
    path: window.location.pathname,
    ...data,
  }, { headers }).catch(() => {});
}

export function trackPageView() {
  track("page_view");
}

export function trackAnimeView(animeId, animeTitle) {
  track("anime_view", { animeId, animeTitle });
}

export function trackEpisodeWatch(animeId, animeTitle, episodeNumber) {
  track("episode_watch", { animeId, animeTitle, episodeNumber });
}

export function trackSearch(query) {
  track("search", { searchQuery: query });
}

export function usePageView() {
  const tracked = useRef(false);
  useEffect(() => {
    if (!tracked.current) {
      trackPageView();
      tracked.current = true;
    }
  }, []);
}
