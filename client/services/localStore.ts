import * as SecureStore from "expo-secure-store";

const CART_KEY = "forever_cart";
const WISHLIST_KEY = "forever_wishlist";
const ADDRESSES_KEY = "forever_addresses";
const ORDERS_KEY = "forever_orders";

async function getJson<T>(key: string, fallback: T): Promise<T> {
    const value = await SecureStore.getItemAsync(key);
    if (!value) return fallback;

    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
}

async function setJson(key: string, value: unknown) {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
}

async function remove(key: string) {
    await SecureStore.deleteItemAsync(key);
}

export const localStore = {
    getCart: () => getJson<any>(CART_KEY, { items: [], totalAmount: 0 }),
    setCart: (value: unknown) => setJson(CART_KEY, value),
    clearCart: () => remove(CART_KEY),

    getWishlist: () => getJson<any[]>(WISHLIST_KEY, []),
    setWishlist: (value: unknown) => setJson(WISHLIST_KEY, value),
    clearWishlist: () => remove(WISHLIST_KEY),

    getAddresses: () => getJson<any[]>(ADDRESSES_KEY, []),
    setAddresses: (value: unknown) => setJson(ADDRESSES_KEY, value),
    clearAddresses: () => remove(ADDRESSES_KEY),

    getOrders: () => getJson<any[]>(ORDERS_KEY, []),
    setOrders: (value: unknown) => setJson(ORDERS_KEY, value),
    clearOrders: () => remove(ORDERS_KEY),
};