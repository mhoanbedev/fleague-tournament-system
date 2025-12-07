import { RequestHandler } from "express";

export const validateCreateLeague: RequestHandler = (req, res, next) => {
  const { name, type, numberOfTeams, groupSettings, startDate, endDate } =
    req.body;
  const errors: string[] = [];
 
  if (!name || name.trim().length < 3) {
    errors.push("Tên giải đấu tối thiểu 3 ký tự");
  }
  if (name && name.trim().length > 100) {
    errors.push("Tên giải đấu tối đa 100 ký tự");
  }
 
  if (!type) {
    errors.push("Thể thức thi đấu là bắt buộc");
  }
  if (type && !["group-stage", "round-robin"].includes(type)) {
    errors.push("Thể thức thi đấu không hợp lệ (group-stage hoặc round-robin)");
  }

 
  if (!numberOfTeams) {
    errors.push("Số đội tham gia là bắt buộc");
  }
  if (numberOfTeams && (numberOfTeams < 2 || numberOfTeams > 32)) {
    errors.push("Số đội tham gia từ 2 đến 32");
  }

  
  if (type === "group-stage") {
    if (!groupSettings) {
      errors.push("Cần có thông tin phân bảng cho thể thức group-stage");
    } else {
      if (!groupSettings.numberOfGroups) {
        errors.push("Số bảng là bắt buộc");
      }
      if (
        groupSettings.numberOfGroups &&
        (groupSettings.numberOfGroups < 2 || groupSettings.numberOfGroups > 8)
      ) {
        errors.push("Số bảng từ 2 đến 8");
      }

      if (!groupSettings.teamsPerGroup) {
        errors.push("Số đội mỗi bảng là bắt buộc");
      }
      if (
        groupSettings.teamsPerGroup &&
        (groupSettings.teamsPerGroup < 3 || groupSettings.teamsPerGroup > 6)
      ) {
        errors.push("Số đội mỗi bảng từ 3 đến 6");
      }

       
      if (
        groupSettings.numberOfGroups &&
        groupSettings.teamsPerGroup &&
        numberOfTeams !==
          groupSettings.numberOfGroups * groupSettings.teamsPerGroup
      ) {
        errors.push(
          `Số đội (${numberOfTeams}) phải bằng số bảng (${groupSettings.numberOfGroups}) x số đội/bảng (${groupSettings.teamsPerGroup})`
        );
      }
    }
  }

 
  const now = new Date();
  now.setHours(0, 0, 0, 0);  

  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

 
    if (start < now) {
      errors.push("Ngày bắt đầu không được là ngày trong quá khứ");
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
 
    if (end < now) {
      errors.push("Ngày kết thúc không được là ngày trong quá khứ");
    }
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (end <= start) {
      errors.push("Ngày kết thúc phải sau ngày bắt đầu");
    }

    const diffTime = end.getTime() - start.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays < 1) {
      errors.push("Giải đấu phải kéo dài ít nhất 1 ngày");
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

export const validateUpdateLeague: RequestHandler = (req, res, next) => {
  const { name, description, startDate, endDate } = req.body;
  const errors: string[] = [];

  if (name) {
    if (name.trim().length < 3) {
      errors.push("Tên giải đấu tối thiểu 3 ký tự");
    }
    if (name.trim().length > 100) {
      errors.push("Tên giải đấu tối đa 100 ký tự");
    }
  }

  if (description && description.length > 500) {
    errors.push("Mô tả tối đa 500 ký tự");
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    if (start < now) {
      errors.push("Ngày bắt đầu không được là ngày trong quá khứ");
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (end < now) {
      errors.push("Ngày kết thúc không được là ngày trong quá khứ");
    }
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (end <= start) {
      errors.push("Ngày kết thúc phải sau ngày bắt đầu");
    }
  }

  if (startDate || endDate) {
    (req as any).hasDateUpdate = true;
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: "Dữ liệu không hợp lệ!",
      errors: errors,
    });
  }

  next();
};