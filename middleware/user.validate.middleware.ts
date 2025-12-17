import { RequestHandler } from "express";

export const validateUpdateProfile: RequestHandler = (req, res, next) => {
  const { username, address, phone } = req.body;
  const errors: string[] = [];

  if (username) {
    if (username.trim().length < 3) {
      errors.push("Username tối thiểu 3 ký tự");
    }
    if (username.trim().length > 30) {
      errors.push("Username tối đa 30 ký tự");
    }
    if (!/^[\p{L}0-9_ ]+$/u.test(username.trim())) {
      errors.push("Username chỉ được chứa chữ cái (có dấu), số, dấu gạch dưới và khoảng trắng");
    }
  }

  if (address !== undefined) {
    if (typeof address !== "string") {
      errors.push("Địa chỉ không hợp lệ");
    } else{
      const trimmedAddress = address.trim();

      if(trimmedAddress.length === 0){
        errors.push("Địa chỉ không được để trống");
      }

      if(trimmedAddress.length > 255){
        errors.push("Địa chỉ tối đa 255 ký tự");
      }
    }
  }

  if (phone !== undefined) {
    if (typeof phone !== "string") {
      errors.push("Số điện thoại phai là chuỗi ký tự");
    } else {
      const trimmedPhone = phone.trim();

      if(trimmedPhone.length === 0){
        errors.push("Số điện thoại không được để trống");
      }

      if(!/^(0|\+84)[0-9]{9}$/.test(trimmedPhone)){
        errors.push("Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)");
      }
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

export const validateChangePassword: RequestHandler = (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const errors: string[] = [];

  if (!oldPassword) {
    errors.push("Mật khẩu cũ không được để trống");
  }

  if (!newPassword) {
    errors.push("Mật khẩu mới không được để trống");
  } else {
    if (newPassword.length < 8) {
      errors.push("Mật khẩu mới tối thiểu 8 ký tự");
    }
    if (!/[a-z]/.test(newPassword)) {
      errors.push("Mật khẩu mới phải có ít nhất 1 chữ thường");
    }
    if (!/[A-Z]/.test(newPassword)) {
      errors.push("Mật khẩu mới phải có ít nhất 1 chữ hoa");
    }
    if (!/[0-9]/.test(newPassword)) {
      errors.push("Mật khẩu mới phải có ít nhất 1 số");
    }
    if (!/[@$!%*?&]/.test(newPassword)) {
      errors.push("Mật khẩu mới phải có ít nhất 1 ký tự đặc biệt: @$!%*?&");
    }
  }

  if (!confirmPassword) {
    errors.push("Xác nhận mật khẩu không được để trống");
  }

  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    errors.push("Mật khẩu mới và xác nhận mật khẩu không khớp");
  }

  if (oldPassword && newPassword && oldPassword === newPassword) {
    errors.push("Mật khẩu mới phải khác mật khẩu cũ");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: "Dữ liệu không hợp lệ!",
      errors: errors,
    });
  }

  next();
};