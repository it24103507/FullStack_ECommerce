import { Request, Response } from "express";
import Wishlist from "../models/Wishlist.js";

export const getWishlist = async (req: Request, res: Response) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user._id }).populate("products").lean();
        res.json({ success: true, data: wishlist?.products || [] });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleWishlistItem = async (req: Request, res: Response) => {
    try {
        const { productId } = req.body;
        let wishlist = await Wishlist.findOne({ user: req.user._id });
        if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, products: [] });

        const exists = wishlist.products.some((product) => product.toString() === productId);
        wishlist.products = exists
            ? wishlist.products.filter((product) => product.toString() !== productId)
            : [...wishlist.products, productId];
        await wishlist.save();

        const populated = await Wishlist.findById(wishlist._id).populate("products").lean();
        res.json({ success: true, data: populated?.products || [] });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const removeWishlistItem = async (req: Request, res: Response) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user._id });
        if (!wishlist) return res.json({ success: true, data: [] });

        wishlist.products = wishlist.products.filter((product) => product.toString() !== req.params.productId);
        await wishlist.save();
        const populated = await Wishlist.findById(wishlist._id).populate("products").lean();
        res.json({ success: true, data: populated?.products || [] });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
