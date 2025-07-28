import express from "express";
import passport from "passport";
import { generateToken } from "./authRoute";
import User, { IUser } from "../models/User";
import asyncHandler from "express-async-handler";

const router = express.Router();

router.get(
  "/",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  asyncHandler(async (req, res) => {
    // Generate JWT
    // const token = jwt.sign(req.user, process.env.JWT_SECRET, { expiresIn: "1h" });

    const user = req.user as IUser;

    const tokens = generateToken(user._id, user.role);

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

    // Send token to client (or set cookie, etc.)
    // res.json({ token });
    return;
  })
);

export { router as oauthRoutes };
