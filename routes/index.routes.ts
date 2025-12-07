import { Express } from "express";
import { authRoutes } from "./auth.routes";
import { userRoutes } from "./user.routes";
import { leagueRoutes } from "./league.routes";
import { teamRoutes } from "./team.routes"
import { matchRoutes } from "./match.routes";
import { standingsRoutes } from "./standings.routes";
const mainV1Routes = (app: Express): void => {
  app.use("/api/v1/user", authRoutes);
  app.use("/api/v1/user", userRoutes);
  app.use("/api/v1/league", leagueRoutes);
  app.use("/api/v1/team", teamRoutes);
  app.use("/api/v1/match", matchRoutes);
  app.use("/api/v1/standings", standingsRoutes)
};

export default mainV1Routes;