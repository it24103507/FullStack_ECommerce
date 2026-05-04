import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
export const getOrders = async (req, res) => {
    try {
        const filter = req.user?.role === "admin" ? {} : { user: req.user._id };
        const orders = await Order.find(filter).sort({ createdAt: -1 }).populate("items.product").lean();
        res.json({ success: true, data: orders });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const getOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, ...(req.user?.role === "admin" ? {} : { user: req.user._id }) })
            .populate("items.product")
            .lean();
        if (!order)
            return res.status(404).json({ success: false, message: "Order not found" });
        res.json({ success: true, data: order });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const createOrder = async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod, paymentStatus, orderStatus, subtotal, shippingCost, tax, totalAmount, notes } = req.body;
        const orderNumber = `ORD-${Date.now()}`;
        const order = await Order.create({
            user: req.user._id,
            orderNumber,
            items,
            shippingAddress,
            paymentMethod,
            paymentStatus: paymentStatus || (paymentMethod === "stripe" ? "paid" : "pending"),
            orderStatus: orderStatus || "placed",
            subtotal,
            shippingCost,
            tax,
            totalAmount,
            notes,
        });
        await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [], totalAmount: 0 } });
        res.status(201).json({ success: true, data: order });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order)
            return res.status(404).json({ success: false, message: "Order not found" });
        order.orderStatus = req.body.orderStatus;
        if (req.body.orderStatus === "delivered") {
            order.deliveredAt = new Date();
        }
        await order.save();
        res.json({ success: true, data: order });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const updateOrderPaymentStatus = async (req, res) => {
    try {
        const { paymentStatus, paymentIntentId } = req.body;
        if (!["pending", "paid", "failed", "refunded"].includes(paymentStatus)) {
            return res.status(400).json({ success: false, message: "Invalid payment status" });
        }
        const order = await Order.findById(req.params.id);
        if (!order)
            return res.status(404).json({ success: false, message: "Order not found" });
        order.paymentStatus = paymentStatus;
        if (paymentIntentId) {
            order.paymentIntentId = paymentIntentId;
        }
        await order.save();
        res.json({ success: true, data: order });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const captureOrderPayment = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order)
            return res.status(404).json({ success: false, message: "Order not found" });
        order.paymentStatus = "paid";
        await order.save();
        res.json({ success: true, data: order });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const refundOrderPayment = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order)
            return res.status(404).json({ success: false, message: "Order not found" });
        order.paymentStatus = "refunded";
        await order.save();
        res.json({ success: true, data: order });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
