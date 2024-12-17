import express from "express";
import { UserController } from "../controller/api";

export const userRoute = express.Router();
userRoute.get(
  "/fetch-user-data",
  UserController.getUserData
)
