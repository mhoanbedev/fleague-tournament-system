import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import { generateTokens, verifyRefreshToken } from "../helpers/tokens";
import * as loginAttempts from "../helpers/loginAttempts";

// [POST] /user/register
export const register: RequestHandler = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const existingUser = await User.findOne({
      $or: [{ username: username }, { email: email }],
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: "User đã tồn tại!" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      username, 
      email, 
      password: hashedPassword 
    });
    
    await user.save();

    res.status(201).json({
      message: "Đăng ký thành công",
      user: user,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Server error!" 
    });
  }
};

// [POST] /user/login
export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({
        message: "Email không tồn tại!",
      });
    }

    if (loginAttempts.isUserLocked(user)) {
      return res.status(403).json({
        message: `Tài khoản bị khóa đến ${user.lockUntil?.toLocaleTimeString()}`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await loginAttempts.handleFailedLogin(user);
      return res.status(400).json({
        message: "Sai mật khẩu!",
      });
    }

    await loginAttempts.resetLoginAttempts(user);
    
    const tokens = generateTokens({
      id: user._id.toString(),
      email: user.email,
    });
    
    await User.updateOne(
      { _id: user._id.toString() },
      { refreshToken: tokens.refreshToken }
    );

    res.status(200).json({
      message: "Đăng nhập thành công!",
      refreshToken: tokens.refreshToken,
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Server error!" 
    });
  }
};

// [POST] /user/refresh
export const refresh: RequestHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        message: "Thiếu refresh token",
      });
    }

    const decoded: any = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({
        message: "Refresh token không hợp lệ",
      });
    }

    const tokens = generateTokens({ 
      id: user._id.toString(), 
      email: user.email 
    });

    await User.updateOne(
      { _id: user._id.toString() },
      { refreshToken: tokens.refreshToken }
    );

    res.status(200).json({
      tokens: tokens,
    });
  } catch (err) {
    res.status(403).json({
      message: "Refresh token không hợp lệ hoặc hết hạn",
    });
  }
};

// [POST] /user/logout
export const logout: RequestHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        message: "Thiếu refresh token",
      });
    }

    const user = await User.findOne({
      refreshToken: refreshToken,
    });
    
    if (!user) {
      return res.status(400).json({
        message: "Không tìm thấy user",
      });
    }
    
    await User.updateOne(
      { _id: user._id.toString() },
      { refreshToken: null }
    );

    res.json({
      message: "Đăng xuất thành công!",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error!",
    });
  }
};