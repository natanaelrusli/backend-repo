import { NextFunction, Request, Response } from "express";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import { UserCollection } from "../repository/userCollection";
import { db } from "../config/firebaseConfig";
import { AuthRequest } from "../middleware/authMiddleware";
import { User } from "../entities/user";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export class UserController {
  static async getUserData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as User;
      if (!user) {
        res.status(403).json({ message: "Unauthorized access" });
        return;
      }

      const users = await UserCollection.getOneUserByEmail(db, user.email);
      res.status(200).json({
        message: "ok",
        data: {
          email: users?.email,
          name: users?.name
        },
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
        res.status(400).json({ message: "Email already exists." });
        return;
      }

      const newUser = await UserCollection.createUser(db, { email, password, name })
      res.status(201).json({
        message: "User created successfully.",
        data: newUser
      });
    } catch (e) {
      next(e);
    }
  }

  static async updateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const requestUser = req.user as User;
    const { name, email, password } = req.body as Partial<User>;
    if (!requestUser) {
      res.status(403).json({ message: "Unauthorized access" });
      return;
    }

    try {
      const userData = await UserCollection.getOneUserByEmail(db, requestUser.email);

      const updateData = {
        name: name || userData?.name,
        email: email || userData?.email
      } as User;

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      } else {
        updateData.password = userData?.password || ''
      }

      await UserCollection.updateUser(db, requestUser.userId, updateData);
      res.status(200).json({ message: "User updated" });
    } catch (error: unknown) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message })
      } else {
        res.status(500).json({ message: "An error occurred." });
      }
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

        res.status(200).json({ message: "Login successful.", token: token });
      } else {
        res.status(401).json({ message: "Invalid email or password." });
      }
    } catch (e) {
      next(e);
    }
  }
}
