import Achievement, { BADGES } from "../models/Achievement.js"
import User from "../models/User.js"

const BADGE_META = {
  first_watch: { title: "First Steps", description: "Watch your first episode", icon: "🎬" },
  binge_watcher: { title: "Binge Watcher", description: "Watch 12+ episodes in a single day", icon: "🔥" },
  night_owl: { title: "Night Owl", description: "Watch an episode between midnight and 5 AM", icon: "🦉" },
  genre_explorer_action: { title: "Action Hero", description: "Watch 5 action anime", icon: "⚔️" },
  genre_explorer_romance: { title: "Hopeless Romantic", description: "Watch 5 romance anime", icon: "💕" },
  episodes_10: { title: "Getting Started", description: "Watch 10 episodes total", icon: "📺" },
  episodes_50: { title: "Dedicated Viewer", description: "Watch 50 episodes total", icon: "🏅" },
  episodes_100: { title: "Centurion", description: "Watch 100 episodes total", icon: "💯" },
  episodes_500: { title: "Anime Legend", description: "Watch 500 episodes total", icon: "👑" },
  completionist: { title: "Completionist", description: "Finish an anime series (100% progress)", icon: "✅" },
  social_butterfly: { title: "Social Butterfly", description: "Post 5 discussion messages", icon: "🦋" },
  critic_10: { title: "Anime Critic", description: "Rate 10 different anime", icon: "⭐" },
}

async function unlock(userId, badge) {
  try {
    await Achievement.create({ userId, badge })
    return true
  } catch {
    // Duplicate — already unlocked
    return false
  }
}

export async function checkAndUnlock(userId) {
  const user = await User.findById(userId)
  if (!user) return []

  const unlocked = []
  const history = user.watchHistory || []
  const totalEpisodes = history.length

  // first_watch
  if (totalEpisodes >= 1 && await unlock(userId, "first_watch")) unlocked.push("first_watch")

  // episodes milestones
  if (totalEpisodes >= 10 && await unlock(userId, "episodes_10")) unlocked.push("episodes_10")
  if (totalEpisodes >= 50 && await unlock(userId, "episodes_50")) unlocked.push("episodes_50")
  if (totalEpisodes >= 100 && await unlock(userId, "episodes_100")) unlocked.push("episodes_100")
  if (totalEpisodes >= 500 && await unlock(userId, "episodes_500")) unlocked.push("episodes_500")

  // night_owl: any watch between midnight-5AM
  const hasNightWatch = history.some((w) => {
    const hour = new Date(w.watchedAt).getHours()
    return hour >= 0 && hour < 5
  })
  if (hasNightWatch && await unlock(userId, "night_owl")) unlocked.push("night_owl")

  // binge_watcher: 12+ episodes in same calendar day
  const dayMap = {}
  for (const w of history) {
    const day = new Date(w.watchedAt).toDateString()
    dayMap[day] = (dayMap[day] || 0) + 1
  }
  const hasBinge = Object.values(dayMap).some((count) => count >= 12)
  if (hasBinge && await unlock(userId, "binge_watcher")) unlocked.push("binge_watcher")

  // completionist: any watchProgress at 100%
  const hasComplete = (user.watchProgress || []).some((wp) => wp.progress >= 100)
  if (hasComplete && await unlock(userId, "completionist")) unlocked.push("completionist")

  return unlocked
}

export async function getAchievements(userId) {
  const achievements = await Achievement.find({ userId }).lean()
  const user = await User.findById(userId).select("watchHistory watchProgress").lean()
  const totalEpisodes = user?.watchHistory?.length || 0

  return BADGES.map((badge) => {
    const earned = achievements.find((a) => a.badge === badge)
    const meta = BADGE_META[badge]
    const progress = getBadgeProgress(badge, totalEpisodes, user)
    return {
      badge,
      ...meta,
      unlocked: !!earned,
      unlockedAt: earned?.unlockedAt || null,
      progress,
    }
  })
}

function getBadgeProgress(badge, totalEpisodes, user) {
  switch (badge) {
    case "first_watch": return { current: Math.min(totalEpisodes, 1), target: 1 }
    case "episodes_10": return { current: Math.min(totalEpisodes, 10), target: 10 }
    case "episodes_50": return { current: Math.min(totalEpisodes, 50), target: 50 }
    case "episodes_100": return { current: Math.min(totalEpisodes, 100), target: 100 }
    case "episodes_500": return { current: Math.min(totalEpisodes, 500), target: 500 }
    default: return null
  }
}

export { BADGE_META }
