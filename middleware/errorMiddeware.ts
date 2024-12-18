import { NextFunction, Request, Response } from "express";
import { ResponseError } from "../errors/responseError";

export const errorMiddleware = async (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("middleware run");
  if (error instanceof ResponseError) {
    res.status(error.statusCode).json({
      errors: error.message,
    });
  } else {
    res.status(500).json({
      error: error.message,
    });
  }
};
