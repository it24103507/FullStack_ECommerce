import mongoose from "mongoose";
import { IUser } from "../types/index.js";

const userSchema = new mongoose.Schema<IUser> (

        { name: {type:String, trim: true},
          email: {type:String, trim: true, unique: true},
          clerkId: {type:String, unique: true, sparse: true},
          image: {type:String},
          role: {type: String, enum: ["user", "admin"], default: "user"},
              isActive: {type: Boolean, default: true},
    
    },

    {timestamps: true}
)

const User = mongoose.model<IUser>('User', userSchema)

export default User;