import { Router } from "express";
import roomRoutes from "./roomRoutes";
import userRoutes from "./userRoutes";
import dashBoardRoutes from "./dashBoardRoutes";
import { tokenCheckMiddlware } from "@/middleware/auth";

const router = Router();
router.use(tokenCheckMiddlware);

router.use("/rooms", roomRoutes);
router.use("/dashboard", dashBoardRoutes);
router.use("/user", userRoutes);

export default router;