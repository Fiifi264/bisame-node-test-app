import mongoose from "mongoose";

export interface IUser {
  fullname: string;
  email: string;
  role: "customer" | "vendor" | "amdin" | "staff";
  password: string;
}

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["customer", "vendor", "admin", "staff"],
      required: [true, "Role is required"],
      default: "admin",
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
