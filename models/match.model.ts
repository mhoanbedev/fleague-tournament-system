import mongoose, { Document, Schema } from "mongoose";

export interface MatchScore {
  home: number;
  away: number;
}

export interface HighlightVideo {
  url: string;
  title?: string | null;
  uploadedAt: Date;
}

export interface Match extends Document {
  _id: mongoose.Types.ObjectId;
  league: mongoose.Types.ObjectId;
  homeTeam: mongoose.Types.ObjectId;
  awayTeam: mongoose.Types.ObjectId;
  round: number;
  matchNumber: number;
  group?: string | null;
  scheduledDate?: Date | null;
  playedDate?: Date | null;
  score: MatchScore;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  venue?: string;
  referee?: string;
  videoUrl?: string | null;
  highlightVideos: HighlightVideo[];
  photos: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema = new Schema<Match>(
  {
    league: {
      type: Schema.Types.ObjectId,
      ref: "League",
      required: [true, "League là bắt buộc"],
    },
    homeTeam: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: [true, "Đội nhà là bắt buộc"],
    },
    awayTeam: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: [true, "Đội khách là bắt buộc"],
    },
    round: {
      type: Number,
      required: [true, "Vòng đấu là bắt buộc"],
      min: [1, "Vòng đấu tối thiểu là 1"],
    },
    matchNumber: {
      type: Number,
      required: [true, "Số thứ tự trận đấu là bắt buộc"],
      min: [1, "Số trận tối thiểu là 1"],
    },
    group: {
      type: String,
      default: null,
      uppercase: true,
      match: [/^[A-Z]$/, "Group phải là chữ cái in hoa (A-Z)"],
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    playedDate: {
      type: Date,
      default: null,
    },
    score: {
      home: {
        type: Number,
        default: 0,
        min: [0, "Bàn thắng không được âm"],
      },
      away: {
        type: Number,
        default: 0,
        min: [0, "Bàn thắng không được âm"],
      },
    },
    status: {
      type: String,
      enum: ["scheduled", "live", "finished", "postponed", "cancelled"],
      default: "scheduled",
    },
    venue: {
      type: String,
      default: null,
      maxlength: [200, "Tên sân tối đa 200 ký tự"],
    },
    referee: {
      type: String,
      default: null,
      maxlength: [100, "Tên trọng tài tối đa 100 ký tự"],
    },
    videoUrl: {
      type: String,
      default: null,
      validate: {
        validator: function (v: string) {
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: "Video URL không hợp lệ",
      },
    },
    highlightVideos: [
      {
        url: {
          type: String,
          required: true,
        },
        title: {
          type: String,
          default: null,
          maxlength: [100, "Tiêu đề tối đa 100 ký tự"],
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    photos: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr: string[]) {
          return arr.length <= 10;
        },
        message: "Tối đa 10 ảnh cho mỗi trận",
      },
    },
    notes: {
      type: String,
      default: null,
      maxlength: [500, "Ghi chú tối đa 500 ký tự"],
    },
  },
  {
    timestamps: true,
  }
);

MatchSchema.index({ league: 1, round: 1 });
MatchSchema.index({ league: 1, status: 1 });
MatchSchema.index({ league: 1, group: 1 });
MatchSchema.index({ homeTeam: 1 });
MatchSchema.index({ awayTeam: 1 });
MatchSchema.index({ scheduledDate: 1 });

MatchSchema.index(
  { league: 1, round: 1, homeTeam: 1, awayTeam: 1 },
  { unique: true }
);

export default mongoose.model<Match>("Match", MatchSchema);