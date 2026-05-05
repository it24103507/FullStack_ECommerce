import { resolveApiBaseUrl } from "./apiBase";

type AuthTokenProvider = () => Promise<string | null>;

interface PaginationParams {
    page?: number;
    limit?: number;
}

interface ProductFilters {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    isFeatured?: boolean;
    sort?: string;
    order?: string;
}

interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    comparePrice?: number;
    images: string[];
    sizes?: string[];
    category: string;
    stock: number;
    isFeatured: boolean;
    isActive: boolean;
    ratings: {
        average: number;
        count: number;
    };
    createdAt: string;
    updatedAt: string;
}

interface CreateProductData {
    name: string;
    description: string;
    price: number;
    comparePrice?: number;
    category: string;
    stock: number;
    sizes: string[];
    isFeatured?: boolean;
}

interface UpdateProductData extends Partial<CreateProductData> {}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    pagination?: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

class ProductService {
    private authTokenProvider: AuthTokenProvider | null = null;

    setAuthTokenProvider(provider: AuthTokenProvider | null) {
        this.authTokenProvider = provider;
    }

    private getToken = async (): Promise<string | null> => {
        try {
            if (!this.authTokenProvider) {
                return null;
            }

            return await this.authTokenProvider();
        } catch {
            return null;
        }
    };

    private getHeaders = async (includeAuth: boolean = false) => {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (includeAuth) {
            const token = await this.getToken();
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }
        }

        return headers;
    };

    private async fetchJson<T>(path: string, init: RequestInit): Promise<T> {
        const baseUrl = await resolveApiBaseUrl();
        const method = String(init.method || "GET");
        console.log(`[productService] ${method} ${baseUrl}${path}`);

        const response = await fetch(`${baseUrl}${path}`, init);
        const data = await response.json().catch(() => null);

        if (!response.ok) {
            console.error(`[productService] ${method} ${path} failed`, {
                status: response.status,
                statusText: response.statusText,
                body: data,
            });
            throw new Error(data?.message || `Request failed with status ${response.status}`);
        }

        console.log(`[productService] ${method} ${path} succeeded`, {
            status: response.status,
        });

        return data;
    }

    /**
     * Get all products with optional filters and pagination
     */
    async getProducts(
        filters: ProductFilters = {},
        pagination: PaginationParams = { page: 1, limit: 10 }
    ): Promise<ApiResponse<Product[]>> {
        try {
            const params = new URLSearchParams();

            // Add pagination
            if (pagination.page) params.append("page", String(pagination.page));
            if (pagination.limit) params.append("limit", String(pagination.limit));

            // Add filters
            if (filters.search) params.append("search", filters.search);
            if (filters.category) params.append("category", filters.category);
            if (filters.minPrice) params.append("minPrice", String(filters.minPrice));
            if (filters.maxPrice) params.append("maxPrice", String(filters.maxPrice));
            if (filters.inStock !== undefined) params.append("inStock", String(filters.inStock));
            if (filters.isFeatured !== undefined) params.append("isFeatured", String(filters.isFeatured));
            if (filters.sort) params.append("sort", filters.sort);
            if (filters.order) params.append("order", filters.order);

            return await this.fetchJson(`/products?${params.toString()}`, {
                method: "GET",
                headers: await this.getHeaders(false),
            });
        } catch (error: any) {
            return {
                success: false,
                message: error.message || "Failed to fetch products",
            };
        }
    }

    /**
     * Get a single product by ID
     */
    async getProduct(id: string): Promise<ApiResponse<Product>> {
        try {
            return await this.fetchJson(`/products/${id}`, {
                method: "GET",
                headers: await this.getHeaders(false),
            });
        } catch (error: any) {
            return {
                success: false,
                message: error.message || "Failed to fetch product",
            };
        }
    }

    /**
     * Create a new product (admin only)
     */
    async createProduct(
        productData: CreateProductData,
        images: string[]
    ): Promise<ApiResponse<Product>> {
        try {
            console.log("[productService] createProduct start", {
                name: productData.name,
                category: productData.category,
                price: productData.price,
                imageCount: images.length,
            });

            const formData = new FormData();

            // Add form fields
            formData.append("name", productData.name);
            formData.append("description", productData.description);
            formData.append("price", String(productData.price));
            if (productData.comparePrice) {
                formData.append("comparePrice", String(productData.comparePrice));
            }
            formData.append("category", productData.category);
            formData.append("stock", String(productData.stock));
            formData.append("sizes", JSON.stringify(productData.sizes));
            if (productData.isFeatured) {
                formData.append("isFeatured", "true");
            }

            // Add images (React Native: append file objects with uri/name/type)
            for (const image of images) {
                const uri = image;
                const filename = uri.split("/").pop() || `product-${Date.now()}.jpg`;
                const match = /\.([a-zA-Z0-9]+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : "image/jpeg";
                // @ts-ignore - RN FormData file object
                formData.append("images", { uri, name: filename, type });
            }

            const token = await this.getToken();
            console.log("[productService] createProduct auth token", {
                hasToken: Boolean(token),
                imageCount: images.length,
            });

            const headers: Record<string, string> = {
                Accept: "application/json",
            };
            if (token) headers.Authorization = `Bearer ${token}`;

            return await this.fetchJson(`/products`, {
                method: "POST",
                headers,
                body: formData,
            });
        } catch (error: any) {
            console.error("[productService] createProduct failed", {
                message: error?.message,
                stack: error?.stack,
            });
            return {
                success: false,
                message: error.message || "Failed to create product",
            };
        }
    }

    /**
     * Update a product (admin only)
     */
    async updateProduct(
        id: string,
        productData: UpdateProductData,
        newImages?: string[],
        existingImages?: string[]
    ): Promise<ApiResponse<Product>> {
        try {
            const formData = new FormData();

            // Add form fields
            if (productData.name) formData.append("name", productData.name);
            if (productData.description) formData.append("description", productData.description);
            if (productData.price) formData.append("price", String(productData.price));
            if (productData.comparePrice) formData.append("comparePrice", String(productData.comparePrice));
            if (productData.category) formData.append("category", productData.category);
            if (productData.stock !== undefined) formData.append("stock", String(productData.stock));
            if (productData.sizes) formData.append("sizes", JSON.stringify(productData.sizes));
            if (productData.isFeatured !== undefined) {
                formData.append("isFeatured", String(productData.isFeatured));
            }

            // Add existing images
            if (existingImages && existingImages.length > 0) {
                formData.append("existingImages", JSON.stringify(existingImages));
            }

            // Add new images
            if (newImages && newImages.length > 0) {
                for (const image of newImages) {
                    const uri = image;
                    const filename = uri.split("/").pop() || `product-${Date.now()}.jpg`;
                    const match = /\.([a-zA-Z0-9]+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : "image/jpeg";
                    // @ts-ignore - RN FormData file object
                    formData.append("images", { uri, name: filename, type });
                }
            }

            const token = await this.getToken();
            const headers: Record<string, string> = {
                Accept: "application/json",
            };
            if (token) headers.Authorization = `Bearer ${token}`;

            return await this.fetchJson(`/products/${id}`, {
                method: "PUT",
                headers,
                body: formData,
            });
        } catch (error: any) {
            return {
                success: false,
                message: error.message || "Failed to update product",
            };
        }
    }

    /**
     * Delete a product (admin only)
     */
    async deleteProduct(id: string): Promise<ApiResponse<null>> {
        try {
            const token = await this.getToken();
            return await this.fetchJson(`/products/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : "",
                },
            });
        } catch (error: any) {
            return {
                success: false,
                message: error.message || "Failed to delete product",
            };
        }
    }

    /**
     * Toggle product status (admin only)
     */
    async toggleProductStatus(id: string): Promise<ApiResponse<Product>> {
        try {
            const token = await this.getToken();
            return await this.fetchJson(`/products/${id}/toggle-status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : "",
                },
            });
        } catch (error: any) {
            return {
                success: false,
                message: error.message || "Failed to toggle product status",
            };
        }
    }

    /**
     * Toggle featured status (admin only)
     */
    async toggleFeaturedStatus(id: string): Promise<ApiResponse<Product>> {
        try {
            const token = await this.getToken();
            return await this.fetchJson(`/products/${id}/toggle-featured`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : "",
                },
            });
        } catch (error: any) {
            return {
                success: false,
                message: error.message || "Failed to toggle featured status",
            };
        }
    }

    /**
     * Get product statistics (admin only)
     */
    async getProductStats(): Promise<ApiResponse<any>> {
        try {
            const token = await this.getToken();
            return await this.fetchJson(`/products/stats/admin`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : "",
                },
            });
        } catch (error: any) {
            return {
                success: false,
                message: error.message || "Failed to fetch statistics",
            };
        }
    }
}

export const productService = new ProductService();
