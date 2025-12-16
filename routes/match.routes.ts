import { Router } from "express";
import * as controller from "../controllers/match.controller";
import * as authMiddleware from "../middleware/auth.middleware";
import * as validate from "../middleware/match.validate.middleware";
import { upload, uploadVideo } from "../middleware/multer.middleware";
import { uploadFields, uploadMultipleVideos } from "../helpers/uploadCloud";


const router: Router = Router();
 
router.post(
  "/generate-schedule/:leagueId",
  authMiddleware.authMiddleware,
  controller.generateSchedule
);
 
router.delete(
  "/delete-schedule/:leagueId",
  authMiddleware.authMiddleware,
  controller.deleteSchedule
);
 
router.patch(
  "/reset-all/:leagueId",
  authMiddleware.authMiddleware,
  controller.resetAllResults
);
 
router.get("/league/:leagueId",authMiddleware.optionalAuth, controller.getMatchesByLeague);
router.get("/:id",authMiddleware.optionalAuth, controller.getMatchDetail);
 
router.patch(
  "/:id/result",
  authMiddleware.authMiddleware,
  validate.validateUpdateResult,
  controller.updateMatchResult
);
 
router.patch(
  "/:id/info",
  authMiddleware.authMiddleware,
  validate.validateUpdateMatchInfo,
  controller.updateMatchInfo
);
 
router.patch(
  "/:id/status",
  authMiddleware.authMiddleware,
  controller.updateMatchStatus
);
 
router.patch(
  "/:id/video",
  authMiddleware.authMiddleware,
  validate.validateVideoUrl,
  controller.updateMatchVideo
);

router.post(
  "/:id/highlights",
  authMiddleware.authMiddleware,
  uploadVideo.array("highlights"),  
  uploadMultipleVideos,
  controller.uploadHighlights
);
 
router.delete(
  "/:id/highlights/:highlightId",
  authMiddleware.authMiddleware,
  controller.deleteHighlight
);

router.patch(
  "/:id/photos",
  authMiddleware.authMiddleware,
  upload.array("photos", 10),
  uploadFields,
  controller.updateMatchPhotos
);
 
router.patch(
  "/:id/reset",
  authMiddleware.authMiddleware,
  controller.resetMatchResult
);

router.delete("/:id", authMiddleware.authMiddleware, controller.deleteMatch);

export const matchRoutes: Router = router;