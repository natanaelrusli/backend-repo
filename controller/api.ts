import { NextFunction, Request, Response } from "express";
import { db } from "../config/firebaseConfig";
import { UserCollection } from "../repository/userCollection";

export class UserController {
  static async getUserData(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const users = await UserCollection.getUsers(db);
      res
        .status(200)
        .json({
          "message": "ok",
          "data": users
        });
    } catch(e) {
      console.error(e);
      next(e);
    }
  }
}