import { Router } from "express";
import {
  createOrder,
  acceptOrder,
  declineOrder,
  deliverOrder,
  farmerOrders,
  buyerOrders,
} from "../controllers/orderController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

// Buyer
router.post("/", protect, authorize("buyer"), createOrder);
router.get("/buyer", protect, authorize("buyer"), buyerOrders);

// Farmer
router.get("/farmer", protect, authorize("farmer"), farmerOrders);
router.post("/:id/accept", protect, authorize("farmer"), acceptOrder);
router.post("/:id/decline", protect, authorize("farmer"), declineOrder);
router.post("/:id/deliver", protect, authorize("farmer"), deliverOrder);

export default router;
