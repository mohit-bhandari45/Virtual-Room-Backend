import { prisma } from "@/lib/db";
import cron from "node-cron";

const startRoomDeactivateCron = () => {
    cron.schedule("* * * * *", async () => {
        try {
            const now = new Date();
            const activeRooms = await prisma.room.findMany({
                where: {
                    active: true,
                }
            });

            for (const room of activeRooms) {
                const expiry = new Date(room.createdAt.getTime() + room.duration * 60 * 60 * 1000);

                if (now > expiry) {
                    await prisma.room.update({
                        where: { id: room.id },
                        data: { active: false }
                    });

                    console.log(`Room "${room.name}" (ID: ${room.id}) marked inactive`);
                }
            }

        } catch (error) {
            console.error("Error in room deactivation cron:", error);
        }
    });
};

export default startRoomDeactivateCron;