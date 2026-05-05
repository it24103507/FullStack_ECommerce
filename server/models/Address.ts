import mongoose from "mongoose";
import { IAddress } from "../types/index.js";

const addressSchema = new mongoose.Schema<IAddress>(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, enum: ["Home", "Work", "Other"], default: "Home" },
        street: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        zipCode: { type: String, required: true, trim: true },
        country: { type: String, required: true, trim: true },
        isDefault: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Address = mongoose.model<IAddress>("Address", addressSchema);

export default Address;
