import express from "express";
import {registerUser,loginUser} from "../controllers/authController";
import { authenticateToken } from "../middleware/authMiddleware";
const router=express.Router();
router.post("/register",registerUser);
router.post("/login",loginUser);
router.get('/Profile', authenticateToken, (req:any, res:any) => {
    res.json({
        message: "welcome to profile",
        user: req.user
    });
});
export default router;