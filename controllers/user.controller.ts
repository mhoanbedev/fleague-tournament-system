import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import { sendMail } from "../helpers/mail.helper";
// [GET] /api/v1/user/profile
export const profile: RequestHandler = async (req, res) => {
  try {
    res.status(200).json({
      message: "Thông tin cá nhân",
      infoUser: req.user,
    });
  } catch (error) {
    res.status(400).json({
      message: "Chưa đăng nhập!",
    });
  }
};


// [PATCH] /api/v1/user/update-profile
export const updateProfile: RequestHandler = async (req, res) => {
  try {
    const { username, avatar, address, phone } = req.body;
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({
            message: "Chưa đăng nhập!",
        });
    }
    const user = await User.findOne({ _id: userId });
    if (!user) {
        return res.status(404).json({   
            message: "Người dùng không tồn tại!",
        });
    }   

    if (username && username.trim() !== user.username){
        const existingUser = await User.findOne({
          username: username.trim(),
          _id: { $ne: userId },
        });
        if (existingUser) {
            return res.status(400).json({
                message: "Username đã được sử dụng!",
            });
        }
        user.username = username.trim();
    }

    if (avatar) {
        user.avatar = avatar;
    }
    if (address !== undefined) {
      user.address = address?.trim() || null;
    }
    
    if (phone !== undefined) {
      user.phone = phone?.trim() || null;
    }

    await user.save();
    const updatedUser = await User.findOne({ _id: userId }).select("-password -refreshToken -__v");

    res.status(200).json({
        message: "Cập nhật thông tin cá nhân thành công",
        infoUser: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error!",
    });
  }
};

// [PATCH] /api/v1/user/change-password

export const changePassword: RequestHandler = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({
            message: "Chưa đăng nhập!",
        });
    }
    const user = await User.findOne({ _id: userId });
    if (!user) {
        return res.status(404).json({
            message: "Người dùng không tồn tại!",
        });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
        return res.status(400).json({
            message: "Mật khẩu cũ không đúng!",
        });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.refreshToken = null;
    await user.save();
    sendMail(
      user.email,
      "Thông báo thay đổi mật khẩu",
      `<h2>Xin chào ${user.username},</h2>
      <p>Mật khẩu tài khoản của bạn đã được thay đổi thành công. Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ với bộ phận hỗ trợ ngay lập tức.</p>
      <p>Thời gian: ${new Date().toLocaleString()}</p>
      <p>Trân trọng,</p>
      <p>Đội ngũ Admin FLeague</p>`
    )
    res.status(200).json({
        message: "Đổi mật khẩu thành công!",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error!",
    });
  }
};  



// [DELETE] /api/v1/user/delete-account
export const deleteAccount: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId;
    const { password } = req.body;
    if (!userId) {
        return res.status(401).json({
            message: "Chưa đăng nhập!",
        });
    }
    const user = await User.findOne({ _id: userId });
    if (!user) {
        return res.status(404).json({
            message: "Người dùng không tồn tại!",
        });
    }

    if(!password){
        return  res.status(400).json({
            message: "Mật khẩu không được để trống!",
        });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({
            message: "Mật khẩu không đúng!",
        });
    }
    await User.deleteOne({ _id: userId });
    res.status(200).json({
        message: "Xóa tài khoản thành công!",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error!",
    });
  }
};