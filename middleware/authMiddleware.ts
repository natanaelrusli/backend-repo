import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

const SECRET_KEY = "your_jwt_secret";

export interface AuthRequest extends Request {
  user?: string | JwtPayload;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    res.status(401).json({ message: "Access denied. No token provided." });
    return;
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token." });
    return;
  }
};
