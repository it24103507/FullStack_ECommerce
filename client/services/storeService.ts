import { resolveApiBaseUrl } from "./apiBase";

type AuthTokenProvider = () => Promise<string | null>;

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

class StoreService {
    private authTokenProvider: AuthTokenProvider | null = null;

    setAuthTokenProvider(provider: AuthTokenProvider | null) {
        this.authTokenProvider = provider;
    }

    private async getToken() {
        if (!this.authTokenProvider) {
            return null;
        }

        try {
            return await this.authTokenProvider();
        } catch {
            return null;
        }
    }

    private async request<T>(path: string, init: RequestInit = {}, includeAuth = true): Promise<ApiResponse<T>> {
        try {
            const headers: HeadersInit = {
                "Content-Type": "application/json",
                ...(init.headers || {}),
            };

            if (includeAuth) {
                const token = await this.getToken();
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }
            }

            const baseUrl = await resolveApiBaseUrl();
            console.log(`[storeService] ${String(init.method || "GET")} ${baseUrl}${path}`);
            const response = await fetch(`${baseUrl}${path}`, {
                ...init,
                headers,
            });

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                console.error(`[storeService] ${String(init.method || "GET")} ${path} failed`, {
                    status: response.status,
                    statusText: response.statusText,
                    body: data,
                });
                return {
                    success: false,
                    message: data?.message || `Request failed with status ${response.status}`,
                };
            }

            console.log(`[storeService] ${String(init.method || "GET")} ${path} succeeded`, {
                status: response.status,
            });

            return data;
        } catch (error: any) {
            console.error(`[storeService] ${String(init.method || "GET")} ${path} network error`, {
                message: error?.message,
                stack: error?.stack,
            });
            return {
                success: false,
                message: error.name === "AbortError"
                    ? "Network request timed out"
                    : error.message || "Network request failed",
            };
        }
    }

    // Cart
    getCart() {
        return this.request<any>("/cart");
    }

    addToCart(productId: string, size: string, quantity = 1) {
        return this.request<any>("/cart/items", {
            method: "POST",
            body: JSON.stringify({ productId, size, quantity }),
        });
    }

    updateCartItem(itemId: string, quantity: number) {
        return this.request<any>(`/cart/items/${itemId}`, {
            method: "PATCH",
            body: JSON.stringify({ quantity }),
        });
    }

    removeCartItem(itemId: string) {
        return this.request<any>(`/cart/items/${itemId}`, {
            method: "DELETE",
        });
    }

    clearCart() {
        return this.request<any>("/cart", {
            method: "DELETE",
        });
    }

    // Wishlist
    getWishlist() {
        return this.request<any[]>("/wishlist");
    }

    toggleWishlistItem(productId: string) {
        return this.request<any[]>("/wishlist/toggle", {
            method: "POST",
            body: JSON.stringify({ productId }),
        });
    }

    removeWishlistItem(productId: string) {
        return this.request<any[]>(`/wishlist/${productId}`, {
            method: "DELETE",
        });
    }

    // Addresses
    getAddresses() {
        return this.request<any[]>("/addresses");
    }

    createAddress(data: Record<string, unknown>) {
        return this.request<any>("/addresses", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    updateAddress(id: string, data: Record<string, unknown>) {
        return this.request<any>(`/addresses/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    deleteAddress(id: string) {
        return this.request<any>(`/addresses/${id}`, {
            method: "DELETE",
        });
    }

    // Orders
    getOrders() {
        return this.request<any[]>("/orders");
    }

    getOrder(id: string) {
        return this.request<any>(`/orders/${id}`);
    }

    createOrder(data: Record<string, unknown>) {
        return this.request<any>("/orders", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    updateOrderStatus(id: string, orderStatus: string) {
        return this.request<any>(`/orders/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ orderStatus }),
        });
    }

    updateOrderPaymentStatus(id: string, paymentStatus: string, paymentIntentId?: string) {
        return this.request<any>(`/orders/${id}/payment`, {
            method: "PATCH",
            body: JSON.stringify({ paymentStatus, paymentIntentId }),
        });
    }

    captureOrderPayment(id: string) {
        return this.request<any>(`/orders/${id}/capture`, {
            method: "PATCH",
        });
    }

    refundOrderPayment(id: string) {
        return this.request<any>(`/orders/${id}/refund`, {
            method: "PATCH",
        });
    }

    getAdminStats() {
        return this.request<any>("/admin/stats");
    }

    getUsers() {
        return this.request<any[]>("/admin/users");
    }

    updateUserRole(id: string, role: "user" | "admin") {
        return this.request<any>(`/admin/users/${id}/role`, {
            method: "PATCH",
            body: JSON.stringify({ role }),
        });
    }

    updateUserStatus(id: string, isActive: boolean) {
        return this.request<any>(`/admin/users/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ isActive }),
        });
    }

    deleteUser(id: string) {
        return this.request<any>(`/admin/users/${id}`, {
            method: "DELETE",
        });
    }
}

export const storeService = new StoreService();
