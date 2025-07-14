import { IUser } from "@/types";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const secret: string = process.env.JWT_SECRET as string;
const REFRESH_SECRET = process.env.REFRESH_SECRET as string;
const RESET_SECRET = process.env.RESET_SECRET as string;


function encode(user: IUser): string {
    const payload = {
        id: user.id,
        email: user.email
    };
    const token: string = jwt.sign(payload, secret, {expiresIn: "1h"});
    return token;
}

function decode(token: string): IUser {
    const user = jwt.verify(token, secret) as IUser;
    return user;
}

function generateRefreshToken(user: IUser) {
  return jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: "7d" });
}

function generateResetToken(email: string) {
    return jwt.sign({email},RESET_SECRET,{expiresIn:"10min"});
}

function verifyResetToken(token: string) {
    return jwt.verify(token, RESET_SECRET) as {email: string};
}

export { encode, decode, generateRefreshToken,generateResetToken, verifyResetToken };