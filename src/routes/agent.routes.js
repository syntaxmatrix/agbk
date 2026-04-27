import { Router } from "express";
import { intentCheck } from "../controllers/agent.controller.js";
import { auth_middleware } from "../middlewares/auth.js";
import { subscription } from "../middlewares/subscription.js";

const router = Router();

router.route("/chats").get(auth_middleware,subscription,intentCheck); // GET :: example.com/api/v1/agent/chats?q=abc

export default router;
