import path from "path";
import express from "express";
import cors from "cors";
import colors from "colors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
dotenv.config({ silent: process.env.NODE_ENV === "production" });
import bodyParser from "body-parser";

import { connectDB } from "./Config/db.js";
import { errorHandler } from "./middleware/errorMiddleware.js";

import resetpasswordRoute from './Routes/resetpasswordRoute.js'
import accessRoute from './Routes/accessRoute.js'
import profileRoute from './Routes/profileUpdate.js'
import GeminiApi from './Routes/geminiRoute.js'
import codedoc from './Routes/DocRoute.js'
import ImageGenerate from './Routes/ImageGenerateRoute.js'

const port = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
connectDB();
const app = express();
app.use(express.json());

const corsOpts = {
  origin: "*",
};

app.use(cors(corsOpts));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

var jsonParser = bodyParser.json();

app.use("/", accessRoute);
app.use("/", resetpasswordRoute);
app.use("/profile-update", profileRoute);
app.use("/", GeminiApi);
app.use("/", codedoc);
app.use("/", ImageGenerate);



app.use(errorHandler);
app.listen(port, () => console.log(`Server started on port ${port}`));
