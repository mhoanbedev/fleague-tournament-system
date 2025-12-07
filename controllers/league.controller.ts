import { RequestHandler } from "express";
import League from "../models/league.model";
import User from "../models/user.model";
import {generateToken} from "../helpers/generareToken"
import { determineLeagueStatus, canUpdateLeague } from "../helpers/leagueStatus";

// [POST] /league/create
export const createLeague: RequestHandler = async (req, res) => {
  try {
    const {
      name,
      description,
      logo,
      type,
      visibility,
      numberOfTeams,
      groupSettings,
      startDate,
      endDate,
    } = req.body;

    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Chưa đăng nhập!",
      });
    }

    const accessToken =
      visibility === "private" ? generateToken() : null;

    const tournamentStatus = determineLeagueStatus(startDate, endDate);

    const league = new League({
      name,
      description,
      logo,
      owner: userId,
      type,
      visibility: visibility || "public",
      accessToken,
      tournamentStatus,
      numberOfTeams,
      groupSettings: type === "group-stage" ? groupSettings : undefined,
      startDate,
      endDate,
    });

    await league.save();

    await User.updateOne(
      { _id: userId },
      { $push: { createdLeagues: league._id } }
    );

    res.status(201).json({
      message: "Tạo giải đấu thành công!",
      league: league,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [GET] /league/my-leagues
export const getMyLeagues: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Chưa đăng nhập!",
      });
    }

    const leagues = await League.find({ owner: userId })
      .populate("owner", "username email avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Danh sách giải đấu của bạn",
      total: leagues.length,
      leagues: leagues,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [GET] /league/public
export const getPublicLeagues: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const leagues = await League.find({ visibility: "public" })
      .populate("owner", "username email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await League.countDocuments({ visibility: "public" });

    res.status(200).json({
      message: "Danh sách giải đấu công khai",
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      leagues: leagues,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [GET] /league/:id
export const getLeagueDetail: RequestHandler = async (req, res) => {
  try {
    const league = (req as any).league;

    await league.populate("owner", "username email avatar");
    await league.populate("teams", "name shortName logo");

    res.status(200).json({
      message: "Chi tiết giải đấu",
      league: league,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [PATCH] /league/:id
export const updateLeague: RequestHandler = async (req, res) => {
  try {
    const league = (req as any).league; 
    const { name, description, logo, startDate, endDate } = req.body;

    if (!canUpdateLeague(league.tournamentStatus, startDate)) {
      return res.status(400).json({
        message: "Không thể cập nhật giải đấu đã kết thúc!",
      });
    }

   
    if (league.tournamentStatus === "ongoing" && startDate) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const newStart = new Date(startDate);
      newStart.setHours(0, 0, 0, 0);

      if (newStart < now) {
        return res.status(400).json({
          message:
            "Không thể đổi ngày bắt đầu về quá khứ khi giải đang diễn ra!",
        });
      }
    }

    if (name) league.name = name;
    if (description !== undefined) league.description = description;
    if (logo) league.logo = logo;
    if (startDate) league.startDate = startDate;
    if (endDate) league.endDate = endDate;
 
    if ((req as any).hasDateUpdate || startDate || endDate) {
      const newStatus = determineLeagueStatus(
        startDate || league.startDate,
        endDate || league.endDate
      );
      league.tournamentStatus = newStatus;
    }

    await league.save();

    res.status(200).json({
      message: "Cập nhật giải đấu thành công!",
      league: league,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [DELETE] /league/:id
export const deleteLeague: RequestHandler = async (req, res) => {
  try {
    const league = (req as any).league;
    const userId = req.userId;
    if (league.tournamentStatus === "ongoing") {
      return res.status(400).json({
        message: "Không thể xóa giải đấu đang diễn ra!",
      });
    }
    await User.updateOne(
      { _id: userId },
      { $pull: { createdLeagues: league._id } }
    );

    await League.deleteOne({ _id: league._id });

    res.status(200).json({
      message: "Xóa giải đấu thành công!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [PATCH] /league/:id/status
export const updateLeagueStatus: RequestHandler = async (req, res) => {
  try {
    const league = (req as any).league;
    const { status } = req.body;

    if (!status || !["upcoming", "ongoing", "completed"].includes(status)) {
      return res.status(400).json({
        message: "Trạng thái không hợp lệ (upcoming, ongoing, completed)",
      });
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (status === "ongoing" && league.startDate) {
      const start = new Date(league.startDate);
      start.setHours(0, 0, 0, 0);

      if (now < start) {
        return res.status(400).json({
          message: "Chưa đến ngày bắt đầu giải đấu!",
        });
      }
    }
    if (status === "completed" && league.endDate) {
      const end = new Date(league.endDate);
      end.setHours(0, 0, 0, 0);

      if (now <= end) {
        return res.status(400).json({
          message: "Giải đấu vẫn chưa kết thúc theo lịch!",
        });
      }
    }

    league.tournamentStatus = status;
    await league.save();

    res.status(200).json({
      message: "Cập nhật trạng thái giải đấu thành công!",
      league: league,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [POST] /league/:id/generate-token
export const generateLeagueToken: RequestHandler = async (req, res) => {
  try {
    const league = (req as any).league;

    if (league.visibility === "public") {
      return res.status(400).json({
        message: "Giải đấu công khai không cần mã truy cập!",
      });
    }
    const newToken = generateToken();
    league.accessToken = newToken;
    await league.save();

    res.status(200).json({
      message: "Tạo mã truy cập mới thành công!",
      accessToken: newToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [PATCH] /league/:id/visibility
export const changeVisibility: RequestHandler = async (req, res) => {
  try {
    const league = (req as any).league;
    const { visibility } = req.body;

    if (!visibility || !["public", "private"].includes(visibility)) {
      return res.status(400).json({
        message: "Visibility không hợp lệ (public hoặc private)",
      });
    }

    league.visibility = visibility;

    if (visibility === "private" && !league.accessToken) {
      league.accessToken = generateToken();
    }

    if (visibility === "public") {
      league.accessToken = null;
    }

    await league.save();

    res.status(200).json({
      message: `Đã chuyển giải đấu sang chế độ ${
        visibility === "public" ? "công khai" : "riêng tư"
      }!`,
      league: league,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};