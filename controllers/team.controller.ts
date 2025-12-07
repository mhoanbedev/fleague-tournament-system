import { RequestHandler } from "express";
import Team from "../models/team.model";
import League from "../models/league.model";
import {
  assignTeamsToGroups,
  canAssignGroups,
  resetAllGroups,
} from "../helpers/assignGroups";

// [POST] /team/create
export const createTeam: RequestHandler = async (req, res) => {
  try {
    const { name, shortName, logo, leagueId, group } = req.body;
    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({
        message: "Giải đấu không tồn tại!",
      });
    }

    if (league.owner.toString() !== req.userId?.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền thêm đội vào giải đấu này!",
      });
    }

    const currentTeamsCount = await Team.countDocuments({ league: leagueId });
    if (currentTeamsCount >= league.numberOfTeams) {
      return res.status(400).json({
        message: `Giải đấu đã đủ ${league.numberOfTeams} đội!`,
      });
    }

    if (league.type === "group-stage" && group) {
      if (!league.groupSettings) {
        return res.status(400).json({
          message: "Giải đấu chưa có cấu hình phân bảng!",
        });
      }

      const { numberOfGroups } = league.groupSettings;
      const validGroups = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        .split("")
        .slice(0, numberOfGroups);

      if (!validGroups.includes(group.toUpperCase())) {
        return res.status(400).json({
          message: `Group không hợp lệ. Chỉ chấp nhận: ${validGroups.join(
            ", "
          )}`,
        });
      }
    }

    const team = new Team({
      name,
      shortName: shortName.toUpperCase(),
      logo,
      league: leagueId,
      group: group ? group.toUpperCase() : null,
    });

    await team.save();

    await League.updateOne(
      { _id: leagueId },
      { $push: { teams: team._id } }
    );

    res.status(201).json({
      message: "Thêm đội thành công!",
      team: team,
    });
  } catch (error: any) {
    console.error(error);

    if (error.code === 11000) {
      if (error.keyPattern.name) {
        return res.status(400).json({
          message: "Tên đội đã tồn tại trong giải đấu này!",
        });
      }
      if (error.keyPattern.shortName) {
        return res.status(400).json({
          message: "Tên viết tắt đã tồn tại trong giải đấu này!",
        });
      }
    }

    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [GET] /team/league/:leagueId
export const getTeamsByLeague: RequestHandler = async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { group } = req.query;
    const query: any = { league: leagueId };
    if (group) {
      query.group = (group as string).toUpperCase();
    }

    const teams = await Team.find(query)
      .populate("league", "name type")
      .sort({ "stats.points": -1, "stats.goalDifference": -1, "stats.goalsFor": -1 });

    res.status(200).json({
      message: "Danh sách đội",
      total: teams.length,
      teams: teams,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [GET] /team/:id
export const getTeamDetail: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findById(id)
      .populate("league", "name type visibility");

    if (!team) {
      return res.status(404).json({
        message: "Đội không tồn tại!",
      });
    }

    res.status(200).json({
      message: "Chi tiết đội",
      team: team,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [PATCH] /team/:id
export const updateTeam: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, shortName, logo, group } = req.body;

    const team = await Team.findById(id).populate("league");
    if (!team) {
      return res.status(404).json({
        message: "Đội không tồn tại!",
      });
    }

    const league = team.league as any;

    if (league.owner.toString() !== req.userId?.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền cập nhật đội này!",
      });
    }

    if (name) team.name = name;
    if (shortName) team.shortName = shortName.toUpperCase();
    if (logo !== undefined) team.logo = logo;
    if (group !== undefined) {
      team.group = group ? group.toUpperCase() : null;
    }

    await team.save();

    res.status(200).json({
      message: "Cập nhật đội thành công!",
      team: team,
    });
  } catch (error: any) {
    console.error(error);

    if (error.code === 11000) {
      if (error.keyPattern.name) {
        return res.status(400).json({
          message: "Tên đội đã tồn tại trong giải đấu này!",
        });
      }
      if (error.keyPattern.shortName) {
        return res.status(400).json({
          message: "Tên viết tắt đã tồn tại trong giải đấu này!",
        });
      }
    }

    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [DELETE] /team/:id
export const deleteTeam: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findById(id).populate("league");
    if (!team) {
      return res.status(404).json({
        message: "Đội không tồn tại!",
      });
    }

    const league = team.league as any;

    if (league.owner.toString() !== req.userId?.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền xóa đội này!",
      });
    }

    await League.updateOne(
      { _id: league._id },
      { $pull: { teams: team._id } }
    );

    await Team.deleteOne({ _id: id });

    res.status(200).json({
      message: "Xóa đội thành công!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [POST] /team/assign-groups/:leagueId
export const assignGroups: RequestHandler = async (req, res) => {
  try {
    const { leagueId } = req.params;

    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({
        message: "Giải đấu không tồn tại!",
      });
    }

    if (league.owner.toString() !== req.userId?.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền phân bảng cho giải đấu này!",
      });
    }

    const teams = await Team.find({ league: leagueId });

    const validationError = canAssignGroups(league, teams);
    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }


    const { numberOfGroups } = league.groupSettings!;
    const groupedTeams = assignTeamsToGroups(teams, numberOfGroups);

    for (const groupName in groupedTeams) {
      const teamsInGroup = groupedTeams[groupName];
      for (const team of teamsInGroup) {
        team.group = groupName;
        await team.save();
      }
    }

    const updatedTeams = await Team.find({ league: leagueId }).sort({
      group: 1,
      name: 1,
    });

    res.status(200).json({
      message: "Phân bảng thành công!",
      groups: groupedTeams,
      teams: updatedTeams,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [POST] /team/reset-groups/:leagueId
export const resetGroups: RequestHandler = async (req, res) => {
  try {
    const { leagueId } = req.params;

    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({
        message: "Giải đấu không tồn tại!",
      });
    }

    if (league.owner.toString() !== req.userId?.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền reset bảng cho giải đấu này!",
      });
    }
    await resetAllGroups(leagueId);

    res.status(200).json({
      message: "Đã reset phân bảng thành công!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};