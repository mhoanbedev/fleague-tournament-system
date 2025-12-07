import { RequestHandler } from "express";
import Match from "../models/match.model";
import League from "../models/league.model";
import Team from "../models/team.model";
import {
  generateRoundRobinSchedule,
  generateGroupStageSchedule,
  validateScheduleGeneration,
} from "../helpers/scheduleGenerator";
import { processMatchResult } from "../helpers/updateStats";
import { resetTeamStats, resetAllTeamsStats } from "../helpers/resetStats";

// [POST] /match/generate-schedule/:leagueId
export const generateSchedule: RequestHandler = async (req, res) => {
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
        message: "Bạn không có quyền tạo lịch cho giải đấu này!",
      });
    }

    const existingMatches = await Match.countDocuments({ league: leagueId });
    if (existingMatches > 0) {
      return res.status(400).json({
        message: "Giải đấu đã có lịch thi đấu! Vui lòng xóa lịch cũ trước khi tạo mới.",
      });
    }

    const teams = await Team.find({ league: leagueId });

    const validationError = validateScheduleGeneration(
      league.type,
      teams,
      league.numberOfTeams
    );
    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    let schedule;
    if (league.type === "round-robin") {
      schedule = generateRoundRobinSchedule(teams);
    } else {
      schedule = generateGroupStageSchedule(
        teams,
        league.groupSettings!.numberOfGroups
      );
    }

    const matches = await Match.insertMany(
      schedule.map((s) => ({
        league: leagueId,
        homeTeam: s.homeTeam,
        awayTeam: s.awayTeam,
        round: s.round,
        matchNumber: s.matchNumber,
        group: s.group,
      }))
    );

    res.status(201).json({
      message: "Tạo lịch thi đấu thành công!",
      totalMatches: matches.length,
      totalRounds: Math.max(...schedule.map((s) => s.round)),
      matches: matches,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [GET] /match/league/:leagueId
export const getMatchesByLeague: RequestHandler = async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { round, group, status } = req.query;
    const userId = req.userId;
    const accessToken = req.query.token as string;
    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({
        message: "Giải đấu không tồn tại!",
      });
    }

    if (league.visibility === "private") {
      const isOwner = userId && league.owner.toString() === userId.toString();
      const hasValidToken = accessToken === league.accessToken;

      if (!isOwner && !hasValidToken) {
        return res.status(403).json({
          message: "Giải đấu này ở chế độ riêng tư. Bạn cần có mã truy cập!",
        });
      }
    }
    
    const query: any = { league: leagueId };
    if (round) query.round = parseInt(round as string);
    if (group) query.group = (group as string).toUpperCase();
    if (status) query.status = status;

    const matches = await Match.find(query)
      .populate("homeTeam", "name shortName logo")
      .populate("awayTeam", "name shortName logo")
      .populate("league", "name type")
      .sort({ round: 1, matchNumber: 1 });

    res.status(200).json({
      message: "Danh sách trận đấu",
      total: matches.length,
      matches: matches,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [GET] /match/:id
export const getMatchDetail: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const accessToken = req.query.token as string;
    const match = await Match.findById(id)
      .populate("homeTeam", "name shortName logo stats form")
      .populate("awayTeam", "name shortName logo stats form")
      .populate("league", "name type visibility");

    if (!match) {
      return res.status(404).json({
        message: "Trận đấu không tồn tại!",
      });
    }
    const league = match.league as any;

    if (league.visibility === "private") {
      const isOwner = userId && league.owner.toString() === userId.toString();
      const hasValidToken = accessToken === league.accessToken;

      if (!isOwner && !hasValidToken) {
        return res.status(403).json({
          message: "Giải đấu này ở chế độ riêng tư. Bạn cần có mã truy cập!",
        });
      }
    }
    res.status(200).json({
      message: "Chi tiết trận đấu",
      match: match,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [PATCH] /match/:id/result
export const updateMatchResult: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { homeScore, awayScore } = req.body;

    const match = await Match.findById(id).populate("league");
    if (!match) {
      return res.status(404).json({
        message: "Trận đấu không tồn tại!",
      });
    }

    const league = match.league as any;

    if (league.owner.toString() !== req.userId?.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền cập nhật kết quả trận đấu này!",
      });
    }

    if (match.status === "cancelled") {
      return res.status(400).json({
        message: "Không thể cập nhật kết quả trận đấu đã hủy!",
      });
    }

    await processMatchResult(match, homeScore, awayScore);

    const updatedMatch = await Match.findById(id)
      .populate("homeTeam", "name shortName logo stats")
      .populate("awayTeam", "name shortName logo stats");

    res.status(200).json({
      message: "Cập nhật kết quả thành công!",
      match: updatedMatch,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [PATCH] /match/:id/info
export const updateMatchInfo: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledDate, venue, referee, notes } = req.body;

    const match = await Match.findById(id).populate("league");
    if (!match) {
      return res.status(404).json({
        message: "Trận đấu không tồn tại!",
      });
    }

    const league = match.league as any;

    if (league.owner.toString() !== req.userId?.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền cập nhật thông tin trận đấu này!",
      });
    }

    if (scheduledDate !== undefined) match.scheduledDate = scheduledDate;
    if (venue !== undefined) match.venue = venue;
    if (referee !== undefined) match.referee = referee;
    if (notes !== undefined) match.notes = notes;

    await match.save();

    res.status(200).json({
      message: "Cập nhật thông tin trận đấu thành công!",
      match: match,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [PATCH] /match/:id/status
export const updateMatchStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (
      !status ||
      !["scheduled", "live", "finished", "postponed", "cancelled"].includes(
        status
      )
    ) {
      return res.status(400).json({
        message:
          "Trạng thái không hợp lệ (scheduled, live, finished, postponed, cancelled)",
      });
    }

    const match = await Match.findById(id).populate("league");
    if (!match) {
      return res.status(404).json({
        message: "Trận đấu không tồn tại!",
      });
    }

    const league = match.league as any;

    if (league.owner.toString() !== req.userId?.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền cập nhật trạng thái trận đấu này!",
      });
    }

    match.status = status;
    await match.save();

    res.status(200).json({
      message: "Cập nhật trạng thái trận đấu thành công!",
      match: match,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [PATCH] /match/:id/video
export const updateMatchVideo: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { videoUrl } = req.body;

    const match = await Match.findById(id).populate("league");
    if (!match) {
      return res.status(404).json({
        message: "Trận đấu không tồn tại!",
      });
    }

    const league = match.league as any;

    if (league.owner.toString() !== req.userId?.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền cập nhật video cho trận đấu này!",
      });
    }

    match.videoUrl = videoUrl || null;
    await match.save();

    res.status(200).json({
      message: videoUrl
        ? "Thêm video full match thành công!"
        : "Xóa video full match thành công!",
      match: match,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [POST] /match/:id/highlights
export const uploadHighlights: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { uploadedVideos, titles } = req.body;

    const match = await Match.findById(id).populate("league");
    if (!match) {
      return res.status(404).json({
        message: "Trận đấu không tồn tại!",
      });
    }

    const league = match.league as any;

    if (league.owner.toString() !== req.userId?.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền upload highlight cho trận đấu này!",
      });
    }

    const totalGoals = match.score.home + match.score.away;
    const currentHighlights = match.highlightVideos.length;
    const newVideosCount = uploadedVideos ? uploadedVideos.length : 0;

    if (currentHighlights + newVideosCount > totalGoals) {
      return res.status(400).json({
        message: `Số video highlight tối đa là ${totalGoals} (bằng tổng số bàn thắng). Hiện có ${currentHighlights} video.`,
      });
    }

    let titlesArray: string[] = [];
    if (titles) {
      if (Array.isArray(titles)) {
        titlesArray = titles;
      } else if (typeof titles === "string") {
        titlesArray = [titles];
      }
    }

    if (uploadedVideos && uploadedVideos.length > 0) {
      uploadedVideos.forEach((url: string, index: number) => {
        match.highlightVideos.push({
          url,
          title: titlesArray[index] || null,
          uploadedAt: new Date(),
        });
      });
    }

    await match.save();

    res.status(200).json({
      message: "Upload highlight thành công!",
      match: match,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};


// [DELETE] /match/:id/highlights/:highlightId
export const deleteHighlight: RequestHandler = async (req, res) => {
  try {
    const { id, highlightId } = req.params;

    const match = await Match.findById(id).populate("league");
    if (!match) {
      return res.status(404).json({
        message: "Trận đấu không tồn tại!",
      });
    }

    const league = match.league as any;

    if (league.owner.toString() !== req.userId?.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền xóa highlight này!",
      });
    }
    match.highlightVideos = match.highlightVideos.filter(
      (h: any) => h._id.toString() !== highlightId
    );

    await match.save();

    res.status(200).json({
      message: "Xóa highlight thành công!",
      match: match,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [PATCH] /match/:id/photos
export const updateMatchPhotos: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { photos } = req.body;

    const match = await Match.findById(id).populate("league");
    if (!match) {
      return res.status(404).json({
        message: "Trận đấu không tồn tại!",
      });
    }

    const league = match.league as any;

    if (league.owner.toString() !== req.userId?.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền cập nhật ảnh cho trận đấu này!",
      });
    }

    if (photos && photos.length > 10) {
      return res.status(400).json({
        message: "Tối đa 10 ảnh cho mỗi trận!",
      });
    }

    match.photos = photos || [];
    await match.save();

    res.status(200).json({
      message: "Cập nhật ảnh trận đấu thành công!",
      match: match,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [PATCH] /match/:id/reset
export const resetMatchResult: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const match = await Match.findById(id).populate("league");
    if (!match) {
      return res.status(404).json({
        message: "Trận đấu không tồn tại!",
      });
    }

    const league = match.league as any;

    if (league.owner.toString() !== req.userId?.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền reset kết quả trận đấu này!",
      });
    }

    if (match.status !== "finished") {
      return res.status(400).json({
        message: "Chỉ có thể reset kết quả trận đấu đã hoàn thành!",
      });
    }
    await resetTeamStats(match.homeTeam.toString());
    await resetTeamStats(match.awayTeam.toString());

    match.score.home = 0;
    match.score.away = 0;
    match.status = "scheduled";
    match.playedDate = null;
    match.videoUrl = null;
    match.highlightVideos = [];
    match.photos = [];

    await match.save();

    res.status(200).json({
      message: "Reset kết quả trận đấu thành công!",
      match: match,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [PATCH] /match/reset-all/:leagueId
export const resetAllResults: RequestHandler = async (req, res) => {
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
        message: "Bạn không có quyền reset kết quả giải đấu này!",
      });
    }

    await resetAllTeamsStats(leagueId);

    await Match.updateMany(
      { league: leagueId },
      {
        $set: {
          "score.home": 0,
          "score.away": 0,
          status: "scheduled",
          playedDate: null,
          videoUrl: null,
          highlightVideos: [],
          photos: [],
        },
      }
    );

    const totalMatches = await Match.countDocuments({ league: leagueId });

    res.status(200).json({
      message: "Reset toàn bộ kết quả giải đấu thành công!",
      totalMatchesReset: totalMatches,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [DELETE] /match/:id
export const deleteMatch: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const match = await Match.findById(id).populate("league");
    if (!match) {
      return res.status(404).json({
        message: "Trận đấu không tồn tại!",
      });
    }

    const league = match.league as any;

    if (league.owner.toString() !== req.userId?.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền xóa trận đấu này!",
      });
    }

    if (match.status === "finished") {
      return res.status(400).json({
        message:
          "Không thể xóa trận đấu đã có kết quả! Vui lòng reset kết quả trước.",
      });
    }

    await Match.deleteOne({ _id: id });

    res.status(200).json({
      message: "Xóa trận đấu thành công!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [DELETE] /match/delete-schedule/:leagueId
export const deleteSchedule: RequestHandler = async (req, res) => {
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
        message: "Bạn không có quyền xóa lịch thi đấu này!",
      });
    }

    const finishedMatches = await Match.countDocuments({
      league: leagueId,
      status: "finished",
    });

    if (finishedMatches > 0) {
      return res.status(400).json({
        message: `Không thể xóa lịch vì đã có ${finishedMatches} trận có kết quả! Vui lòng reset toàn bộ kết quả trước.`,
      });
    }

    const result = await Match.deleteMany({ league: leagueId });

    res.status(200).json({
      message: "Xóa lịch thi đấu thành công!",
      deletedMatches: result.deletedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error!",
    });
  }
};