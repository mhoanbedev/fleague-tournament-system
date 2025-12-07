import { RequestHandler } from "express";

export const validateRegister: RequestHandler = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors: string[] = [];

  if (!username || username.trim().length < 3) {
    errors.push("Username tối thiểu 3 ký tự");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push("Email không hợp lệ");
  }

  if (!password || password.length < 8) {
    errors.push("Password tối thiểu 8 ký tự");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password phải có ít nhất 1 chữ thường");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password phải có ít nhất 1 chữ hoa");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password phải có ít nhất 1 số");
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push("Password phải có ít nhất 1 ký tự đặc biệt: @$!%*?&");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: "Người dùng cần nhập đúng yêu cầu!",
      errors: errors,
    });
  }

  next();
};

export const validateLogin: RequestHandler = (req, res, next) => {
  const { email, password } = req.body;
  const errors: string[] = [];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push("Email không hợp lệ");
  }

  if (!password) {
    errors.push("Password không được để trống");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: "Người dùng cần nhập đúng yêu cầu!",
      errors: errors,
    });
  }

  next();
};