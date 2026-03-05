import jwt from "jsonwebtoken"
import config from "../config/index.js"
import User from "../models/User.js"

export function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" })
  }

  try {
    const decoded = jwt.verify(header.split(" ")[1], config.jwtSecret)
    req.userId = decoded.id
    req.userRole = decoded.role
    next()
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" })
  }
}

export function adminOnly(req, res, next) {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Admin access required" })
  }
  next()
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith("Bearer ")) return next()

  try {
    const decoded = jwt.verify(header.split(" ")[1], config.jwtSecret)
    req.userId = decoded.id
    req.userRole = decoded.role
  } catch {
    // token invalid, continue as anonymous
  }
  next()
}
