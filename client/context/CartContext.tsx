import { Product } from "@/constants/types";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { storeService } from "@/services/storeService";

export type CartItem = {
    id: string;
    productId: string;
    product: Product;
    quantity: number;
    size: string;
    price: number;
}

type CartContextType = {
    cartItems: CartItem[];
    addToCart: (product: Product, size: string) => Promise<void>;
    removeFromCart: (itemId: string) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    cartTotal: number;
    itemCount: number;
    isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children:ReactNode }) {

    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoading, setLoading] = useState(false);
    const [cartTotal, setCartTotal] = useState(0);

    const fetchCart = async () => {
        setLoading(true);
        const response = await storeService.getCart();
        const serverCart = response.data || { items: [], totalAmount: 0 };
        const mappedItems = (serverCart.items || []).map((item: any) => ({
            id: item._id || item.product?._id,
            productId: item.product?._id,
            product: item.product,
            quantity: item.quantity,
            size: item?.size || "M",
            price: item.price,
        }));
        setCartItems(mappedItems);
        setCartTotal(serverCart.totalAmount || mappedItems.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0));
        setLoading(false);
    }

    const addToCart = async (product: Product, size: string) => {
        await storeService.addToCart(product._id, size, 1);
        await fetchCart();
    };

    const removeFromCart = async (itemId: string) => {
        await storeService.removeCartItem(itemId);
        await fetchCart();
    };

    const updateQuantity = async (itemId: string, quantity: number) => {
        await storeService.updateCartItem(itemId, quantity);
        await fetchCart();
    };

    const clearCart = async () => {
        await storeService.clearCart();
        setCartItems([]);
        setCartTotal(0);
    };

    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);


    useEffect(() => {
        fetchCart();
    }, [])

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart,
         cartTotal, itemCount, isLoading }}>
            {children}
        </CartContext.Provider> 
    )
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}