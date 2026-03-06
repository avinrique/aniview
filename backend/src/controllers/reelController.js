import Reel from "../models/Reel.js"

// GET /api/reels — list approved reels (public)
export async function listReels(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = 20
    const skip = (page - 1) * limit

    const reels = await Reel.find({ status: "approved" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("postedBy", "username avatar")

    const total = await Reel.countDocuments({ status: "approved" })

    res.json({ reels, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    next(err)
  }
}

// POST /api/reels — create a reel (authenticated)
export async function createReel(req, res, next) {
  try {
    const { type, title, description, embedUrl, thumbnail } = req.body

    if (!type || !title) {
      return res.status(400).json({ error: "Type and title are required" })
    }

    if (!["upload", "youtube", "instagram"].includes(type)) {
      return res.status(400).json({ error: "Invalid reel type" })
    }

    const reelData = {
      type,
      title: title.slice(0, 100),
      description: (description || "").slice(0, 500),
      thumbnail: thumbnail || "",
      postedBy: req.userId,
      // Admins get auto-approved
      status: req.userRole === "admin" ? "approved" : "pending",
    }

    if (type === "upload") {
      if (!req.file) {
        return res.status(400).json({ error: "Video file is required for upload type" })
      }
      reelData.videoFile = req.file.filename
    } else if (type === "youtube") {
      if (!embedUrl) {
        return res.status(400).json({ error: "YouTube URL is required" })
      }
      // Extract video ID from various YouTube URL formats
      const ytMatch = embedUrl.match(
        /(?:youtube\.com\/(?:shorts\/|watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
      )
      if (!ytMatch) {
        return res.status(400).json({ error: "Invalid YouTube URL" })
      }
      reelData.embedUrl = ytMatch[1] // store just the video ID
    } else if (type === "instagram") {
      if (!embedUrl) {
        return res.status(400).json({ error: "Instagram URL is required" })
      }
      // Extract reel/post ID from Instagram URL
      const igMatch = embedUrl.match(
        /instagram\.com\/(?:reel|p)\/([a-zA-Z0-9_-]+)/
      )
      if (!igMatch) {
        return res.status(400).json({ error: "Invalid Instagram reel URL" })
      }
      reelData.embedUrl = igMatch[1] // store just the reel ID
    }

    const reel = await Reel.create(reelData)
    await reel.populate("postedBy", "username avatar")

    res.status(201).json({ reel })
  } catch (err) {
    next(err)
  }
}

// POST /api/reels/:id/like — toggle like (authenticated)
export async function toggleLike(req, res, next) {
  try {
    const reel = await Reel.findById(req.params.id)
    if (!reel) return res.status(404).json({ error: "Reel not found" })

    const idx = reel.likes.indexOf(req.userId)
    if (idx === -1) {
      reel.likes.push(req.userId)
    } else {
      reel.likes.splice(idx, 1)
    }
    await reel.save()

    res.json({ likes: reel.likes.length, liked: idx === -1 })
  } catch (err) {
    next(err)
  }
}

// GET /api/reels/pending — list pending reels (admin only)
export async function listPending(req, res, next) {
  try {
    const reels = await Reel.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .populate("postedBy", "username avatar")
    res.json({ reels })
  } catch (err) {
    next(err)
  }
}

// PUT /api/reels/:id/approve — approve a reel (admin only)
export async function approveReel(req, res, next) {
  try {
    const reel = await Reel.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    ).populate("postedBy", "username avatar")
    if (!reel) return res.status(404).json({ error: "Reel not found" })
    res.json({ reel })
  } catch (err) {
    next(err)
  }
}

// PUT /api/reels/:id/reject — reject a reel (admin only)
export async function rejectReel(req, res, next) {
  try {
    const reel = await Reel.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    ).populate("postedBy", "username avatar")
    if (!reel) return res.status(404).json({ error: "Reel not found" })
    res.json({ reel })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/reels/:id — delete a reel (admin or owner)
export async function deleteReel(req, res, next) {
  try {
    const reel = await Reel.findById(req.params.id)
    if (!reel) return res.status(404).json({ error: "Reel not found" })

    if (req.userRole !== "admin" && String(reel.postedBy) !== req.userId) {
      return res.status(403).json({ error: "Not authorized" })
    }

    await reel.deleteOne()
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}
