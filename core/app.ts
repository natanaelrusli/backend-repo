import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { userRoute } from "../routes/userRoutes";
import cors from "cors";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
app.use(express.json());

app.use(cors());
app.use(userRoute);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});