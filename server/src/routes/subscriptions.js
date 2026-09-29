import { Router } from "express";
import {
  getPlans,
  currentSubscription,
  subscribe,
  cancelSubscription,
} from "../controllers/subscriptionController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/plans", getPlans);
router.get("/me", protect, currentSubscription);
router.post("/subscribe", protect, subscribe);
router.post("/cancel", protect, cancelSubscription);

export default router;
