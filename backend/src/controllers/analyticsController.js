import AnalyticsEvent from "../models/Analytics.js"

export async function trackEvent(req, res, next) {
  try {
    const { type, animeId, animeTitle, episodeNumber, searchQuery, sessionId, path } = req.body

    if (!type || !sessionId) {
      return res.status(400).json({ error: "type and sessionId are required" })
    }

    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress
    // Basic geo from IP — in production use a geo-IP service
    let country = null
    let city = null
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=country,city`)
      if (geoRes.ok) {
        const geo = await geoRes.json()
        country = geo.country || null
        city = geo.city || null
      }
    } catch {
      // geo lookup failed, continue without it
    }

    await AnalyticsEvent.create({
      type,
      userId: req.userId || null,
      sessionId,
      animeId,
      animeTitle,
      episodeNumber,
      searchQuery,
      ip,
      country,
      city,
      userAgent: req.headers["user-agent"],
      referrer: req.headers.referer || null,
      path,
    })

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function getDashboard(req, res, next) {
  try {
    const now = new Date()
    const last24h = new Date(now - 24 * 60 * 60 * 1000)
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000)
    const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      totalEvents,
      events24h,
      events7d,
      topAnime,
      topSearches,
      countryBreakdown,
      dailyViews,
      recentEvents,
    ] = await Promise.all([
      // Total users
      (await import("../models/User.js")).default.countDocuments(),
      // Total events
      AnalyticsEvent.countDocuments(),
      // Events last 24h
      AnalyticsEvent.countDocuments({ createdAt: { $gte: last24h } }),
      // Events last 7d
      AnalyticsEvent.countDocuments({ createdAt: { $gte: last7d } }),
      // Top watched anime (last 30 days)
      AnalyticsEvent.aggregate([
        { $match: { type: { $in: ["anime_view", "episode_watch"] }, createdAt: { $gte: last30d }, animeTitle: { $ne: null } } },
        { $group: { _id: "$animeTitle", views: { $sum: 1 }, uniqueUsers: { $addToSet: "$sessionId" } } },
        { $project: { _id: 1, views: 1, uniqueUsers: { $size: "$uniqueUsers" } } },
        { $sort: { views: -1 } },
        { $limit: 20 },
      ]),
      // Top searches (last 30 days)
      AnalyticsEvent.aggregate([
        { $match: { type: "search", createdAt: { $gte: last30d }, searchQuery: { $ne: null } } },
        { $group: { _id: { $toLower: "$searchQuery" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      // Country breakdown (last 30 days)
      AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: last30d }, country: { $ne: null } } },
        { $group: { _id: "$country", count: { $sum: 1 }, uniqueUsers: { $addToSet: "$sessionId" } } },
        { $project: { _id: 1, count: 1, uniqueUsers: { $size: "$uniqueUsers" } } },
        { $sort: { count: -1 } },
        { $limit: 30 },
      ]),
      // Daily views (last 30 days)
      AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: last30d } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: "$sessionId" },
          },
        },
        { $project: { _id: 1, count: 1, uniqueUsers: { $size: "$uniqueUsers" } } },
        { $sort: { _id: 1 } },
      ]),
      // Recent events
      AnalyticsEvent.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .select("type animeTitle episodeNumber searchQuery country city sessionId createdAt")
        .lean(),
    ])

    res.json({
      overview: { totalUsers, totalEvents, events24h, events7d },
      topAnime,
      topSearches,
      countryBreakdown,
      dailyViews,
      recentEvents,
    })
  } catch (err) {
    next(err)
  }
}
