import { RequestHandler } from "express";
import Team from "../models/team.model";
import League from "../models/league.model";
import Match from "../models/match.model";
import {
  formatStandings,
  getTopScorers,
  getBestDefense,
  getBestForm,
} from "../helpers/sortStandings";

const checkLeagueAccess = async (
  leagueId: string,
  userId?: string,
  accessToken?: string
) => {
  const league = await League.findById(leagueId);
  
  if (!league) {
    return { hasAccess: false, league: null, error: "Giải đấu không tồn tại!" };
  }

  if (league.visibility === "public") {
    return { hasAccess: true, league, error: null };
  }

  if (league.visibility === "private") {
    const isOwner = userId && league.owner.toString() === userId.toString();
    const hasValidToken = accessToken === league.accessToken;

    if (isOwner || hasValidToken) {
      return { hasAccess: true, league, error: null };
    }

    return {
      hasAccess: false,
      league: null,
      error: "Giải đấu này ở chế độ riêng tư. Bạn cần có mã truy cập!",
    };
  }

  return { hasAccess: true, league, error: null };
};

// [GET] /standings/league/:leagueId
export const getLeagueStandings: RequestHandler = async (req, res) => {
  try {
    const { leagueId } = req.params;
    const userId = req.userId;
    const accessToken = req.query.token as string;
    const { hasAccess, league, error } = await checkLeagueAccess(
      leagueId,
      userId,
      accessToken
    );

    if (!hasAccess) {
      return res.status(403).json({
        message: error,
      });
    }

    const teams = await Team.find({ league: leagueId });

    if (teams.length === 0) {
      return res.status(200).json({
        message: "Bảng xếp hạng",
        league: {
          _id: league!._id,
          name: league!.name,
          type: league!.type,
        },
        standings: [],
      });
    }

    const standings = formatStandings(teams);

    res.status(200).json({
      message: "Bảng xếp hạng",
      league: {
        _id: league!._id,
        name: league!.name,
        type: league!.type,
      },
      standings: standings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [GET] /standings/league/:leagueId/group/:group
export const getGroupStandings: RequestHandler = async (req, res) => {
  try {
    const { leagueId, group } = req.params;
    const userId = req.userId;
    const accessToken = req.query.token as string;

    const { hasAccess, league, error } = await checkLeagueAccess(
      leagueId,
      userId,
      accessToken
    );

    if (!hasAccess) {
      return res.status(403).json({
        message: error,
      });
    }

    if (league!.type !== "group-stage") {
      return res.status(400).json({
        message: "Chỉ áp dụng cho giải đấu chia bảng!",
      });
    }

    const teams = await Team.find({
      league: leagueId,
      group: group.toUpperCase(),
    });

    if (teams.length === 0) {
      return res.status(200).json({
        message: `Bảng xếp hạng bảng ${group.toUpperCase()}`,
        league: {
          _id: league!._id,
          name: league!.name,
          type: league!.type,
        },
        group: group.toUpperCase(),
        standings: [],
      });
    }

    const standings = formatStandings(teams);

    res.status(200).json({
      message: `Bảng xếp hạng bảng ${group.toUpperCase()}`,
      league: {
        _id: league!._id,
        name: league!.name,
        type: league!.type,
      },
      group: group.toUpperCase(),
      standings: standings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [GET] /standings/league/:leagueId/all-groups
export const getAllGroupsStandings: RequestHandler = async (req, res) => {
  try {
    const { leagueId } = req.params;
    const userId = req.userId;
    const accessToken = req.query.token as string;

    const { hasAccess, league, error } = await checkLeagueAccess(
      leagueId,
      userId,
      accessToken
    );

    if (!hasAccess) {
      return res.status(403).json({
        message: error,
      });
    }

    if (league!.type !== "group-stage") {
      return res.status(400).json({
        message: "Chỉ áp dụng cho giải đấu chia bảng!",
      });
    }

    const teams = await Team.find({ league: leagueId });

    if (teams.length === 0) {
      return res.status(200).json({
        message: "Bảng xếp hạng tất cả các bảng",
        league: {
          _id: league!._id,
          name: league!.name,
          type: league!.type,
        },
        groups: {},
      });
    }

    const groupedTeams: { [key: string]: any[] } = {};

    teams.forEach((team) => {
      if (team.group) {
        if (!groupedTeams[team.group]) {
          groupedTeams[team.group] = [];
        }
        groupedTeams[team.group].push(team);
      }
    });

    const groupsStandings: { [key: string]: any[] } = {};

    for (const groupName in groupedTeams) {
      groupsStandings[groupName] = formatStandings(groupedTeams[groupName]);
    }

    res.status(200).json({
      message: "Bảng xếp hạng tất cả các bảng",
      league: {
        _id: league!._id,
        name: league!.name,
        type: league!.type,
      },
      groups: groupsStandings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [GET] /standings/league/:leagueId/stats
export const getLeagueStats: RequestHandler = async (req, res) => {
  try {
    const { leagueId } = req.params;
    const userId = req.userId;
    const accessToken = req.query.token as string;

    const { hasAccess, league, error } = await checkLeagueAccess(
      leagueId,
      userId,
      accessToken
    );

    if (!hasAccess) {
      return res.status(403).json({
        message: error,
      });
    }

    const teams = await Team.find({ league: leagueId });
    const matches = await Match.find({ league: leagueId, status: "finished" });

    if (teams.length === 0) {
      return res.status(200).json({
        message: "Thống kê giải đấu",
        stats: {
          totalTeams: 0,
          totalMatches: 0,
          matchesPlayed: 0,
          matchesRemaining: 0,
          totalGoals: 0,
          averageGoalsPerMatch: 0,
        },
        topScorers: [],
        bestDefense: [],
        bestForm: [],
      });
    }

    const totalMatches = await Match.countDocuments({ league: leagueId });
    const matchesPlayed = matches.length;
    const matchesRemaining = totalMatches - matchesPlayed;

    const totalGoals = teams.reduce(
      (sum, team) => sum + team.stats.goalsFor,
      0
    );
    const averageGoalsPerMatch =
      matchesPlayed > 0 ? (totalGoals / matchesPlayed).toFixed(2) : 0;

    const topScorers = getTopScorers(teams, 5);
    const bestDefense = getBestDefense(teams, 5);
    const bestForm = getBestForm(teams, 5);

    res.status(200).json({
      message: "Thống kê giải đấu",
      league: {
        _id: league!._id,
        name: league!.name,
        type: league!.type,
      },
      stats: {
        totalTeams: teams.length,
        totalMatches: totalMatches,
        matchesPlayed: matchesPlayed,
        matchesRemaining: matchesRemaining,
        totalGoals: totalGoals,
        averageGoalsPerMatch: parseFloat(averageGoalsPerMatch as string),
      },
      topScorers: topScorers,
      bestDefense: bestDefense,
      bestForm: bestForm,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [GET] /standings/team/:teamId
export const getTeamStats: RequestHandler = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.userId;
    const accessToken = req.query.token as string;

    const team = await Team.findById(teamId).populate("league");
    if (!team) {
      return res.status(404).json({
        message: "Đội không tồn tại!",
      });
    }

    const league = team.league as any;

    const { hasAccess, error } = await checkLeagueAccess(
      league._id.toString(),
      userId,
      accessToken
    );

    if (!hasAccess) {
      return res.status(403).json({
        message: error,
      });
    }

    const matches = await Match.find({
      $or: [{ homeTeam: teamId }, { awayTeam: teamId }],
      status: "finished",
    })
      .populate("homeTeam", "name shortName logo")
      .populate("awayTeam", "name shortName logo")
      .sort({ playedDate: -1 })
      .limit(10);

    const homeMatches = await Match.countDocuments({
      homeTeam: teamId,
      status: "finished",
    });
    const awayMatches = await Match.countDocuments({
      awayTeam: teamId,
      status: "finished",
    });

    const homeWins = await Match.countDocuments({
      homeTeam: teamId,
      status: "finished",
      $expr: { $gt: ["$score.home", "$score.away"] },
    });

    const awayWins = await Match.countDocuments({
      awayTeam: teamId,
      status: "finished",
      $expr: { $gt: ["$score.away", "$score.home"] },
    });

    res.status(200).json({
      message: "Thống kê chi tiết đội",
      team: {
        _id: team._id,
        name: team.name,
        shortName: team.shortName,
        logo: team.logo,
        group: team.group,
      },
      league: {
        _id: league._id,
        name: league.name,
        type: league.type,
      },
      stats: team.stats,
      form: team.form,
      detailedStats: {
        homeMatches: homeMatches,
        awayMatches: awayMatches,
        homeWins: homeWins,
        awayWins: awayWins,
        homeWinRate:
          homeMatches > 0 ? ((homeWins / homeMatches) * 100).toFixed(1) : 0,
        awayWinRate:
          awayMatches > 0 ? ((awayWins / awayMatches) * 100).toFixed(1) : 0,
      },
      recentMatches: matches,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};