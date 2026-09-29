import { Router } from "express";
import {
  listUsers,
  verifyUser,
  suspendUser,
  listAllListings,
  verifyListing,
  listAllOrders,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

// All admin routes require admin role
router.use(protect, authorize("admin"));

router.get("/users", listUsers);
router.post("/users/:id/verify", verifyUser);
router.post("/users/:id/suspend", suspendUser);

router.get("/listings", listAllListings);
router.post("/listings/:id/verify", verifyListing);

router.get("/orders", listAllOrders);

export default router;
