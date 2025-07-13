import { getOwnDetailsHandler } from "@/controllers/userController";
import { Router } from "express";

const router = Router();

router.get("/me", getOwnDetailsHandler);

export default router;