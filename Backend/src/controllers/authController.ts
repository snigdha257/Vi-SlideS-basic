import {Request,Response,NextFunction} from 'express';
import User from "../models/userModels";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

//user registration----------
export const registerUser = async (req: Request, res: Response) => {
 const {email,password}:{email:string;password:string}=req.body;
 try{
    const existingUser=await User.findOne({email});
    if(existingUser){
       return res.status(400).json({message:"User already exists"});
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
        email:email,
        password:hashedPassword
    });
    await newUser.save();
 
    res.json({message:"Registration successful"});
 }catch(error){ 
    console.error("Registration error:",error);
    res.status(500).json({message:"Server error"});
 }
};

 // User login---------------
export const loginUser = async (req: Request, res: Response) => {
    const {email,password}=req.body;
    try{
    const user=await User.findOne({email});
    if(!user){
      return  res.status(401).json({message:"invalid credentials"});
    }
   const isMatch=await bcrypt.compare(password,user.password);
   if(!isMatch){
    return res.status(401).json({message:"invalid credentials"});
   }
  
  
    const token=jwt.sign(
        {email:user.email},
        process.env.JWT_SECRET as string,
        {expiresIn:"1h"}
    );
      res.json({
        message:"Login successful",
        token: token
    });
}catch(error){          
    console.error("Login error:",error);
    res.status(500).json({message:"Server error"});     
}
   
  
};
