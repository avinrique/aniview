import ChatMessage from "../models/Discussion.js"

// GET /api/chat/:animeId?episode=1&page=1
// If episode param is given, returns episode-specific chat. Otherwise general anime chat.
export async function getMessages(req, res, next) {
  try {
    const { animeId } = req.params
    const episodeNumber = req.query.episode ? Number(req.query.episode) : null
    const page = parseInt(req.query.page) || 1
    const limit = 50
    const skip = (page - 1) * limit

    const filter = { animeId }
    if (episodeNumber !== null) {
      filter.episodeNumber = episodeNumber
    } else {
      filter.episodeNumber = null
    }

    const total = await ChatMessage.countDocuments(filter)
    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate("postedBy", "username avatar")

    res.json({ messages, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    next(err)
  }
}

// POST /api/chat/:animeId — send a message
export async function sendMessage(req, res, next) {
  try {
    const { animeId } = req.params
    const { message, animeTitle, episodeNumber } = req.body

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" })
    }
    if (!animeTitle) {
      return res.status(400).json({ error: "animeTitle is required" })
    }

    const msg = await ChatMessage.create({
      animeId,
      animeTitle,
      episodeNumber: episodeNumber ?? null,
      message: message.trim().slice(0, 1000),
      postedBy: req.userId,
    })

    await msg.populate("postedBy", "username avatar")
    res.status(201).json({ message: msg })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/chat/message/:id — delete a message (admin or owner)
export async function deleteMessage(req, res, next) {
  try {
    const msg = await ChatMessage.findById(req.params.id)
    if (!msg) return res.status(404).json({ error: "Message not found" })

    if (req.userRole !== "admin" && String(msg.postedBy) !== req.userId) {
      return res.status(403).json({ error: "Not authorized" })
    }

    await msg.deleteOne()
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

// GET /api/chat/active — list anime with recent chat activity
export async function getActiveChats(req, res, next) {
  try {
    const chats = await ChatMessage.aggregate([
      { $group: {
        _id: "$animeId",
        animeTitle: { $last: "$animeTitle" },
        lastMessage: { $last: "$message" },
        lastAt: { $max: "$createdAt" },
        count: { $sum: 1 },
      }},
      { $sort: { lastAt: -1 } },
      { $limit: 30 },
    ])

    res.json({ chats })
  } catch (err) {
    next(err)
  }
}
