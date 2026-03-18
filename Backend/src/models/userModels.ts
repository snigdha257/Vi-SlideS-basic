import mongoose from "mongoose";
import { rootCertificates } from "node:tls";
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    role:{
        type:String,
        required:true,
        enum:["student","teacher"]
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    }
});
const User = mongoose.model("User",userSchema);
export default User;