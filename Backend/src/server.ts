import express from 'express';
import authRoutes from './routes/authRoutes';
import cors from "cors";
import connectDB from "./config/db";
const app = express();
const port = process.env.PORT || 5000;
import dotenv from 'dotenv';
dotenv.config();
app.use(cors());
app.use(express.json());
connectDB();
app.use("/", authRoutes);
app.get("/", (req, res) => {
  res.send("Server working");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
})




