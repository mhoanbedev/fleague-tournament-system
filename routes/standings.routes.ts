import { Router } from "express";
import * as controller from "../controllers/standings.controller";
import * as authMiddleware from "../middleware/auth.middleware";

const router: Router = Router();

router.get(
  "/league/:leagueId",
  authMiddleware.optionalAuth,
  controller.getLeagueStandings
);

router.get(
  "/league/:leagueId/group/:group",
  authMiddleware.optionalAuth,
  controller.getGroupStandings
);

router.get(
  "/league/:leagueId/all-groups",
  authMiddleware.optionalAuth,
  controller.getAllGroupsStandings
);

router.get(
  "/league/:leagueId/stats",
  authMiddleware.optionalAuth,
  controller.getLeagueStats
);

router.get(
  "/team/:teamId",
  authMiddleware.optionalAuth,
  controller.getTeamStats
);

export const standingsRoutes: Router = router;