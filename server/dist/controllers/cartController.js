import Cart from "../models/Cart.js";
import Product from "../models/Products.js";
export const getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id }).populate("items.product").lean();
        res.json({ success: true, data: cart || { items: [], totalAmount: 0 } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const addToCart = async (req, res) => {
    try {
        const { productId, size, quantity = 1 } = req.body;
        const product = await Product.findById(productId);
        if (!product)
            return res.status(404).json({ success: false, message: "Product not found" });
        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart)
            cart = await Cart.create({ user: req.user._id, items: [] });
        const existing = cart.items.find((item) => item.product.toString() === productId && item.size === size);
        if (existing) {
            existing.quantity += quantity;
            existing.price = product.price;
        }
        else {
            cart.items.push({ product: product._id, quantity, price: product.price, size });
        }
        await cart.save();
        const populated = await Cart.findById(cart._id).populate("items.product").lean();
        res.json({ success: true, data: populated });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const updateCartItem = async (req, res) => {
    try {
        const { quantity } = req.body;
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart)
            return res.status(404).json({ success: false, message: "Cart not found" });
        const item = cart.items.find((entry) => entry._id?.toString() === req.params.itemId);
        if (!item)
            return res.status(404).json({ success: false, message: "Cart item not found" });
        item.quantity = quantity;
        await cart.save();
        const populated = await Cart.findById(cart._id).populate("items.product").lean();
        res.json({ success: true, data: populated });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const removeCartItem = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart)
            return res.json({ success: true, data: { items: [], totalAmount: 0 } });
        cart.items = cart.items.filter((item) => item._id?.toString() !== req.params.itemId);
        await cart.save();
        const populated = await Cart.findById(cart._id).populate("items.product").lean();
        res.json({ success: true, data: populated });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const clearCart = async (req, res) => {
    try {
        await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [], totalAmount: 0 } }, { upsert: true, new: true });
        res.json({ success: true, message: "Cart cleared" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
