import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

/**
 * Verify the JWT in Authorization: Bearer <token>.
 * Attaches the user document to req.user (without the password hash).
 */
export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated — no token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub).select("-password");
    if (!user) {
      return res.status(401).json({ error: "Not authenticated — user no longer exists" });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Not authenticated — invalid or expired token" });
    }
    next(err);
  }
}

/**
 * Restrict a route to one or more roles.
 * Usage: router.post("/", protect, authorize("farmer"), handler)
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden — requires role: ${roles.join(" or ")}`,
      });
    }
    next();
  };
}
