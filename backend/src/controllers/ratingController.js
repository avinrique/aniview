import Rating from "../models/Rating.js"

// POST /api/ratings — create or update a rating (authenticated)
export async function rateAnime(req, res, next) {
  try {
    const { animeId, animeTitle, rating } = req.body

    if (!animeId || !animeTitle || !rating) {
      return res.status(400).json({ error: "animeId, animeTitle, and rating are required" })
    }

    const numRating = Number(rating)
    if (numRating < 1 || numRating > 10 || !Number.isInteger(numRating)) {
      return res.status(400).json({ error: "Rating must be an integer between 1 and 10" })
    }

    const existing = await Rating.findOneAndUpdate(
      { animeId, userId: req.userId },
      { rating: numRating, animeTitle },
      { new: true, upsert: true }
    )

    // Return updated average
    const stats = await Rating.aggregate([
      { $match: { animeId } },
      { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
    ])

    res.json({
      userRating: existing.rating,
      average: stats[0]?.average ? Math.round(stats[0].average * 10) / 10 : numRating,
      count: stats[0]?.count || 1,
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/ratings/:animeId — get rating stats for an anime
export async function getAnimeRating(req, res, next) {
  try {
    const { animeId } = req.params

    const stats = await Rating.aggregate([
      { $match: { animeId } },
      { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
    ])

    let userRating = null
    if (req.userId) {
      const existing = await Rating.findOne({ animeId, userId: req.userId })
      userRating = existing?.rating || null
    }

    res.json({
      average: stats[0]?.average ? Math.round(stats[0].average * 10) / 10 : 0,
      count: stats[0]?.count || 0,
      userRating,
    })
  } catch (err) {
    next(err)
  }
}
