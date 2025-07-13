import { prisma } from "@/lib/db";
import { IResponse } from "@/types";
import { fetchFocusTime, IStreak } from "@/utils/dashboardUtils";
import { Request, Response } from "express";

async function getDashBoardHandler(req: Request, res: Response): Promise<void> {
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

        if (!user) {
            response.msg = "User Not found";
            res.status(404).json(response);
            return;
        }

        const rooms = await prisma.room.findMany({
            where: {
                createdById: user.id
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const activity = await prisma.userStreak.findUnique({
            where: {
                userId: user.id
            },
        });

        if(!activity){
            return;
        }

        /* Fetching all data */
        const focusTime = await fetchFocusTime(user.id);
        const streakData: IStreak = {
            currentStreak: activity.currentStreak,
            maxStreak: activity.maxStreak,
            isActiveToday: activity.isActiveToday
        };
        const totalRooms: number = rooms.length;
        /* Data fetching */

        const dashBoardData = {
            ...user,
            focusTime: focusTime,
            streakData: streakData,
            totalRooms: totalRooms,
        };

        response.msg = "Got The User";
        response.data = dashBoardData;
        res.status(200).json(response);
        return;
    } catch (error) {
        response.msg = "Internal Server Error. Please try again!";
        response.error = error as Error;
        res.status(500).json(response);
    }
}

export { getDashBoardHandler };
