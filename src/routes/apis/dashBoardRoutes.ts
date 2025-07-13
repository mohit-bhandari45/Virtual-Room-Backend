import { getDashBoardHandler } from "@/controllers/dashboard";
import { Router } from "express";

const router = Router();

router.get("/", getDashBoardHandler);

export default router;