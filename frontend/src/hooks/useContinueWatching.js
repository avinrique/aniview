const STORAGE_KEY = "aniview_continue_watching";
const MAX_ITEMS = 20;

function getAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

/** Save or update progress for an anime episode */
export function saveProgress({ animeId, episodeNumber, animeTitle, thumbnail, progress }) {
  const items = getAll();
  const existing = items.findIndex((i) => i.animeId === animeId);

  const entry = {
    animeId,
    episodeNumber: Number(episodeNumber),
    animeTitle,
    thumbnail,
    progress: Math.min(100, Math.max(0, progress || 0)),
    updatedAt: Date.now(),
  };

  if (existing !== -1) {
    // Only update if same or later episode, or higher progress on same episode
    const prev = items[existing];
    if (
      entry.episodeNumber > prev.episodeNumber ||
      (entry.episodeNumber === prev.episodeNumber && entry.progress >= prev.progress)
    ) {
      items[existing] = { ...prev, ...entry };
    } else {
      // Still bump timestamp so it stays recent
      items[existing].updatedAt = Date.now();
      return;
    }
  } else {
    items.unshift(entry);
  }

  // Sort by most recently updated
  items.sort((a, b) => b.updatedAt - a.updatedAt);
  save(items);
}

/** Remove a completed anime or one the user wants to dismiss */
export function removeContinueWatching(animeId) {
  const items = getAll().filter((i) => i.animeId !== animeId);
  save(items);
}

/** Get all in-progress items (exclude 100% complete) */
export function getContinueWatching() {
  return getAll().filter((i) => i.progress < 100);
}
