import mongoose, { Schema } from "mongoose";

export interface IProduct {
  name: string;
  description: string;
  price: number;
  code: string;
  vendorInfo: {
    name: string;
    email: string;
  };
}

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true, trim: true },
    code: { type: String, unique: true, required: true, trim: true },
    vendorInfo: {
      type: new mongoose.Schema({
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true },
      }),
    },
  },
  { timestamps: true }
);

export default mongoose.model<IProduct>("Product", productSchema);
