import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  fullname: string;
  email: string;
  role: "customer" | "vendor" | "admin" | "staff";
  password: string;
  authType: "local" | "google";
  googleId: string;
}

const userSchema = new mongoose.Schema<IUser>(
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
      default: "customer",
    },
    password: {
      type: String,
      minlength: 6,
    },
    authType: {
      type: String,
      required: [true, "Specify authentication type"],
      enum: ["local", "google"],
      default: "local",
    },
    googleId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
