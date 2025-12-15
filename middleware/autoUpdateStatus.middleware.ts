import { RequestHandler } from "express";
import League from "../models/league.model";
import Match from "../models/match.model";
import Team from "../models/team.model";
import { determineLeagueStatus } from "../helpers/leagueStatus";

export const autoUpdateLeagueStatus: RequestHandler = async (req, res, next) => {
  try {
    let leagueId: string | null = null;

    leagueId = req.params.leagueId || req.params.id || null;
    if (!leagueId && req.body.leagueId) {
      leagueId = req.body.leagueId;
    }

    if (!leagueId && req.params.id) {
      const match = await Match.findById(req.params.id);
      if (match) {
        leagueId = match.league.toString();
      }
    }

    if (!leagueId && req.params.id) {
      const team = await Team.findById(req.params.id);
      if (team) {
        leagueId = team.league.toString();
      }
    }

    if (!leagueId) {
      return next();
    }

    const league = await League.findById(leagueId);

    if (league && (league.startDate || league.endDate)) {
      const currentStatus = league.tournamentStatus;
      const newStatus = determineLeagueStatus(league.startDate, league.endDate);


      if (currentStatus !== newStatus) {
        league.tournamentStatus = newStatus;
        await league.save();
        console.log(
          `Tự động cập nhật trạng thái giải đấu ${leagueId}: ${currentStatus} → ${newStatus}`
        );
      }
    }

    next();
  } catch (error) {
    console.error("Lỗi khi tự động cập nhật trạng thái giải đấu:", error);
    next();
  }
};
export const autoUpdateAllLeaguesStatus: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const leagues = await League.find({
      $or: [{ startDate: { $ne: null } }, { endDate: { $ne: null } }],
    });

    for (const league of leagues) {
      const newStatus = determineLeagueStatus(
        league.startDate,
        league.endDate
      );

      if (league.tournamentStatus !== newStatus) {
        league.tournamentStatus = newStatus;
        await league.save();
      }
    }

    next(); 
  } catch (error) {
    console.error("Lỗi auto update leagues:", error);
    next();
  }
};
