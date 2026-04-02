import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token || token === "null" || token === "undefined") {
    console.log("Token missing or invalid:", req.headers);
    return res.status(401).json({
      message: "token missing"
    });
  }

  // Verify token
  jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {

    if (err) {
      console.error("JWT verification error:", err.message);
      console.error("Token causing error:", token);
      return res.status(403).json({
        message: "invalid token",
        error: err.message
      });
    }

    (req as any).user = user;
    next();
  });
};