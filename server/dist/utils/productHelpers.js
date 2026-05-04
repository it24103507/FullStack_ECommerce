import { v2 as cloudinary } from "cloudinary";
export const buildProductQuery = (filters) => {
    const query = {};
    if (filters.search) {
        query.$text = { $search: filters.search };
    }
    if (filters.category) {
        query.category = filters.category;
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        query.price = {};
        if (filters.minPrice !== undefined) {
            query.price.$gte = filters.minPrice;
        }
        if (filters.maxPrice !== undefined) {
            query.price.$lte = filters.maxPrice;
        }
    }
    if (filters.inStock !== undefined) {
        query.stock = filters.inStock ? { $gt: 0 } : 0;
    }
    if (filters.isFeatured !== undefined) {
        query.isFeatured = filters.isFeatured;
    }
    if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
    }
    return query;
};
export const parseQueryFilters = (queryParams) => {
    return {
        search: queryParams.search,
        category: queryParams.category,
        minPrice: queryParams.minPrice ? Number(queryParams.minPrice) : undefined,
        maxPrice: queryParams.maxPrice ? Number(queryParams.maxPrice) : undefined,
        inStock: queryParams.inStock ? queryParams.inStock === "true" : undefined,
        isFeatured: queryParams.isFeatured ? queryParams.isFeatured === "true" : undefined,
        isActive: queryParams.isActive ? queryParams.isActive === "true" : undefined,
    };
};
export const deleteProductImages = async (imageUrls) => {
    if (!imageUrls || imageUrls.length === 0)
        return;
    const deletePromises = imageUrls.map((imageUrl) => {
        const publicIdMatch = imageUrl.match(/\/v\d+\/(.+)\.[a-z]+$/);
        const publicId = publicIdMatch ? publicIdMatch[1] : null;
        if (publicId) {
            return cloudinary.uploader.destroy(publicId).catch(() => null);
        }
        return Promise.resolve(null);
    });
    await Promise.all(deletePromises);
};
export const uploadProductImages = async (files) => {
    if (!files || files.length === 0)
        return [];
    const uploadPromises = files.map((file) => {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({ folder: "forever-app/products" }, (error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(result.secure_url);
            });
            uploadStream.end(file.buffer);
        });
    });
    return Promise.all(uploadPromises);
};
export const parseSizes = (sizes) => {
    if (!sizes)
        return [];
    let parsedSizes = sizes;
    if (typeof sizes === "string") {
        try {
            parsedSizes = JSON.parse(sizes);
        }
        catch {
            parsedSizes = sizes.split(",").map((s) => s.trim()).filter((s) => s !== "");
        }
    }
    if (!Array.isArray(parsedSizes)) {
        return [String(parsedSizes)];
    }
    return parsedSizes;
};
