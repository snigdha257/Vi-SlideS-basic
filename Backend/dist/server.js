"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./config/db"));
const dotenv_1 = __importDefault(require("dotenv"));
const socketServer_1 = require("./socketServer");
const http_1 = require("http");
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
dotenv_1.default.config();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
(0, db_1.default)();
app.use("/", authRoutes_1.default);
app.get("/", (req, res) => {
    res.send("Server working");
});
const httpServer = (0, http_1.createServer)(app);
const { io } = (0, socketServer_1.createSocketServer)(httpServer);
httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Socket.IO server running`);
});
