import express from "express";
import { UserController } from "../controller/api";
import { authMiddleware } from "../middleware/authMiddleware";

export const userRoute = express.Router();

userRoute.get("/fetch-user-data", authMiddleware, UserController.getUserData);
userRoute.post("/create-user", UserController.createUser);
userRoute.post("/login", UserController.loginUser);
