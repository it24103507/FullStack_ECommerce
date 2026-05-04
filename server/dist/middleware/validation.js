export const validateProductCreate = (req, res, next) => {
    const { name, description, price, category, stock } = req.body;
    const errors = [];
    // Validate name
    if (!name || typeof name !== "string" || name.trim().length < 2) {
        errors.push("Product name must be at least 2 characters long");
    }
    // Validate description
    if (!description || typeof description !== "string" || description.trim().length < 10) {
        errors.push("Description must be at least 10 characters long");
    }
    // Validate price
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
        errors.push("Price must be a positive number");
    }
    // Validate category
    const validCategories = ["Men", "Women", "Kids", "Shoes", "Bags", "Other"];
    if (!category || !validCategories.includes(category)) {
        errors.push(`Category must be one of: ${validCategories.join(", ")}`);
    }
    // Validate stock
    if (stock === undefined || isNaN(Number(stock)) || Number(stock) < 0) {
        errors.push("Stock must be a non-negative number");
    }
    // Check for at least one image
    if (!req.files || req.files.length === 0) {
        errors.push("At least one product image is required");
    }
    if (errors.length > 0) {
        console.error("[validation] product create failed", {
            body: {
                name,
                category,
                price,
                stock,
            },
            errors,
            fileCount: req.files?.length || 0,
        });
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors,
        });
    }
    next();
};
export const validateProductUpdate = (req, res, next) => {
    const { name, description, price, category, stock } = req.body;
    const errors = [];
    // Validate name (if provided)
    if (name !== undefined && (typeof name !== "string" || name.trim().length < 2)) {
        errors.push("Product name must be at least 2 characters long");
    }
    // Validate description (if provided)
    if (description !== undefined && (typeof description !== "string" || description.trim().length < 10)) {
        errors.push("Description must be at least 10 characters long");
    }
    // Validate price (if provided)
    if (price !== undefined && (isNaN(Number(price)) || Number(price) <= 0)) {
        errors.push("Price must be a positive number");
    }
    // Validate category (if provided)
    if (category !== undefined) {
        const validCategories = ["Men", "Women", "Kids", "Shoes", "Bags", "Other"];
        if (!validCategories.includes(category)) {
            errors.push(`Category must be one of: ${validCategories.join(", ")}`);
        }
    }
    // Validate stock (if provided)
    if (stock !== undefined && (isNaN(Number(stock)) || Number(stock) < 0)) {
        errors.push("Stock must be a non-negative number");
    }
    if (errors.length > 0) {
        console.error("[validation] product update failed", {
            productId: req.params?.id,
            body: {
                name,
                category,
                price,
                stock,
            },
            errors,
            fileCount: req.files?.length || 0,
        });
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors,
        });
    }
    next();
};
