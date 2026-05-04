import { Request, Response } from "express";
import { clerkClient } from "@clerk/express";
import User from "../models/User.js";
import Product from "../models/Products.js";
import Order from "../models/Order.js";

export const getAdminStats = async (req: Request, res: Response) => {
    try {
        const [totalUsers, totalProducts, orderStats, recentOrders] = await Promise.all([
            User.countDocuments(),
            Product.countDocuments(),
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: "$totalAmount" },
                    },
                },
            ]),
            Order.find().sort({ createdAt: -1 }).limit(5).populate("user").populate("items.product").lean(),
        ]);

        const summary = orderStats[0] || { totalOrders: 0, totalRevenue: 0 };

        res.json({
            success: true,
            data: {
                totalUsers,
                totalProducts,
                totalOrders: summary.totalOrders,
                totalRevenue: summary.totalRevenue,
                recentOrders,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find().sort({ createdAt: -1 }).lean();
        res.json({ success: true, data: users });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { role } = req.body;
        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role" });
        }

        const userDoc = await User.findById(req.params.id);
        if (!userDoc) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        userDoc.role = role;
        await userDoc.save();

        if (userDoc.clerkId) {
            await clerkClient.users.updateUserMetadata(userDoc.clerkId, {
                publicMetadata: {
                    role,
                    isActive: userDoc.isActive,
                },
            });
        }

        const user = await User.findById(req.params.id).lean();
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateUserStatus = async (req: Request, res: Response) => {
    try {
        const { isActive } = req.body;
        const userDoc = await User.findById(req.params.id);
        if (!userDoc) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        userDoc.isActive = Boolean(isActive);
        await userDoc.save();

        if (userDoc.clerkId) {
            await clerkClient.users.updateUserMetadata(userDoc.clerkId, {
                publicMetadata: {
                    role: userDoc.role,
                    isActive: userDoc.isActive,
                },
            });
        }

        res.json({ success: true, data: userDoc });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const userDoc = await User.findById(req.params.id);
        if (!userDoc) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (userDoc.clerkId) {
            await clerkClient.users.deleteUser(userDoc.clerkId);
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "User deleted" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
