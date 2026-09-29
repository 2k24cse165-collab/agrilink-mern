import { Router } from "express";
import { register, login, me, updateProfile, registerRules } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/register", registerRules, register);
router.post("/login", login);
router.get("/me", protect, me);
router.patch("/me", protect, updateProfile);

export default router;
