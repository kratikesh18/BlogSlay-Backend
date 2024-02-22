import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectToDB from "./DB/index.js";
import userRouter from "./routes/user.router.js";
import cookieParser from "cookie-parser";

dotenv.config({ path: "/.env" });

const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// app.post("/register", (req, res) => {
//   const { username, email, password } = req.body;
//   res.json({ requestData: { username, password, email } });
// });

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
