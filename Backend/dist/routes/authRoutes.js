"use strict";
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
router.post("/google-login", authController_1.googleLogin);
router.get('/Profile', authMiddleware_1.authenticateToken, (req, res) => {
    const user = userModels_1.default.findOne({ email: req.user.email });
    res.json({
        message: "welcome to profile",
        user: req.user
    });
});
exports.default = router;
