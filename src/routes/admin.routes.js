import { Router } from "express";
import {
  deleteUser,
  forceLogout,
  getAdminStats,
  getSingleUser,
  listUsers,
  patchUserSubscription,
} from "../controllers/admin.controller.js";
import { auth_middleware } from "../middlewares/auth.js";
import { adminOnly } from "../middlewares/adminOnly.js";

const router = Router();

router.use(auth_middleware, adminOnly);

router.route("/stats").get(getAdminStats);

router.route("/users").get(listUsers);
router.route("/users/:id").get(getSingleUser).delete(deleteUser);
router.route("/users/:id/subscription").patch(patchUserSubscription);
router.route("/users/:id/logout").post(forceLogout);

export default router;
