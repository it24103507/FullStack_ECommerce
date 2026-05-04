import { Product, WishlistContextType } from "@/constants/types";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { storeService } from "@/services/storeService";

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children:ReactNode }) {

    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchWishlist = async () => {
        setLoading(true);
        const response = await storeService.getWishlist();
        setWishlist((response.data || []) as Product[]);
        setLoading(false);
    }

    const toggleWishlist = async (product: Product) => {
        await storeService.toggleWishlistItem(product._id);
        await fetchWishlist();
    }

    const isInWishlist = (productId: string) => {
        return wishlist.some((p) => p._id === productId);
    }

    useEffect(() => {
        fetchWishlist();
    }, [])

    return (
        <WishlistContext.Provider value={{ wishlist, loading, toggleWishlist, isInWishlist }}>
            {children}
        </WishlistContext.Provider> 
    )
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error("useWishlist must be used within a WishlistProvider");
    }
    return context;
}