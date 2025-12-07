import { Router } from "express";
import * as controller from "../controllers/user.controller";
import * as authMiddleware from "../middleware/auth.middleware";
import { loadUser } from "../middleware/loadUser.middleware";
import { upload } from "../middleware/multer.middleware";
import { uploadSingle } from "../helpers/uploadCloud";
import * as validate from "../middleware/user.validate.middleware";
const router: Router = Router();

router.get(
  "/profile",
  authMiddleware.authMiddleware,
  loadUser,
  controller.profile
);
router.patch(
  "/update-profile",
  authMiddleware.authMiddleware,
  upload.single("avatar"),
  uploadSingle,
  validate.validateUpdateProfile,
  controller.updateProfile
);
router.patch(
  "/change-password",
  authMiddleware.authMiddleware,
  validate.validateChangePassword,
  controller.changePassword
);
router.delete(
  "/delete-account",
  authMiddleware.authMiddleware,
  controller.deleteAccount
);
export const userRoutes: Router = router;