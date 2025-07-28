import express from "express";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User";

const router = express.Router();

export const generateToken = (id: any, role: string) => {
  const accessToken = jwt.sign({ id, role }, "my-jwt-access-token", {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id, role }, "my-jwt-refresh-token", {
    expiresIn: "1d",
  });

  return { accessToken, refreshToken };
};

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { fullname, email, password, role } = req.body;

    if (!fullname || !email || !password || !role) {
      res.status(400).json({
        message: "All fields are required",
      });
      return;
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: "User with that email already exists" });
      return;
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullname,
      email,
      password: hashedPassword,
      role,
    });

    await user.save();

    user &&
      res.status(201).json({
        message: "Registration Successful",
        user: {
          id: user._id,
          email: user.email,
          fullname: user.fullname,
          role: user.role,
        },
      });
  })
);

const refreshTokens: string[] = [];

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Email and Password is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const tokens = generateToken(user._id, user.role);

    refreshTokens.push(tokens.refreshToken);

    res.status(200).json({
      message: "Login Successful",
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
      token: tokens,
    });
  })
);

router.post("/refresh-token", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken || !refreshTokens.includes(refreshToken)) {
    res
      .status(403)
      .json({ message: "Invalid refresh token", tokens: refreshTokens });
    return;
  }

  jwt.verify(refreshToken, "my-jwt-refresh-token", (err: any, user: any) => {
    if (err) {
      res.status(403).json({ message: "Invalid refresh token" });
      return;
    }

    const newAccessToken = jwt.sign(
      { id: user._id, role: user.role },
      "my-jwt-access-token"
    );
    res.json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
    });
  });
});

export { router as authRoutes };
