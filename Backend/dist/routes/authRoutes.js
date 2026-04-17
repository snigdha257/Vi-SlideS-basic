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
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const userModels_1 = __importDefault(require("../models/userModels"));
const router = express_1.default.Router();
router.post("/register", authController_1.registerUser);
router.post("/login", authController_1.loginUser);
router.post('/logout', authController_1.logoutUser);
router.get('/auth/google', authController_1.startGoogleAuth);
router.get('/auth/google/callback', authController_1.googleCallback);
router.get('/profile', authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield userModels_1.default.findOne({ email: req.user.email }).select('-password');
    res.json({
        message: "welcome to profile",
        user: user || req.user
    });
}));
exports.default = router;
