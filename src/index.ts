import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import { authRoutes } from "./routes/authRoute";
import User from "./models/User";
import { productRoute } from "./routes/productRoute";
import rateLimit from "express-rate-limit";

export const app = express();

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
app.use("/api/products", productRoute);

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
