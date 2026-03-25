import express from "express";
import authRoutes from './routes/authRoutes';
import sessionRoutes from './routes/sessionRoutes';
import cors from "cors";
import connectDB from "./config/db";
import dotenv from 'dotenv';
import { createSocketServer } from "./socketServer";
import { createServer } from 'http';


const app = express();
const port = process.env.PORT || 5000;
dotenv.config();
app.use(cors());
app.use(express.json());
connectDB();
app.use("/", authRoutes);
app.use("/", sessionRoutes);
app.get("/", (req, res) => {
  res.send("Server working");
});
app.use("/api/session", sessionRoutes);

const httpServer = createServer(app);
const { io } = createSocketServer(httpServer);

httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Socket.IO server running`);
})
