import Product from "../models/Products.js";
import { uploadProductImages, deleteProductImages, parseSizes, buildProductQuery, parseQueryFilters, } from "../utils/productHelpers.js";
/**
 * Get all products with pagination, filtering, and searching
 * GET /api/products
 * Query params:
 * - page: pagination page number (default: 1)
 * - limit: items per page (default: 10)
 * - search: search term
 * - category: filter by category
 * - minPrice: minimum price filter
 * - maxPrice: maximum price filter
 * - inStock: filter in-stock products (true/false)
 * - isFeatured: filter featured products (true/false)
 * - sort: sort by field (name, price, stock, createdAt)
 * - order: sort order (asc, desc)
 */
export const getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = "createdAt", order = "desc" } = req.query;
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(100, Math.max(1, Number(limit)));
        // Build query with filters
        const filters = parseQueryFilters(req.query);
        const baseQuery = buildProductQuery(filters);
        // Add isActive filter for users (non-admin endpoints)
        if (!req.user || req.user.role !== "admin") {
            baseQuery.isActive = true;
        }
        // Count total documents
        const total = await Product.countDocuments(baseQuery);
        // Build sort object
        const sortObj = {};
        const sortField = String(sort);
        const sortOrder = String(order) === "asc" ? 1 : -1;
        const validSortFields = ["name", "price", "stock", "createdAt", "ratings"];
        if (validSortFields.includes(sortField)) {
            sortObj[sortField] = sortOrder;
        }
        else {
            sortObj["createdAt"] = -1;
        }
        // Fetch products with pagination and sorting
        const products = await Product.find(baseQuery)
            .sort(sortObj)
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean();
        res.json({
            success: true,
            data: products,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
            },
            filters: filters,
        });
    }
    catch (error) {
        console.error("Get products error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Get a single product by ID
 * GET /api/products/:id
 */
export const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).lean();
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        // Check if product is active for non-admin users
        if (!req.user || req.user.role !== "admin") {
            if (!product.isActive) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found",
                });
            }
        }
        res.json({ success: true, data: product });
    }
    catch (error) {
        console.error("Get single product error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Create a new product
 * POST /api/products
 * Requires: name, description, price, category, stock
 * Optional: isFeatured, sizes
 * Files: images (max 5)
 */
export const createProduct = async (req, res) => {
    try {
        console.log("[products] createProduct request", {
            adminId: req.user?._id,
            clerkId: req.user?.clerkId,
            body: {
                name: req.body?.name,
                category: req.body?.category,
                price: req.body?.price,
                stock: req.body?.stock,
                sizes: req.body?.sizes,
                isFeatured: req.body?.isFeatured,
            },
            fileCount: req.files?.length || 0,
        });
        // Upload images
        const images = await uploadProductImages(req.files);
        if (images.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please upload at least one image",
            });
        }
        // Parse sizes
        const sizes = parseSizes(req.body.sizes);
        // Prepare product data
        const productData = {
            name: req.body.name.trim(),
            description: req.body.description.trim(),
            price: Number(req.body.price),
            comparePrice: req.body.comparePrice ? Number(req.body.comparePrice) : undefined,
            category: req.body.category,
            stock: Number(req.body.stock),
            sizes: sizes,
            images: images,
            isFeatured: req.body.isFeatured === "true" || req.body.isFeatured === true,
            isActive: true,
            ratings: {
                average: 0,
                count: 0,
            },
        };
        const product = await Product.create(productData);
        console.log("[products] createProduct success", {
            productId: product._id,
            name: product.name,
            imageCount: product.images.length,
        });
        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product,
        });
    }
    catch (error) {
        console.error("[products] createProduct error", {
            message: error?.message,
            stack: error?.stack,
            body: {
                name: req.body?.name,
                category: req.body?.category,
                price: req.body?.price,
                stock: req.body?.stock,
            },
            fileCount: req.files?.length || 0,
        });
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Update a product
 * PUT /api/products/:id
 * Can update any field, images can be partially updated
 */
export const updateProduct = async (req, res) => {
    try {
        console.log("[products] updateProduct request", {
            productId: req.params.id,
            adminId: req.user?._id,
            body: {
                name: req.body?.name,
                category: req.body?.category,
                price: req.body?.price,
                stock: req.body?.stock,
                existingImages: req.body?.existingImages ? true : false,
            },
            fileCount: req.files?.length || 0,
        });
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        // Handle images
        let images = [];
        // Keep existing images
        if (req.body.existingImages) {
            images = Array.isArray(req.body.existingImages)
                ? req.body.existingImages
                : [req.body.existingImages];
        }
        else {
            // If no existing images specified but current product has images, keep them
            images = product.images || [];
        }
        // Upload new images
        if (req.files && req.files.length > 0) {
            const newImages = await uploadProductImages(req.files);
            images = [...images, ...newImages];
        }
        // Parse sizes if provided
        let updates = { ...req.body };
        if (req.body.sizes) {
            const sizes = parseSizes(req.body.sizes);
            updates.sizes = sizes;
        }
        // Clean up
        delete updates.existingImages;
        // Update images if changed
        if (req.body.existingImages !== undefined || (req.files && req.files.length > 0)) {
            updates.images = images;
        }
        // Ensure numeric fields
        if (updates.price)
            updates.price = Number(updates.price);
        if (updates.stock)
            updates.stock = Number(updates.stock);
        if (updates.comparePrice)
            updates.comparePrice = Number(updates.comparePrice);
        // Update the product
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        res.json({
            success: true,
            message: "Product updated successfully",
            data: updatedProduct,
        });
    }
    catch (error) {
        console.error("[products] updateProduct error", {
            productId: req.params.id,
            message: error?.message,
            stack: error?.stack,
            fileCount: req.files?.length || 0,
        });
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Delete a product
 * DELETE /api/products/:id
 * Also deletes associated images from Cloudinary
 */
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        // Delete images from Cloudinary
        if (product.images && product.images.length > 0) {
            await deleteProductImages(product.images);
        }
        // Delete product from database
        await Product.findByIdAndDelete(req.params.id);
        res.json({
            success: true,
            message: "Product deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete product error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Get product statistics (admin only)
 * GET /api/products/stats/admin
 */
export const getProductStats = async (req, res) => {
    try {
        const total = await Product.countDocuments();
        const active = await Product.countDocuments({ isActive: true });
        const inactive = await Product.countDocuments({ isActive: false });
        const featured = await Product.countDocuments({ isFeatured: true });
        const lowStock = await Product.countDocuments({ stock: { $lt: 10, $gt: 0 } });
        const outOfStock = await Product.countDocuments({ stock: 0 });
        const avgPrice = await Product.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: null, avg: { $avg: "$price" } } },
        ]);
        const totalRevenue = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: { $multiply: ["$price", { $cond: [{ $gt: ["$stock", 0] }, 1, 0] }] } },
                },
            },
        ]);
        res.json({
            success: true,
            data: {
                total,
                active,
                inactive,
                featured,
                lowStock,
                outOfStock,
                avgPrice: avgPrice[0]?.avg || 0,
                inStockValue: totalRevenue[0]?.total || 0,
            },
        });
    }
    catch (error) {
        console.error("Get stats error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Toggle product active status
 * PATCH /api/products/:id/toggle-status
 */
export const toggleProductStatus = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        product.isActive = !product.isActive;
        await product.save();
        res.json({
            success: true,
            message: `Product ${product.isActive ? "activated" : "deactivated"} successfully`,
            data: product,
        });
    }
    catch (error) {
        console.error("Toggle status error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Toggle product featured status
 * PATCH /api/products/:id/toggle-featured
 */
export const toggleFeaturedStatus = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        product.isFeatured = !product.isFeatured;
        await product.save();
        res.json({
            success: true,
            message: `Product ${product.isFeatured ? "featured" : "unfeatured"} successfully`,
            data: product,
        });
    }
    catch (error) {
        console.error("Toggle featured error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
