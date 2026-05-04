import mongoose from "mongoose";
import { ICart } from "../types/index.js";

const cartItemSchema = new mongoose.Schema(
    {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        price: { type: Number, required: true, min: 0 },
        size: { type: String },
    },
    { timestamps: false }
);

const cartSchema = new mongoose.Schema<ICart>(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        items: { type: [cartItemSchema], default: [] },
        totalAmount: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true }
);

cartSchema.methods.calculateTotal = function calculateTotal() {
    const items = this.items as Array<{ price: number; quantity: number }>;
    this.totalAmount = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);
    return this.totalAmount;
};

cartSchema.pre("save", function updateTotal(this: any) {
    this.calculateTotal();
});

const Cart = mongoose.model<ICart>("Cart", cartSchema);

export default Cart;