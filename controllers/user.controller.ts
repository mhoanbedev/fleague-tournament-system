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
      `<div style="
      font-family: Arial, Helvetica, sans-serif;
      background-color: #f4f6f8;
      padding: 30px;
  ">
      <div style="
          max-width: 520px;
          margin: auto;
          background-color: #ffffff;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          overflow: hidden;
      ">
          <!-- Header -->
          <div style="
              background-color: #ff9800;
              color: #ffffff;
              padding: 20px;
              text-align: center;
          ">
              <img 
                src="https://res.cloudinary.com/dlooaxncv/image/upload/v1766126318/851fa114-cace-44e7-85b1-b6492d3d167e_yp86ic.jpg"
                alt="Phui League"
                style="max-height:70px; display:block; margin:0 auto 8px;"
              />
              <p style="margin: 0;">Thông báo thay đổi mật khẩu</p>
          </div>

          <!-- Body -->
          <div style="padding: 25px; color: #333333;">
              <p>Xin chào <strong>${user.username}</strong>,</p>

              <p>
                  Mật khẩu tài khoản của bạn đã được
                  <strong>thay đổi thành công</strong>.
              </p>

              <div style="
                  background-color: #fff8e1;
                  border-left: 4px solid #ff9800;
                  padding: 15px;
                  margin: 20px 0;
                  font-size: 14px;
              ">
                  ⚠️ Nếu bạn <strong>không thực hiện</strong> thay đổi này,
                  vui lòng liên hệ với bộ phận hỗ trợ <strong>ngay lập tức</strong>
                  để đảm bảo an toàn cho tài khoản.
              </div>

              <p style="font-size: 14px; color: #555555;">
                  ⏰ Thời gian thay đổi:
                  <strong>${new Date().toLocaleString("vi-VN")}</strong>
              </p>

              <p style="margin-top: 30px;">
                  Trân trọng,<br/>
                  <strong>Đội ngũ Admin FLeague.</strong>
              </p>
          </div>

          <!-- Footer -->
          <div style="
              background-color: #f4f6f8;
              padding: 15px;
              text-align: center;
              font-size: 12px;
              color: #888888;
          ">
              © ${new Date().getFullYear()} Phui League. All rights reserved.
          </div>
      </div>
  </div>`
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