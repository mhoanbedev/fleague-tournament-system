import { RequestHandler } from "express";

export const validateUpdateResult: RequestHandler = (req, res, next) => {
  const { homeScore, awayScore } = req.body;
  const errors: string[] = [];

  if (homeScore === undefined || homeScore === null) {
    errors.push("Bàn thắng đội nhà là bắt buộc");
  }
  if (homeScore !== undefined && (homeScore < 0 || !Number.isInteger(homeScore))) {
    errors.push("Bàn thắng đội nhà phải là số nguyên không âm");
  }
 
  if (awayScore === undefined || awayScore === null) {
    errors.push("Bàn thắng đội khách là bắt buộc");
  }
  if (awayScore !== undefined && (awayScore < 0 || !Number.isInteger(awayScore))) {
    errors.push("Bàn thắng đội khách phải là số nguyên không âm");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: "Dữ liệu không hợp lệ!",
      errors: errors,
    });
  }

  next();
};

export const validateUpdateMatchInfo: RequestHandler = (req, res, next) => {
  const { scheduledDate, venue, referee, notes } = req.body;
  const errors: string[] = [];

  if (scheduledDate) {
    const date = new Date(scheduledDate);
 
    if (isNaN(date.getTime())) {
      errors.push("Ngày thi đấu không hợp lệ");
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0); 
 
      if (date < today) {
        errors.push("Ngày thi đấu không được nhỏ hơn ngày hiện tại");
      }
 
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 2);

      if (date > maxDate) {
        errors.push("Ngày thi đấu không được vượt quá 2 năm so với hiện tại");
      }
    }
  }
 
  if (venue && venue.length > 200) {
    errors.push("Tên sân tối đa 200 ký tự");
  }
 
  if (referee && referee.length > 100) {
    errors.push("Tên trọng tài tối đa 100 ký tự");
  }
 
  if (notes && notes.length > 500) {
    errors.push("Ghi chú tối đa 500 ký tự");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: "Dữ liệu không hợp lệ!",
      errors: errors,
    });
  }

  next();
};

export const validateVideoUrl: RequestHandler = (req, res, next) => {
  const { videoUrl } = req.body;
  const errors: string[] = [];

  if (videoUrl) {
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(videoUrl)) {
      errors.push("Video URL không hợp lệ");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: "Dữ liệu không hợp lệ!",
      errors: errors,
    });
  }

  next();
};