
import { Request, Response } from "express";
import { prisma } from "@/lib/db";
import { encode,generateRefreshToken,generateResetToken, verifyResetToken } from "@/utils/jwt";
import bcrypt from "bcrypt";
import { IResponse, IUser } from "@/types";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const REFRESH_SECRET:string = process.env.REFRESH_SECRET as string;

interface ISignupBody {
    name: string,
    email: string,
    password: string
}

async function signUpHandler(req: Request, res: Response): Promise<void> {
    let { name, email, password }: ISignupBody = req.body;

    const response: IResponse = {
        msg: ""
    };

    try {
        /* to lowercase */
        email = email.toLowerCase();

        const existingUser = await prisma.user.findUnique({
            where: {
                email: email,
            }
        });

        if (existingUser) {
            response.msg = "User Already Exist";
            res.status(409).json(response);
            return;
        }

        /* Hashing Password */
        const hash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name: name,
                email: email,
                password: hash,
            }
        });

        const token = encode(user as unknown as IUser);

        response.msg = "Signed in Successfully";
        response.token = token;
        res.status(201).json(response);
    } catch (error: unknown) {
        console.log(error);
        response.error = error as Error;
        response.msg = "Internal Server Error. Please Try Again!";
        res.status(500).json(response);
    }
}

async function loginHandler(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const response: IResponse = {
        msg: ""
    };

    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email,
            }
        });

        if (!user) {
            response.msg = "No User found with this email";
            res.status(404).json(response);
            return;
        }

        const storedHashedPass = user.password;
        const isPasswordCorrect = await bcrypt.compare(password, storedHashedPass);

        if (!isPasswordCorrect) {
            response.msg = "Wrong Password. Try Again!";
            res.status(400).json(response);
            return;
        }

        const accessToken = encode(user as unknown as IUser);
        const refreshToken= generateRefreshToken(user as unknown as IUser);

        // Send refresh token as secure cookie
        res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        response.msg = "Logged in Successfully";
        response.token = accessToken;
        res.status(200).json(response);

    } catch (error) {
        console.log(error);
        response.error = error as Error;
        response.msg = "Internal Server Error";
        res.status(500).json(response);
    }
}

async function refreshHandler(req: Request, res: Response): Promise<void> {
    const response: IResponse = {
        msg: ""
    };

    const token=req.cookies.refreshToken;
    if(!token){
        res.status(401).json({ msg:"User not found"});
        return;
    }

    try{
        const payload=jwt.verify(token,REFRESH_SECRET) as {id:string}

        const user=await prisma.user.findUnique({
            where:{id:payload.id}
        })
        if(!user){
            res.status(404).json({msg:"User not found"});
            return;
        }
        const newAccessToken=encode(user as unknown as IUser);
        response.msg = "Logged in Successfully";
        response.token = newAccessToken;
        res.status(200).json(response);
    }catch(error){
        console.log(error);
        response.error = error as Error;
        response.msg = "Internal refresh token";
        res.status(401).json(response);
    }

}

function logoutHandler(req:Request,res:Response):void{
    res.clearCookie("refreshToken",{
        httpOnly:true,
        secure: process.env.NODE_ENV==="production",
        sameSite: "strict"
    })
    res.status(200).json({msg:"Logged out successfully"});
}

async function forgotPasswordHandler(req:Request, res:Response) {
   const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (user) {
        const token = generateResetToken(email);
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await prisma.user.update({
            where: { email },
            data: {
            passwordResetToken: token,
            passwordResetExpires: expires,
            },
        });

        const resetLink = `http://localhost:3000/auth/reset-password?token=${token}`;
        console.log("Reset link:", resetLink);
        res.status(200).json({ msg: "Reset link sent", resetLink });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error", error });
    }

}

async function resetPasswordHandler(req:Request,res:Response){
    const {token,newPassword}=req.body;
    try{
        const {email}=verifyResetToken(token);
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(400).json({ msg: "User not found" });
        }
        if(user.passwordResetToken !==token || new Date()>user.passwordResetExpires ) return res.status(400).json({msg: "invalid or expired token"});

        const hashed=await bcrypt.hash(newPassword,10);

        await prisma.user.update({
            where:{email},
            data:{
                password: hashed,
                passwordResetToken: null,
                passwordResetExpires: null
            }
        });
        res.status(200).json({msg:"password reset successful"});
    }catch(error){
         console.log(error);
        return res.status(400).json({msg:"Invalid or expired token"});
    }
}

async function changePasswordHandler(req:Request,res:Response) {
    const userId=req.user?.id;
    const {oldPass,newPass}=req.body;

    try{
        const user=await prisma.user.findUnique({
            where: {id:userId}
        });
        if(!user || !user.password){
            return res.status(400).json({msg:"password change not allowed"});
        }

        const isValid=await bcrypt.compare(oldPass,user.password);
        if(!isValid){
            return res.status(403).json({msg:"old password is incorrect"});
        }
        const newHashed=await bcrypt.hash(newPass,10);
        await prisma.user.update({
            where:{id:userId},
            data:{password:newHashed}
        })
        return res.status(200).json({ msg: "Password updated successfully" });
    }catch(error){
        console.log(error);
        return res.status(500).json({msg:"Internal server error"});
    }
}

async function setPasswordHandler(req: Request, res: Response) {
  const userId = req.user?.id;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ msg: "Password must be at least 6 characters" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const isSocial = user.password === "google-oauth" || user.password === "github-oauth";

    if (!isSocial) {
      return res.status(409).json({ msg: "Password already exists. Use change-password instead." });
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    res.status(200).json({ msg: "Password set successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
}

export { signUpHandler, loginHandler, refreshHandler, logoutHandler,forgotPasswordHandler, resetPasswordHandler, changePasswordHandler, setPasswordHandler};