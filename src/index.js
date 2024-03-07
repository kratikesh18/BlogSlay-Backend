import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectToDB from "./DB/index.js";
import userRouter from "./routes/user.router.js";

dotenv.config({ path: "/.env" });

const app = express();
const port = process.env.PORT || 8000;

//this will convert the req body from string to json
app.use(express.json());

app.use(
  cors({
    origin: [process.env.CORS_ORIGIN, "http://localhost:5174"],
    credentials: true,
  })
);

console.log(process.env.CORS_ORIGIN);
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.use("/api/v1/user", userRouter);

connectToDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`app is listening to the port : http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.log("DB connection Failed", error);
  });
