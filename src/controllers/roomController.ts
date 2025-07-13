import { prisma } from "@/lib/db";
import { IResponse } from "@/types";
import { updateUserStreakFromRooms } from "@/utils/dashboardUtils";
import { Request, Response } from "express";

async function createRoomHandler(req: Request, res: Response): Promise<any> {
    const userId = req.user?.id;
    const { name, description, duration, isPublic } = req.body;

    let response: IResponse = {
        msg: ""
    };

    if (!userId) {
        response.msg = "Unauthorized!";
        return res.status(401).json(response);
    }

    if (!name || !description) {
        response.msg = "Room name and description are required.";
        return res.status(400).json(response);
    }

    try {
        const room = await prisma.room.create({
            data: {
                name,
                description,
                createdById: userId,
                active: true,
                isPublic: isPublic === "public",
                duration: duration,
                roomParticipants: {
                    create: {
                        userId: userId,
                        role: "owner"
                    }
                },
                roomSessions: {
                    create: {
                        userId: userId,
                        joinedAt: new Date(),
                    }
                }
            },
            include: {
                roomParticipants: true,
            }
        });

        await updateUserStreakFromRooms(room.createdById);

        response.msg = "Room Created Successfully";
        response.data = room.id;
        return res.status(201).json(response);
    } catch (error) {
        console.log(error);
        response.msg = "Internal Server Error. Please try again!";
        response.error = error as Error;
        return res.status(500).json(response);
    }
}

async function joinRoomHandler(req: Request, res: Response): Promise<any> {
    const userId = req.user?.id;
    const { roomId } = req.body;
    let response: IResponse = {
        msg: ""
    };

    if (!roomId) {
        response.msg = "Room ID is required.";
        return res.status(400).json(response);
    }

    try {
        const room = await prisma.room.findUnique({
            where: { id: roomId }
        });

        if (!room) {
            response.msg = "Room not found.";
            return res.status(404).json(response);
        }

        let participant = await prisma.roomParticipant.findUnique({
            where: {
                roomId_userId: {
                    roomId: roomId,
                    userId: userId,
                }
            }
        });

        if (!participant) {
            participant = await prisma.roomParticipant.create({
                data: {
                    roomId, userId, role: "member",
                }
            });
        }

        await prisma.roomSession.create({
            data: {
                roomId,
                userId,
                joinedAt: new Date()
            }
        });

        response.msg = "Joined room successfully.";
        return res.status(200).json(response);
    } catch (error) {
        response.msg = "Internal Server Error. Please try again!";
        response.error = error as Error;
        return res.status(500).json(response);
    }
}

async function leaveRoomHandler(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const { roomId } = req.body;

    let response: IResponse = {
        msg: ""
    };

    if (!userId) {
        response.msg = "Unauthorized!";
        res.status(401).json(response);
        return;
    }

    if (!roomId) {
        response.msg = "Room ID is required.";
        res.status(400).json(response);
        return;
    }

    try {
        const session = await prisma.roomSession.findFirst({
            where: {
                userId: userId,
                roomId: roomId,
                leftAt: null,
            },
        });

        if (!session) {
            response.msg = "No active session found.";
            res.status(404).json(response);
            return;
        }

        const now = new Date();
        const joinedAt = new Date(session.joinedAt);
        const duration = Math.floor((now.getTime() - joinedAt.getTime()) / 60000);

        await prisma.roomSession.update({
            where: { id: session.id },
            data: {
                leftAt: now,
                duration
            }
        });

        response.msg = "Successfully left the room.";
        res.status(200).json(response);
        return;
    } catch (error) {
        response.msg = "Internal Server Error. Please try again!";
        response.error = error as Error;
        res.status(500).json(response);
        return;
    }
}

async function getAllRoomsHandler(req: Request, res: Response): Promise<any> {
    const userId = req.user?.id;
    let response: IResponse = {
        msg: ""
    };

    if (!userId) {
        response.msg = "Unauthorized!";
        return res.status(401).json(response);

    }

    try {
        const rooms = await prisma.room.findMany({
            where: {
                createdById: userId,
            },
        });

        const allRooms = rooms ?? [];
        response.msg = "Got All rooms";
        response.data = allRooms;
        return res.status(200).json(response);

    } catch (error) {
        response.msg = "Internal Server Error. Please try again!";
        response.error = error as Error;
        return res.status(500).json(response);
    }
}

export { createRoomHandler, getAllRoomsHandler, joinRoomHandler, leaveRoomHandler };