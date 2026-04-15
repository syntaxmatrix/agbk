import { Router } from "express";
import { getRecentConversations, getChatById } from "../controllers/history.controller.js";
import { auth_middleware } from "../middlewares/auth.js";

const router = Router();

router.route("/").get(auth_middleware, getRecentConversations);
router.route("/:id").get(auth_middleware, getChatById);

export default router;
