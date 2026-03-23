"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleLogin = exports.loginUser = exports.registerUser = void 0;
const userModels_1 = __importDefault(require("../models/userModels"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const google_auth_library_1 = require("google-auth-library");
//user registration----------
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, name, role } = req.body;
    try {
        if (!email || !password || !name || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const existingUser = yield userModels_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const newUser = new userModels_1.default({
            email: email,
            password: hashedPassword,
            name: name,
            role: role
        });
        yield newUser.save();
        res.json({ message: "Registration successful" });
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.registerUser = registerUser;
// User login---------------
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield userModels_1.default.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "invalid credentials" });
        }
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "invalid credentials" });
        }
        const token = jsonwebtoken_1.default.sign({ email: user.email, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({
            message: "Login successful",
            token: token,
            user: {
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.loginUser = loginUser;
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const googleLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, role } = req.body;
    try {
        const ticket = yield client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            return res.status(400).json({ message: "Invalid Google token" });
        }
        const { email, name } = payload;
        let user = yield userModels_1.default.findOne({ email });
        if (!user) {
            const userRole = role || 'student';
            const randomPassword = yield bcrypt_1.default.hash(Math.random().toString(36).slice(-8), 10);
            user = new userModels_1.default({
                email: email,
                password: randomPassword,
                name: name,
                role: userRole
            });
            yield user.save();
        }
        // Generate JWT token
        const jwtToken = jsonwebtoken_1.default.sign({ email: user.email, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({
            message: "Google Login successful",
            token: jwtToken,
            user: {
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error("Google Login error:", error);
        res.status(500).json({ message: "Server error during Google login" });
    }
});
exports.googleLogin = googleLogin;
