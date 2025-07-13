
import { Request, Response } from "express";
import { prisma } from "@/lib/db";
import { encode } from "@/utils/jwt";
import bcrypt from "bcrypt";
import { IResponse, IUser } from "@/types";

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

        const token = encode(user as unknown as IUser);

        response.msg = "Logged in Successfully";
        response.token = token;
        res.status(200).json(response);
    } catch (error) {
        console.log(error);
        response.error = error as Error;
        response.msg = "Internal Server Error";
        res.status(500).json(response);
    }
}

export { signUpHandler, loginHandler };