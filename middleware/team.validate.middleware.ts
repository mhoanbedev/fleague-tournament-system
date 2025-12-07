import { RequestHandler } from "express";

export const validateCreateTeam: RequestHandler = (req, res, next) => {
  const { name, shortName, group } = req.body;
  const errors: string[] = [];


  if (!name || name.trim().length < 2) {
    errors.push("Tên đội tối thiểu 2 ký tự");
  }
  if (name && name.trim().length > 50) {
    errors.push("Tên đội tối đa 50 ký tự");
  }


  if (!shortName || shortName.trim().length < 2) {
    errors.push("Tên viết tắt tối thiểu 2 ký tự");
  }
  if (shortName && shortName.trim().length > 5) {
    errors.push("Tên viết tắt tối đa 5 ký tự");
  }
 
  if (group) {
    if (!/^[A-Za-z]$/.test(group)) {
      errors.push("Group phải là 1 chữ cái (A-Z)");
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

export const validateUpdateTeam: RequestHandler = (req, res, next) => {
  const { name, shortName, group } = req.body;
  const errors: string[] = [];

  if (name) {
    if (name.trim().length < 2) {
      errors.push("Tên đội tối thiểu 2 ký tự");
    }
    if (name.trim().length > 50) {
      errors.push("Tên đội tối đa 50 ký tự");
    }
  }

  if (shortName) {
    if (shortName.trim().length < 2) {
      errors.push("Tên viết tắt tối thiểu 2 ký tự");
    }
    if (shortName.trim().length > 5) {
      errors.push("Tên viết tắt tối đa 5 ký tự");
    }
  }

  if (group !== undefined) {
    if (group && !/^[A-Za-z]$/.test(group)) {
      errors.push("Group phải là 1 chữ cái (A-Z)");
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