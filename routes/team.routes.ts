import { Router } from "express";
import * as controller from "../controllers/team.controller";
import * as authMiddleware from "../middleware/auth.middleware";
import * as validate from "../middleware/team.validate.middleware";
import { upload } from "../middleware/multer.middleware";
import { uploadSingle } from "../helpers/uploadCloud";
import { autoUpdateLeagueStatus } from "../middleware/autoUpdateStatus.middleware";

const router: Router = Router();


router.post(
  "/create",
  authMiddleware.authMiddleware,
  autoUpdateLeagueStatus,
  upload.single("logo"),
  uploadSingle,
  validate.validateCreateTeam,
  controller.createTeam
);

router.get("/league/:leagueId",authMiddleware.optionalAuth,autoUpdateLeagueStatus, controller.getTeamsByLeague);

router.get("/:id",authMiddleware.optionalAuth, controller.getTeamDetail);

router.patch(
  "/:id",
  authMiddleware.authMiddleware,
  upload.single("logo"),
  uploadSingle,
  validate.validateUpdateTeam,
  controller.updateTeam
);

router.delete("/:id", authMiddleware.authMiddleware, controller.deleteTeam);

router.post(
  "/assign-groups/:leagueId",
  authMiddleware.authMiddleware,
  autoUpdateLeagueStatus,
  controller.assignGroups
);


router.post(
  "/reset-groups/:leagueId",
  authMiddleware.authMiddleware,
  controller.resetGroups
);

export const teamRoutes: Router = router;