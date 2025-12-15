import { Router } from "express";
import * as controller from "../controllers/standings.controller";
import * as authMiddleware from "../middleware/auth.middleware";
import { autoUpdateLeagueStatus } from "../middleware/autoUpdateStatus.middleware";

const router: Router = Router();

router.get(
  "/league/:leagueId",
  authMiddleware.optionalAuth,
  autoUpdateLeagueStatus,
  controller.getLeagueStandings
);

router.get(
  "/league/:leagueId/group/:group",
  authMiddleware.optionalAuth,
  autoUpdateLeagueStatus,
  controller.getGroupStandings
);

router.get(
  "/league/:leagueId/all-groups",
  authMiddleware.optionalAuth,
  autoUpdateLeagueStatus,
  controller.getAllGroupsStandings
);

router.get(
  "/league/:leagueId/stats",
  authMiddleware.optionalAuth,
  autoUpdateLeagueStatus,
  controller.getLeagueStats
);

router.get(
  "/team/:teamId",
  authMiddleware.optionalAuth,
  controller.getTeamStats
);

export const standingsRoutes: Router = router;