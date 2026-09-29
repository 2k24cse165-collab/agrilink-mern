import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { User } from "../models/User.js";
import { AppError } from "../middleware/error.js";

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, plan: user.plan?.id || "free" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function publicUser(user) {
  const u = user.toJSON();
  delete u.suspended;
  return u;
}

export const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("role").optional().isIn(["farmer", "buyer"]).withMessage("Role must be farmer or buyer"),
];

export async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "Validation failed", fields: errors.array() });
    }

    const { name, email, password, role = "buyer", phone = "", region = "" } = req.body;
    const existing = await User.findOne({ email });
    if (existing) throw new AppError("Email already registered", 409);

    const user = await User.create({ name, email, password, role, phone, region });
    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError("Email and password required", 400);

    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new AppError("Invalid credentials", 401);
    if (user.suspended) throw new AppError("Account suspended — contact support", 403);

    const ok = await user.comparePassword(password);
    if (!ok) throw new AppError("Invalid credentials", 401);

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    res.json({ user: publicUser(req.user) });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const allowed = ["name", "phone", "region", "avatarUrl"];
    for (const k of allowed) {
      if (req.body[k] !== undefined) req.user.set(k, req.body[k]);
    }
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch (err) {
    next(err);
  }
}
