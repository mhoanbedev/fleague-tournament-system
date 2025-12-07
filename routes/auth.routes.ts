import { Router } from "express";
import * as controller from "../controllers/auth.controller";
import * as validate from "../middleware/validate.middleware";
import { authLimit } from "../helpers/rateLimit";

const router: Router = Router();

router.post("/register", validate.validateRegister, controller.register);
router.post("/login", authLimit, validate.validateLogin, controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);

export const authRoutes: Router = router;