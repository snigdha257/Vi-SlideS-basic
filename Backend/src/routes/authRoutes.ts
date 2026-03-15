import express from "express";
import {registerUser,loginUser} from "../controllers/authController";
import { authenticateToken } from "../middleware/authMiddleware";
import User  from "../models/userModels";
const router=express.Router();
router.post("/register",registerUser);
router.post("/login",loginUser);
router.get('/Profile', authenticateToken, (req:any, res:any) => {
    const user=User.findOne({ email: req.user.email });
    res.json({
        message: "welcome to profile",
        user: req.user
    });
});
export default router;