import express, { Express } from "express";
import dotenv from "dotenv";
import { userRoute } from "../routes/userRoutes";
import cors from "cors";
import { logger } from "../middleware/loggerMiddleware";
import { errorMiddleware } from "../middleware/errorMiddeware";

dotenv.config();

const app: Express = express();
app.use(express.json());
app.use(logger);
app.use(cors());
app.use(userRoute);
app.use(errorMiddleware);

export default app;
