import { RequestHandler } from "express";
import User from "../models/user.model";

export const loadUser: RequestHandler = async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      message: "Chưa đăng nhập!",
    });
  }

  try {
    const user = await User.findOne({
      _id: req.userId,
    }).select("-password -refreshToken -__v");

    if (!user) {
      return res.status(404).json({
        message: "Người dùng không tồn tại!",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};