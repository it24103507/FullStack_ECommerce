import express from "express";
import { protect } from "../middleware/auth.js";
import { getWishlist, removeWishlistItem, toggleWishlistItem } from "../controllers/wishlistController.js";

const router = express.Router();

router.get("/", protect, getWishlist);
router.post("/toggle", protect, toggleWishlistItem);
router.delete("/:productId", protect, removeWishlistItem);

export default router;
