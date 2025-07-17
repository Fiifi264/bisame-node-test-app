import { NextFunction } from "express";
import jwt from "jsonwebtoken";

export const isAuthenticated = (req: any, res: any, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res
      .status(401)
      .json({ message: "You do not have permission to access this resource" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, `${"my-jwt-access-token"}`) as {
      id: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};
