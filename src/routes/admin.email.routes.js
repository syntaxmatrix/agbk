import { Router } from "express";
import {
  getInboxAttachment,
  getInboxEmailById,
  getInboxEmails,
  sendAdminEmail,
} from "../controllers/admin.email.controller.js";
import { auth_middleware } from "../middlewares/auth.js";
import { adminOnly } from "../middlewares/adminOnly.js";

const router = Router();

// router.use(auth_middleware, adminOnly);

router.route("/send").post(sendAdminEmail);
router.route("/inbox").get(auth_middleware, adminOnly,getInboxEmails);
router.route("/:id").get(getInboxEmailById);
router.route("/:id/attachments/:attachmentId").get(getInboxAttachment);

export default router;
