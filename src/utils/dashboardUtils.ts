import { prisma } from "@/lib/db";
import { IRoom } from "@/types";
import { isSameDay, subDays } from "date-fns";

async function fetchFocusTime(userId: string): Promise<number> {
    const to = new Date();
    const from = subDays(to, 7);

    const sessions = await prisma.roomSession.findMany({
        where: {
            userId: userId,
            joinedAt: {
                gte: from,
                lte: to
            }
        },
        select: {
            duration: true
        }
    });

    const totalMinutes = sessions.reduce((sum: number, session: { duration: number; }) => sum + (session.duration ?? 0), 0);
    const totalHours = Math.floor(totalMinutes / 60);
    return totalHours;
}

export interface IStreak {
    maxStreak: number,
    currentStreak: number,
    isActiveToday: boolean;
}

export async function updateUserStreakFromRooms(userId: string): Promise<void> {
  const rooms = await prisma.room.findMany({
    where:{
      createdById: userId,
    }
  });

  if (rooms.length === 0) {
    await prisma.userStreak.upsert({
      where: { userId },
      update: {
        currentStreak: 0,
        maxStreak: 0,
        isActiveToday: false,
      },
      create: {
        userId,
        currentStreak: 0,
        maxStreak: 0,
        isActiveToday: false,
      },
    });
    return;
  }

  const uniqueDateStrings = Array.from(
    new Set(
      rooms.map((room: IRoom) =>
        new Date(room.createdAt).toISOString().split("T")[0]
      )
    )
  ).sort();

  const toDate = (str: string) => {
    const d = new Date(str);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < uniqueDateStrings.length; i++) {
    const prev = toDate(uniqueDateStrings[i - 1] as string);
    const curr = toDate(uniqueDateStrings[i] as string);

    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  const today = toDate(new Date().toISOString().split("T")[0]);
  const lastDate = toDate(uniqueDateStrings[uniqueDateStrings.length - 1] as string);
  const diffFromToday = (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

  const isActiveToday = diffFromToday === 0;
  const finalCurrentStreak = isActiveToday ? currentStreak : 0;

  await prisma.userStreak.upsert({
    where: { userId },
    update: {
      currentStreak: finalCurrentStreak,
      maxStreak: maxStreak,
      isActiveToday: isActiveToday,
    },
    create: {
      userId,
      currentStreak: finalCurrentStreak,
      maxStreak: maxStreak,
      isActiveToday: isActiveToday,
    },
  });
}


export { fetchFocusTime };
