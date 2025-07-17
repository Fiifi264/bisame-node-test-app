import express, { Request, Response } from "express";
import mongoose from "mongoose";
import morgan from "morgan";

// Models

const User = mongoose.model(
  "User",
  new mongoose.Schema(
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
      username: {
        type: String,
        required: [true, "Username is required"],
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
  )
);

interface IUser {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  password: string;
  email?: string;
  referalCode: number | string;
  referal?: {
    refered: boolean;
    code: string;
    refererName: string;
  };
}

const registeredUsers = [] as IUser[];

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const generateReferalCode = () => {
  return Math.random().toString().split(".")[1].substring(0, 7);
};

const getReferrerDetails = (code: string | undefined) => {
  const referer = registeredUsers.find((user) => user.referalCode === code);

  if (referer)
    return {
      code: referer.referalCode,
      name: referer.firstName + referer.lastName,
    };

  return { code: null, name: null };
};

app.post("/register", (req: Request, res: Response) => {
  const reqData = req.body;

  if (
    !reqData ||
    !reqData.firstName ||
    !reqData.lastName ||
    !reqData.phoneNumber ||
    !reqData.password
  ) {
    res.status(400).send({
      message: "First, last name and phone number and password are required",
    });
    return;
  }

  const user = registeredUsers.find(
    (user) => user.phoneNumber === reqData.phoneNumber
  );

  if (user) {
    res.status(400).send({ message: "User already exist" });
    return;
  }

  const { firstName, lastName, phoneNumber, email, password, referal } =
    reqData as IUser;

  const referrer = getReferrerDetails(referal?.code);

  const newUser = {
    id: registeredUsers.length + 1,
    firstName,
    lastName,
    phoneNumber,
    password,
    email: email || null,
    referalCode: generateReferalCode(),
    referal: {
      refered: referal?.code ? true : false,
      code: referrer?.code,
      refererName: referrer.name,
    },
  } as IUser;

  registeredUsers.push(newUser);

  res.status(201).send({ message: "User created successfully", data: newUser });
});

app.get("/users", (req: Request, res: Response) => {
  res.status(200).send({ data: registeredUsers });
});

app.get("/", (req: Request, res: Response) => {
  res.status(200).send({ data: "Hello World" });
});

app.listen(4000, () => {
  console.log("Connection started!!");
});
