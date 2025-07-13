import { prisma } from "@/lib/db";
import { IResponse } from "@/types";
import { Request, Response } from "express";

async function getOwnDetailsHandler(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    let response: IResponse = {
        msg: ""
    };

    if (!userId) {
        response.msg = "Unauthorized!";
        res.status(401).json(response);
        return;
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        response.msg = "Got The User";
        response.data = user;
        res.status(200).json(response);
        return;
    } catch (error) {
        response.msg = "Internal Server Error. Please try again!";
        response.error = error as Error;
        res.status(500).json(response);
    }
}

export { getOwnDetailsHandler };