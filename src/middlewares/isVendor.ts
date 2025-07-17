import { NextFunction, Request, Response } from "express";
import { isAuthenticated } from "./isAuthenticated";

export const isVendor = (req: Request, res: Response, next: NextFunction) => {
  isAuthenticated(req, res, function () {
    if (req.user && req.user.role === "vendor") {
      return next();
    }
    return res.status(403).json({ message: "Vendor access required" });
  });
};
