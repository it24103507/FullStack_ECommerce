import express from "express";
import { getProduct, getProducts, createProduct, updateProduct, deleteProduct, getProductStats, toggleProductStatus, toggleFeaturedStatus, } from "../controllers/productController.js";
import upload from "../middleware/upload.js";
import { authorize, protect } from "../middleware/auth.js";
import { validateProductCreate, validateProductUpdate } from "../middleware/validation.js";
const ProductRouter = express.Router();
ProductRouter.use((req, _res, next) => {
    console.log("[products] request", {
        method: req.method,
        path: req.originalUrl,
        userId: req.user?._id,
        role: req.user?.role,
    });
    next();
});
// Public routes
// Get all products with filters and pagination
ProductRouter.get("/", getProducts);
// Get product statistics (admin only)
ProductRouter.get("/stats/admin", protect, authorize("admin"), getProductStats);
// Get single product
ProductRouter.get("/:id", getProduct);
// Protected admin routes
// Create product
ProductRouter.post("/", protect, authorize("admin"), upload.array("images", 5), validateProductCreate, createProduct);
// Update product
ProductRouter.put("/:id", protect, authorize("admin"), upload.array("images", 5), validateProductUpdate, updateProduct);
// Toggle product status (active/inactive)
ProductRouter.patch("/:id/toggle-status", protect, authorize("admin"), toggleProductStatus);
// Toggle featured status
ProductRouter.patch("/:id/toggle-featured", protect, authorize("admin"), toggleFeaturedStatus);
// Delete product
ProductRouter.delete("/:id", protect, authorize("admin"), deleteProduct);
export default ProductRouter;
