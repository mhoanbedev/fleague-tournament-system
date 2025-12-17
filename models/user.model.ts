import mongoose, { Document, Schema } from "mongoose";

export interface User extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  refreshToken?: string | null;
  failedAttempts: number;
  lockUntil?: Date | null;
  createdLeagues: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  address?: string;
  phone?: string;
}

const UserSchema = new Schema<User>(
  {
    username: {
      type: String,
      required: [true, "Username là bắt buộc"],
      unique: true,
      trim: true,
      minlength: [3, "Username tối thiểu 3 ký tự"],
      maxlength: [30, "Username tối đa 30 ký tự"],
    },
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Email không hợp lệ",
      ],
    },
    password: {
      type: String,
      required: [true, "Password là bắt buộc"],
      minlength: [8, "Password tối thiểu 8 ký tự"],
    },
    avatar: {
      type: String,
      default: null,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    failedAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    createdLeagues: [
      {
        type: Schema.Types.ObjectId,
        ref: "League",
      },
    ],
    address: {
      type: String,
      trim: true,
      maxLength: [255, "Địa chỉ tối đa 255 ký tự"],
      default: null,
    },

    phone: {
      type: String,
      trim: true,
      match: [
        /^(0|\+84)[0-9]{9}$/,
        "Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)",
      ],
      default: null
    },

  },
  {
    timestamps: true,
  }
);

UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

export default mongoose.model<User>("User", UserSchema);