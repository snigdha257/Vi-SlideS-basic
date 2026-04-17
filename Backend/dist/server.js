"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const sessionRoutes_1 = __importDefault(require("./routes/sessionRoutes"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const db_1 = __importDefault(require("./config/db"));
const dotenv_1 = __importDefault(require("dotenv"));
const socketServer_1 = require("./socketServer");
const http_1 = require("http");
const os_1 = __importDefault(require("os"));
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
dotenv_1.default.config();
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
(0, db_1.default)();
app.use("/", authRoutes_1.default);
const httpServer = (0, http_1.createServer)(app);
const { io } = (0, socketServer_1.createSocketServer)(httpServer);
// Pass io instance to sessionRoutes
app.use("/", (0, sessionRoutes_1.default)(io));
// Helper endpoint to get server's local IP
app.get("/server-ip", (req, res) => {
    try {
        const interfaces = os_1.default.networkInterfaces();
        let localIp = "localhost";
        for (const name of Object.keys(interfaces)) {
            const iface = interfaces[name];
            if (iface) {
                for (const addr of iface) {
                    // Skip internal and non-IPv4 addresses
                    if (addr.family === 'IPv4' && !addr.internal) {
                        localIp = addr.address;
                        break;
                    }
                }
            }
            if (localIp !== "localhost")
                break;
        }
        res.json({ ip: localIp, port: port });
    }
    catch (error) {
        console.error("Error getting server IP:", error);
        res.json({ ip: "localhost", port: port });
    }
});
app.get("/", (req, res) => {
    res.send("Server working");
});
httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Socket.IO server running`);
});
