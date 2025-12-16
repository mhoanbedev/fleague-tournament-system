import { Router } from "express";
import * as controller from "../controllers/league.controller"
import * as authMiddleware from "../middleware/auth.middleware"
import * as leagueAuth from "../middleware/league.auth.middleware"
import * as validate from "../middleware/league.validate.middleware"
import { upload } from "../middleware/multer.middleware";
import { uploadSingle } from "../helpers/uploadCloud";
import { autoUpdateAllLeaguesStatus, autoUpdateLeagueStatus } from "../middleware/autoUpdateStatus.middleware";

const router: Router = Router();

router.post(
    "/create",
    authMiddleware.authMiddleware,
    upload.single("logo"),
    uploadSingle,
    validate.validateCreateLeague,
    controller.createLeague

)
router.get(
    "/my-leagues",
    authMiddleware.authMiddleware,
    autoUpdateAllLeaguesStatus,
    controller.getMyLeagues
)

router.get(
    "/public", 
    autoUpdateAllLeaguesStatus,
    controller.getPublicLeagues
)

router.get(
    "/:id",
    authMiddleware.optionalAuth,
    leagueAuth.canAccessLeague,
    autoUpdateLeagueStatus,
    controller.getLeagueDetail
)


router.patch(
    "/:id",
    authMiddleware.authMiddleware,
    leagueAuth.isLeagueOwner,
    upload.single("logo"),
    uploadSingle,
    validate.validateUpdateLeague,
    controller.updateLeague
)

router.delete(
    "/:id",
    authMiddleware.authMiddleware,
    leagueAuth.isLeagueOwner,
    controller.deleteLeague
)

router.patch(
    "/:id/status",
    authMiddleware.authMiddleware,
    leagueAuth.isLeagueOwner,
    controller.updateLeagueStatus
)

router.post(
    "/:id/generate-token",
    authMiddleware.authMiddleware,
    leagueAuth.isLeagueOwner,
    controller.generateLeagueToken
)

router.patch(
    "/:id/visibility",
    authMiddleware.authMiddleware,
    leagueAuth.isLeagueOwner,
    controller.changeVisibility
)

export const leagueRoutes: Router = router;