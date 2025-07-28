import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import { authRoutes } from "./routes/authRoute";
import User from "./models/User";
import { productRoute } from "./routes/productRoute";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { oauthRoutes } from "./routes/oauthRoute";
import asyncHandler from "express-async-handler";
import { isAuthenticated } from "./middlewares/isAuthenticated";

export const app = express();
dotenv.config();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again later.",
  })
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile: any, done) => {
      // You can add DB logic here to save or fetch user
      const googleUser = {
        id: profile.id,
        name: profile.displayName,
        email: profile?.emails[0]?.value,
      };

      let user = await User.findOne({ email: googleUser.email });

      if (!user) {
        user = await User.create({
          fullname: googleUser.name,
          email: googleUser.email,
          password: null,
          role: "customer",
          googleId: googleUser.id,
        });
      }

      return done(null, user);
    }
  )
);

// Initialize Passport
app.use(passport.initialize());

const connectToDb = async () => {
  try {
    const conn = await mongoose.connect(
      "mongodb://localhost:27017/bisame-test-node-app"
    );

    conn && console.log(`Mongo DB Database connected successfully`);
  } catch (err) {
    console.log(err);
  }
};
connectToDb();

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/auth/google", oauthRoutes);
app.use("/api/products", productRoute);

app.get(
  "/user",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const user = req.user;

    res
      .status(200)
      .json({ message: "User retrieved successfully", data: user });
    return;
  })
);

app.get("/users", async (req: Request, res: Response) => {
  const users = await User.find();

  res.status(200).send(users);
});

app.get("/", (req: Request, res: Response) => {
  res.status(200).send({ data: "Hello World" });
});

app.listen(4000, () => {
  console.log("Connection started!!");
});
