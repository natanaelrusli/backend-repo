import { NextFunction, Request, Response } from "express";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore/lite";
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

      const users = await UserCollection.getOneUser(db, user.userId);
      res.status(200).json({
        message: "ok",
        data: users,
      });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }

  static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { email, password, name } = req.body;

    try {
      const usersCol = collection(db, "users");
      const emailQuery = query(usersCol, where("email", "==", email));
      const emailSnapshot = await getDocs(emailQuery);

      if (!emailSnapshot.empty) {
        res.status(400).json({ message: "Email already exists." });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const userRef = await addDoc(usersCol, { email, password: hashedPassword, name });
      res.status(201).json({ message: "User created successfully.", userId: userRef.id });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }

  static async loginUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { email, password } = req.body;

    try {
      const usersCol = collection(db, "users");
      const emailQuery = query(usersCol, where("email", "==", email));
      const emailSnapshot = await getDocs(emailQuery);

      if (emailSnapshot.empty) {
        res.status(401).json({ message: "Invalid email or password." });
        return;
      }

      const userDoc = emailSnapshot.docs[0];
      const userData = userDoc.data();

      const isPasswordValid = await bcrypt.compare(password, userData.password);

      if (isPasswordValid) {
        const token = jwt.sign(
          { userId: userDoc.id, email: userData.email },
          JWT_SECRET,
          { expiresIn: "1h" }
        );

        res.status(200).json({ message: "Login successful.", token: token });
      } else {
        res.status(401).json({ message: "Invalid email or password." });
      }
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
}
