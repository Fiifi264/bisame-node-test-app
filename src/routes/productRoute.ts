import express, { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Product, { IProduct } from "../models/Product";
import User, { IUser } from "../models/User";
import { isVendor } from "../middlewares/isVendor";

const router = express.Router();
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const page =
      typeof req.query.page === "string" ? parseInt(req.query.page) : 1;
    const limit =
      typeof req.query.limit === "string" ? parseInt(req.query.limit) : 10;

    const skip = (page - 1) * limit;

    const products = await Product.find().skip(skip).limit(limit);

    const total = await Product.countDocuments();

    res.status(200).json({
      message: "Request successful",
      data: {
        products,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

router.get(
  "/search",
  asyncHandler(async (req: Request, res: Response) => {
    const { name, vendorName, minPrice, maxPrice, code } = req.query;

    const query: any = {};

    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    if (vendorName) {
      query["vendorInfo.name"] = { $regex: vendorName, $options: "i" };
    }

    if (code) {
      query.code = code;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = minPrice;
      if (maxPrice) query.price.$lte = maxPrice;
    }

    const products = await Product.find(query);
    res.status(200).json(products);
  })
);

router.get(
  "/:code",
  asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.params;

    const product = await Product.findOne({ code });

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.status(200).json({
      message: "Product retrieved successfully",
      product,
    });
  })
);

router.post(
  "/create",
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, price, vendorInfo, code } = req.body as IProduct;

    if (!name || !description || !price || !vendorInfo || !code) {
      res.status(400).json({
        message: "All fields are required",
      });
      return;
    }

    if (!vendorInfo.email || !vendorInfo.name) {
      res.status(400).json({
        message: "Invalid vendor details",
      });
      return;
    }

    const vendor = await User.findOne({ email: vendorInfo.email });
    if (!vendor) {
      res.status(404).json({
        message: "Vendor not found",
      });
      return;
    }

    const codeExists = await Product.findOne({ code });
    if (codeExists) {
      res.status(400).json({
        message: "Product code already exists",
      });
      return;
    }

    const product = await Product.create({
      name,
      description,
      price,
      vendorInfo,
      code,
    });

    await product.save();

    product &&
      res.status(201).json({
        message: "Product added successful",
        data: {
          id: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          vendorInfo: product.vendorInfo,
        },
      });
  })
);

const productBelongToVendor = (
  product: IProduct,
  vendor: any,
  loggedInUser: any
): boolean => {
  if (
    product.vendorInfo.email === vendor.email &&
    vendor.id === loggedInUser.id
  ) {
    return true;
  }

  return false;
};

router.put(
  "/:code/update",
  isVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, price, vendorInfo } = req.body as IProduct;

    const { code } = req.params;

    const oldProduct = await Product.findOne({ code });

    if (!oldProduct) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    if (!name || !description || !price || !vendorInfo) {
      res.status(400).json({
        message: "All fields are required",
      });
      return;
    }

    if (!vendorInfo.email || !vendorInfo.name) {
      res.status(400).json({
        message: "Invalid vendor details",
      });
      return;
    }

    const vendor = await User.findOne({ email: vendorInfo.email });

    if (!productBelongToVendor(oldProduct, vendor, req.user)) {
      res.status(401).json({
        message: "Product does not belong to vendor",
      });
      return;
    }

    const product = await Product.findOneAndUpdate(
      { code },
      {
        name,
        description,
        price,
        vendorInfo,
      },
      { new: true }
    );

    if (!product) {
      res.status(401).json({
        message: "Product does not belong to vendor",
      });
      return;
    }

    product &&
      res.status(201).json({
        message: "Product updated successful",
        data: {
          id: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          vendorInfo: product.vendorInfo,
        },
      });
  })
);

router.delete(
  "/:code/delete",
  isVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.params;

    const oldProduct = await Product.findOne({ code });

    if (!oldProduct) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const vendor = await User.findOne({ email: oldProduct.vendorInfo.email });

    if (!vendor || !productBelongToVendor(oldProduct, vendor, req.user)) {
      res.status(401).json({
        message: "Product does not belong to vendor",
      });
      return;
    }

    await Product.findOneAndDelete({ code });

    res.status(200).json({ message: "Product deleted successfully" });
    return;
  })
);

export { router as productRoute };
