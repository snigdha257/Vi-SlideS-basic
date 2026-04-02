"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    var _a;
    const authHeader = req.headers["authorization"];
    const bearerToken = authHeader && authHeader.split(" ")[1];
    const cookieToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token;
    const token = bearerToken || cookieToken;
    if (!token) {
        console.log(req.headers);
        return res.status(401).json({
            message: "token missing"
        });
    }
    // Verify token
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                message: "invalid token"
            });
        }
        req.user = user;
        next();
    });
};
exports.authenticateToken = authenticateToken;
