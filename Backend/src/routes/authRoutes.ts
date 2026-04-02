import express from "express";
import jwt from "jsonwebtoken";
import {registerUser,loginUser, googleLogin} from "../controllers/authController";
import { authenticateToken } from "../middleware/authMiddleware";
import User  from "../models/userModels";
import passport from "../config/passport";
const router=express.Router();

router.post("/register",registerUser);
router.post("/login",loginUser);
router.post("/google-login", googleLogin);

// Google OAuth routes
router.get('/auth/google', (req, res, next) => {
  const role = req.query.role ? String(req.query.role) : 'student';
  passport.authenticate('google', { 
    scope: ['profile', 'email'], 
    state: role 
  })(req, res, next);
});

router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login' }),
  (req, res) => {
    res.redirect('http://localhost:5173/auth/success');
  }
);

// Auth success endpoint
router.get('/auth/success', (req, res) => {
  if (req.user) {
    const user = req.user as any;
    
    // Generate JWT token
    const token = jwt.sign(
      { email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "10h" }
    );

    res.json({
      success: true,
      token: token,
      user: {
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } else {
    res.status(401).json({ success: false, message: 'Not authenticated' });
  }
});

router.get('/Profile', authenticateToken, (req:any, res:any) => {
    const user=User.findOne({ email: req.user.email });
    res.json({
        message: "welcome to profile",
        user: req.user
    });
});
export default router;