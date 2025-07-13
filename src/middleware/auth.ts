import { decode } from "@/utils/jwt";
import { NextFunction, Request, Response } from "express";

async function tokenCheckMiddlware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ msg: "Authorization token missing or malformed" });
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = decode(token);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ msg: "Invalid or expired token", error });
        return;
    }
}

export { tokenCheckMiddlware };