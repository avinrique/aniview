import AnalyticsEvent from "../models/Analytics.js"

function parseDevice(ua) {
  if (!ua) return { device: "unknown", browser: "unknown" }
  const browser =
    ua.includes("Firefox") ? "Firefox" :
    ua.includes("Edg") ? "Edge" :
    ua.includes("Chrome") ? "Chrome" :
    ua.includes("Safari") ? "Safari" :
    ua.includes("Opera") || ua.includes("OPR") ? "Opera" : "Other"
  const device =
    /Mobile|Android.*Mobile|iPhone|iPod/.test(ua) ? "mobile" :
    /iPad|Android(?!.*Mobile)|Tablet/.test(ua) ? "tablet" : "desktop"
  return { device, browser }
}

export async function trackEvent(req, res, next) {
  try {
    const { type, animeId, animeTitle, episodeNumber, searchQuery, sessionId, path, origin } = req.body

    if (!type || !sessionId) {
      return res.status(400).json({ error: "type and sessionId are required" })
    }

    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress
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
      // geo lookup failed
    }

    const { device, browser } = parseDevice(req.headers["user-agent"])

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
      origin: origin || req.headers.origin || null,
      path,
      device,
      browser,
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

    const User = (await import("../models/User.js")).default

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
      deviceBreakdown,
      browserBreakdown,
      referrerBreakdown,
      activeUsers,
    ] = await Promise.all([
      User.countDocuments(),
      AnalyticsEvent.countDocuments(),
      AnalyticsEvent.countDocuments({ createdAt: { $gte: last24h } }),
      AnalyticsEvent.countDocuments({ createdAt: { $gte: last7d } }),
      // Top watched anime (last 30 days)
      AnalyticsEvent.aggregate([
        { $match: { type: { $in: ["anime_view", "episode_watch"] }, createdAt: { $gte: last30d }, animeTitle: { $ne: null } } },
        { $group: { _id: "$animeTitle", views: { $sum: 1 }, uniqueUsers: { $addToSet: "$sessionId" } } },
        { $project: { _id: 1, views: 1, uniqueUsers: { $size: "$uniqueUsers" } } },
        { $sort: { views: -1 } },
        { $limit: 20 },
      ]),
      // Top searches
      AnalyticsEvent.aggregate([
        { $match: { type: "search", createdAt: { $gte: last30d }, searchQuery: { $ne: null } } },
        { $group: { _id: { $toLower: "$searchQuery" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      // Country breakdown
      AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: last30d }, country: { $ne: null } } },
        { $group: { _id: "$country", count: { $sum: 1 }, uniqueUsers: { $addToSet: "$sessionId" } } },
        { $project: { _id: 1, count: 1, uniqueUsers: { $size: "$uniqueUsers" } } },
        { $sort: { count: -1 } },
        { $limit: 30 },
      ]),
      // Daily views
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
      // Recent events with more detail
      AnalyticsEvent.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .select("type animeTitle episodeNumber searchQuery country city sessionId userId device browser origin referrer ip createdAt")
        .lean(),
      // Device breakdown
      AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: last30d }, device: { $ne: null } } },
        { $group: { _id: "$device", count: { $sum: 1 }, uniqueUsers: { $addToSet: "$sessionId" } } },
        { $project: { _id: 1, count: 1, uniqueUsers: { $size: "$uniqueUsers" } } },
        { $sort: { count: -1 } },
      ]),
      // Browser breakdown
      AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: last30d }, browser: { $ne: null } } },
        { $group: { _id: "$browser", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Referrer/origin breakdown (where traffic comes from)
      AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: last30d }, origin: { $ne: null } } },
        { $group: { _id: "$origin", count: { $sum: 1 }, uniqueUsers: { $addToSet: "$sessionId" } } },
        { $project: { _id: 1, count: 1, uniqueUsers: { $size: "$uniqueUsers" } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      // Most active registered users (last 30d)
      AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: last30d }, userId: { $ne: null } } },
        { $group: { _id: "$userId", events: { $sum: 1 }, lastActive: { $max: "$createdAt" } } },
        { $sort: { events: -1 } },
        { $limit: 20 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
        { $unwind: "$user" },
        { $project: { _id: 1, events: 1, lastActive: 1, username: "$user.username", email: "$user.email" } },
      ]),
    ])

    // Unique sessions today for "same origin" detection
    const sessionsToday = await AnalyticsEvent.aggregate([
      { $match: { createdAt: { $gte: last24h } } },
      { $group: { _id: "$sessionId", ip: { $first: "$ip" }, origin: { $first: "$origin" }, device: { $first: "$device" }, events: { $sum: 1 }, userId: { $first: "$userId" } } },
      { $sort: { events: -1 } },
      { $limit: 50 },
    ])

    res.json({
      overview: { totalUsers, totalEvents, events24h, events7d },
      topAnime,
      topSearches,
      countryBreakdown,
      dailyViews,
      recentEvents,
      deviceBreakdown,
      browserBreakdown,
      referrerBreakdown,
      activeUsers,
      sessionsToday,
    })
  } catch (err) {
    next(err)
  }
}
