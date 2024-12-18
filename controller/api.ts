import { NextFunction, Request, Response } from "express";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import { UserCollection } from "../repository/userCollection";
import { db } from "../config/firebaseConfig";
import { AuthRequest } from "../middleware/authMiddleware";
import { User } from "../entities/user";
import { ResponseError } from "../errors/responseError";
import { sendResponse } from "../utils/responseHelper";  // Import the response helper

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export class UserController {
  static async getUserData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as User;
      if (!user) {
        throw new ResponseError(403, "Unauthorized access")
      }

      const users = await UserCollection.getOneUserByEmail(db, user.email);
      sendResponse(res, 200, "User data fetched successfully", {
        email: users?.email,
        name: users?.name,
      });
    } catch (e) {
      next(e);
    }
  }

  static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { email, password, name } = req.body;

    try {
      const emailExists = await UserCollection.getOneUserByEmail(db, email);
      if (emailExists) {
        throw new ResponseError(400, "Email already exists.");
      }

      const newUser = await UserCollection.createUser(db, { email, password, name });
      sendResponse(res, 201, "User created successfully", newUser);
    } catch (e) {
      next(e);
    }
  }

  static async updateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const requestUser = req.user as User;
    const { name, email, password } = req.body as Partial<User>;

    if (!requestUser) {
      throw new ResponseError(403, "Unauthorized access");
    }

    try {
      const userData = await UserCollection.getOneUserByEmail(db, requestUser.email);

      const updateData = {
        name: name || userData?.name,
        email: email || userData?.email,
      } as User;

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      } else {
        updateData.password = userData?.password || '';
      }

      await UserCollection.updateUser(db, requestUser.userId, updateData);
      sendResponse(res, 200, "User updated successfully");
    } catch (e) {
      next(e);
    }
  }

  static async loginUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { email, password } = req.body as User;

    try {
      const userData = await UserCollection.getOneUserByEmail(db, email);

      const isPasswordValid = await bcrypt.compare(password, userData?.password || '');

      if (isPasswordValid) {
        const token = jwt.sign(
          { userId: userData?.userId, email: userData?.email },
          JWT_SECRET,
          { expiresIn: "1h" }
        );

        sendResponse(res, 200, "Login successful", { token });
      } else {
        sendResponse(res, 401, "Invalid email or password.");
      }
    } catch (e) {
      next(e);
    }
  }
}
