import { Router } from "express";
import { farmerAnalytics, adminAnalytics } from "../controllers/analyticsController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/farmer", protect, authorize("farmer"), farmerAnalytics);
router.get("/admin", protect, authorize("admin"), adminAnalytics);

export default router;
