import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import { generateTokens, verifyRefreshToken } from "../helpers/tokens";
import * as loginAttempts from "../helpers/loginAttempts";
import ForgotPassword from "../models/forgot-password.model";
import { generateRandomNumber, generateRandomString } from "../helpers/generate";
import { sendMail } from "../helpers/mail.helper";

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

// [POST] /auth/forgot-password
export const forgotPassword: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if(!email) {
      return res.status(400).json({
        message: "Email là bắt buộc!",
      });
    };
    const user = await User.findOne({
      email: email
    });
    if(!user) {
      return res.status(404).json({
        message: "Người dùng không tồn tại!",
      });
    }
    await ForgotPassword.deleteMany({ email: email });
    const otp = generateRandomNumber(6);
    await ForgotPassword.create({
      email: email,
      otp: otp,
      expireAt : Date.now()
    });

    const subject = "Mã OTP xác minh đặt lại mật khẩu";
    const html = `
    <div style="
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
            background-color: #1e90ff;
            color: #ffffff;
            padding: 20px;
            text-align: center;
        ">
            <h1 style="margin: 0;">Phui League</h1>
            <p style="margin: 5px 0 0;">Xác minh đặt lại mật khẩu</p>
        </div>

        <!-- Body -->
        <div style="padding: 25px; color: #333333;">
            <p>Xin chào <strong>${user.username}</strong>,</p>

            <p>
                Chúng tôi nhận được yêu cầu <strong>đặt lại mật khẩu</strong> cho tài khoản của bạn.
                Vui lòng sử dụng mã OTP bên dưới để xác minh:
            </p>

            <div style="
                text-align: center;
                margin: 30px 0;
            ">
                <span style="
                    display: inline-block;
                    font-size: 28px;
                    letter-spacing: 6px;
                    font-weight: bold;
                    color: #1e90ff;
                    background-color: #f0f7ff;
                    padding: 12px 24px;
                    border-radius: 8px;
                ">
                    ${otp}
                </span>
            </div>

            <p style="font-size: 14px; color: #555555;">
                Mã OTP này sẽ <strong>hết hạn sau 3 phút</strong>.
                Vui lòng không chia sẻ mã này với bất kỳ ai để bảo vệ tài khoản của bạn.
            </p>

            <p style="font-size: 14px; color: #555555;">
                Nếu bạn <strong>không yêu cầu</strong> đặt lại mật khẩu,
                vui lòng bỏ qua email này.
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
</div>
    `
    sendMail(email, subject, html);
    return res.status(200).json({
      message: "Đã gửi mã OTP đến email của bạn!",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error!",
    });
  }
}

// POST /auth/verify-otp
export const verifyOtp: RequestHandler = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email và OTP là bắt buộc!",
      });
    }
    const record = await ForgotPassword.findOne({ email: email, otp: otp });
    if (!record) {
      return res.status(400).json({
        message: "OTP không hợp lệ hoặc đã hết hạn!",
      });
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({
        message: "Người dùng không tồn tại!",
      });
    }
    const resetToken = generateRandomString(30);
    record.otp = resetToken;
    await record.save();

    return res.status(200).json({
      message: "Xác minh OTP thành công!",
      resetToken: resetToken
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error!",
    });
  }
}

// [POST] /auth/reset-password
export const resetPassword: RequestHandler = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        message: "Thiếu thông tin bắt buộc!",
      });
    }

    const record = await ForgotPassword.findOne({ email: email, otp: resetToken });
    if (!record) {
      return res.status(400).json({
        message: "Reset token không hợp lệ hoặc đã hết hạn!",
      });
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({
        message: "Người dùng không tồn tại!",
      });
    }
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: "Mật khẩu mới không được trùng với mật khẩu cũ!",
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.refreshToken = null;
    await user.save();

    await ForgotPassword.deleteMany({ email: email });

    const subject = "Đặt lại mật khẩu thành công";
    const html = `
    <div style="
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
    background-color: #28a745;
    color: #ffffff;
    padding: 20px;
    text-align: center;
">
    <img 
      src="https://res.cloudinary.com/dlooaxncv/image/upload/v1766126318/851fa114-cace-44e7-85b1-b6492d3d167e_yp86ic.jpg"
      alt="Phui League"
      style="
        max-height: 60px;
        display: block;
        margin: 0 auto 8px;
      "
    />
    <p style="margin: 0;">Đặt lại mật khẩu thành công!</p>
</div>


        <!-- Body -->
        <div style="padding: 25px; color: #333333;">
            <p>Xin chào <strong>${user.username}</strong>,</p>

            <p>
                Mật khẩu cho tài khoản
                <strong>${user.email}</strong>
                đã được <span style="color:#28a745; font-weight:bold;">đặt lại thành công</span>.
            </p>

            <div style="
                background-color: #f0fff4;
                border-left: 4px solid #28a745;
                padding: 15px;
                margin: 20px 0;
                font-size: 14px;
            ">
                🔐 Tài khoản của bạn hiện đã được bảo mật với mật khẩu mới.
            </div>

            <p>
                Nếu bạn <strong>không thực hiện</strong> thao tác này, vui lòng:
            </p>

            <ul style="padding-left: 18px;">
                <li>Liên hệ ngay bộ phận hỗ trợ</li>
                <li>Đổi lại mật khẩu càng sớm càng tốt</li>
            </ul>

            <p style="font-size: 14px; color: #555555;">
                ⏰ Thời gian thực hiện:
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
</div>
    `;
    sendMail(email, subject, html);

    return res.status(200).json({
      message: "Đặt lại mật khẩu thành công!",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error!",
    });
  }
}