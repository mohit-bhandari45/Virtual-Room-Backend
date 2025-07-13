import { createRoomHandler, getAllRoomsHandler, joinRoomHandler, leaveRoomHandler } from "@/controllers/roomController";
import { Router } from "express";

const router = Router();

router.post("/create", createRoomHandler);
router.post("/join", joinRoomHandler);
router.post("/leave", leaveRoomHandler);
router.get("/me", getAllRoomsHandler);

export default router;