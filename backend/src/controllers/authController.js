import jwt from "jsonwebtoken"
import config from "../config/index.js"
import User from "../models/User.js"
import { checkAndUnlock } from "./achievementController.js"
import UserCoins from "../models/UserCoins.js"

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiry,
  })
}

export async function register(req, res, next) {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" })
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: "Username can only contain letters, numbers, and underscores" })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" })
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] })
    if (existing) {
      return res.status(409).json({
        error: existing.email === email ? "Email already registered" : "Username already taken",
      })
    }

    const user = await User.create({ username, email, password })
    const token = signToken(user)
    res.status(201).json({ token, user: user.toPublic() })
  } catch (err) {
    next(err)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" })
    }

    const token = signToken(user)
    res.json({ token, user: user.toPublic() })
  } catch (err) {
    next(err)
  }
}

export async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: "User not found" })
    res.json({ user: user.toPublic() })
  } catch (err) {
    next(err)
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { username, avatar } = req.body
    const updates = {}

    if (username) {
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ error: "Invalid username format" })
      }
      const existing = await User.findOne({ username, _id: { $ne: req.userId } })
      if (existing) return res.status(409).json({ error: "Username already taken" })
      updates.username = username
    }
    if (avatar !== undefined) updates.avatar = avatar

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true })
    if (!user) return res.status(404).json({ error: "User not found" })
    res.json({ user: user.toPublic() })
  } catch (err) {
    next(err)
  }
}

export async function addFavorite(req, res, next) {
  try {
    const { animeId, animeTitle, animeThumbnail } = req.body
    if (!animeId || !animeTitle) {
      return res.status(400).json({ error: "animeId and animeTitle are required" })
    }

    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: "User not found" })

    const already = user.favorites.find((f) => f.animeId === animeId)
    if (already) return res.json({ user: user.toPublic() })

    user.favorites.push({ animeId, animeTitle, animeThumbnail })
    await user.save()
    res.json({ user: user.toPublic() })
  } catch (err) {
    next(err)
  }
}

export async function removeFavorite(req, res, next) {
  try {
    const { animeId } = req.params
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: "User not found" })

    user.favorites = user.favorites.filter((f) => f.animeId !== animeId)
    await user.save()
    res.json({ user: user.toPublic() })
  } catch (err) {
    next(err)
  }
}

export async function updateWatchProgress(req, res, next) {
  try {
    const { animeId, episodeNumber, progress } = req.body
    if (!animeId || episodeNumber == null || progress == null) {
      return res.status(400).json({ error: "animeId, episodeNumber, and progress are required" })
    }

    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: "User not found" })

    const existing = user.watchProgress.find(
      (w) => w.animeId === animeId && w.episodeNumber === Number(episodeNumber),
    )
    if (existing) {
      existing.progress = Math.min(100, Math.max(0, Number(progress)))
      existing.updatedAt = new Date()
    } else {
      user.watchProgress.push({
        animeId,
        episodeNumber: Number(episodeNumber),
        progress: Math.min(100, Math.max(0, Number(progress))),
      })
    }

    // Keep last 500 entries
    if (user.watchProgress.length > 500) {
      user.watchProgress = user.watchProgress.slice(-500)
    }

    await user.save()
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function addWatchHistory(req, res, next) {
  try {
    const { animeId, animeTitle, animeThumbnail, episodeNumber } = req.body
    if (!animeId || !animeTitle) {
      return res.status(400).json({ error: "animeId and animeTitle are required" })
    }

    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: "User not found" })

    // Remove old entry for same anime+episode, then add new
    user.watchHistory = user.watchHistory.filter(
      (w) => !(w.animeId === animeId && w.episodeNumber === episodeNumber),
    )
    user.watchHistory.push({ animeId, animeTitle, animeThumbnail, episodeNumber })

    // Keep last 200 entries
    if (user.watchHistory.length > 200) {
      user.watchHistory = user.watchHistory.slice(-200)
    }

    await user.save()

    // Check for new achievement unlocks (fire-and-forget)
    checkAndUnlock(req.userId).catch(() => {})

    // Award 10 AniCoins for watching an episode (fire-and-forget)
    ;(async () => {
      let coins = await UserCoins.findOne({ userId: req.userId })
      if (!coins) coins = await UserCoins.create({ userId: req.userId })
      coins.balance += 10
      coins.totalEarned += 10
      // Update watch streak
      const now = new Date()
      const today = now.toDateString()
      if (!coins.lastWatchDate || coins.lastWatchDate.toDateString() !== today) {
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        if (coins.lastWatchDate && coins.lastWatchDate.toDateString() === yesterday.toDateString()) {
          coins.watchStreak += 1
        } else {
          coins.watchStreak = 1
        }
        coins.lastWatchDate = now
        if (coins.watchStreak > 0 && coins.watchStreak % 7 === 0) {
          coins.balance += 100
          coins.totalEarned += 100
        }
      }
      await coins.save()
    })().catch(() => {})

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}
