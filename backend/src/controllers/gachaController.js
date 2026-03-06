import Collection from "../models/Collection.js"
import UserCoins from "../models/UserCoins.js"

const SINGLE_PULL_COST = 50
const MULTI_PULL_COST = 200
const MULTI_PULL_COUNT = 5

// Rarity weights for random selection
const RARITY_WEIGHTS = [
  { rarity: "common", weight: 50 },
  { rarity: "rare", weight: 30 },
  { rarity: "epic", weight: 15 },
  { rarity: "legendary", weight: 5 },
]

function rollRarity(guaranteeRarePlus = false) {
  const total = RARITY_WEIGHTS.reduce((s, r) => s + r.weight, 0)
  let roll = Math.random() * total
  for (const { rarity, weight } of RARITY_WEIGHTS) {
    roll -= weight
    if (roll <= 0) {
      if (guaranteeRarePlus && rarity === "common") {
        return "rare"
      }
      return rarity
    }
  }
  return "common"
}

// Character registry loaded on the backend too for validation
// We use a simple inline list of character IDs grouped by rarity
const CHARACTER_POOL = {
  common: [
    "chopper", "zenitsu-agatsuma", "death-note-book", "zoro-swords",
    "sukuna-finger", "tanjiro-sword",
    "chopper-monster", "gojo-shinjuku", "gojo-jjk", "naruto-hokage",
  ],
  rare: [
    "zoro-roronoa", "tanjiro-kamado", "todoroki-shoto", "rem",
    "nezuko-kamado", "killua-zoldyck", "light-yagami",
  ],
  epic: ["levi-ackerman", "zero-two", "mikasa-ackerman", "sukuna", "itachi-uchiha", "ryuk"],
  legendary: ["gojo-satoru", "naruto-uzumaki", "eren-yeager"],
}

function pullCharacter(guaranteeRarePlus = false) {
  const rarity = rollRarity(guaranteeRarePlus)
  const pool = CHARACTER_POOL[rarity]
  const characterId = pool[Math.floor(Math.random() * pool.length)]
  return { characterId, rarity }
}

async function getOrCreateCoins(userId) {
  let coins = await UserCoins.findOne({ userId })
  if (!coins) {
    coins = await UserCoins.create({ userId, balance: 0, totalEarned: 0 })
  }
  return coins
}

export async function getCoins(req, res, next) {
  try {
    const coins = await getOrCreateCoins(req.userId)
    res.json({
      balance: coins.balance,
      totalEarned: coins.totalEarned,
      watchStreak: coins.watchStreak,
      lastDailyLogin: coins.lastDailyLogin,
    })
  } catch (err) {
    next(err)
  }
}

export async function claimDailyLogin(req, res, next) {
  try {
    const coins = await getOrCreateCoins(req.userId)
    const now = new Date()
    const today = now.toDateString()

    if (coins.lastDailyLogin && coins.lastDailyLogin.toDateString() === today) {
      return res.status(400).json({ error: "Already claimed today" })
    }

    const reward = 5
    coins.balance += reward
    coins.totalEarned += reward
    coins.lastDailyLogin = now
    await coins.save()

    res.json({ reward, balance: coins.balance })
  } catch (err) {
    next(err)
  }
}

export async function singlePull(req, res, next) {
  try {
    const coins = await getOrCreateCoins(req.userId)
    if (coins.balance < SINGLE_PULL_COST) {
      return res.status(400).json({ error: "Not enough AniCoins", required: SINGLE_PULL_COST, balance: coins.balance })
    }

    coins.balance -= SINGLE_PULL_COST
    await coins.save()

    const result = pullCharacter()
    await Collection.create({ userId: req.userId, characterId: result.characterId })

    res.json({ pull: result, balance: coins.balance })
  } catch (err) {
    next(err)
  }
}

export async function multiPull(req, res, next) {
  try {
    const coins = await getOrCreateCoins(req.userId)
    if (coins.balance < MULTI_PULL_COST) {
      return res.status(400).json({ error: "Not enough AniCoins", required: MULTI_PULL_COST, balance: coins.balance })
    }

    coins.balance -= MULTI_PULL_COST
    await coins.save()

    const results = []
    let hasRarePlus = false
    for (let i = 0; i < MULTI_PULL_COUNT; i++) {
      const isLast = i === MULTI_PULL_COUNT - 1
      const guaranteeRare = isLast && !hasRarePlus
      const result = pullCharacter(guaranteeRare)
      if (result.rarity !== "common") hasRarePlus = true
      results.push(result)
      await Collection.create({ userId: req.userId, characterId: result.characterId })
    }

    res.json({ pulls: results, balance: coins.balance })
  } catch (err) {
    next(err)
  }
}

export async function getCollection(req, res, next) {
  try {
    const items = await Collection.find({ userId: req.userId }).sort({ obtainedAt: -1 })
    res.json({ collection: items })
  } catch (err) {
    next(err)
  }
}

export async function awardCoins(req, res, next) {
  try {
    const { amount, reason } = req.body
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" })
    }

    const coins = await getOrCreateCoins(req.userId)
    coins.balance += amount
    coins.totalEarned += amount

    // Track watch streaks
    if (reason === "watch_episode") {
      const now = new Date()
      const today = now.toDateString()
      if (!coins.lastWatchDate || coins.lastWatchDate.toDateString() !== today) {
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        if (coins.lastWatchDate && coins.lastWatchDate.toDateString() === yesterday.toDateString()) {
          coins.watchStreak += 1
        } else if (!coins.lastWatchDate || coins.lastWatchDate.toDateString() !== today) {
          coins.watchStreak = 1
        }
        coins.lastWatchDate = now

        // 7-day streak bonus
        if (coins.watchStreak > 0 && coins.watchStreak % 7 === 0) {
          coins.balance += 100
          coins.totalEarned += 100
        }
      }
    }

    await coins.save()
    res.json({ balance: coins.balance, watchStreak: coins.watchStreak })
  } catch (err) {
    next(err)
  }
}
