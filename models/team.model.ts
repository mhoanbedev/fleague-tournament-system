import mongoose, { Document, Schema} from "mongoose";

export interface TeamStats {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
}



export interface Team extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    shortName: string;
    logo?: string;
    league: mongoose.Types.ObjectId;
    group?: string | null;
    stats: TeamStats;
    form: string[];
    createdAt: Date;
    updatedAt: Date;
}

const TeamSchema = new Schema<Team>(
  {
    name: {
      type: String,
      required: [true, "Tên đội là bắt buộc"],
      trim: true,
      minlength: [2, "Tên đội tối thiểu 2 ký tự"],
      maxlength: [50, "Tên đội tối đa 50 ký tự"],
    },
    shortName: {
      type: String,
      required: [true, "Tên viết tắt là bắt buộc"],
      trim: true,
      uppercase: true,
      minlength: [2, "Tên viết tắt tối thiểu 2 ký tự"],
      maxlength: [5, "Tên viết tắt tối đa 5 ký tự"],
    },
    logo: {
      type: String,
      default: null,
    },
    league: {
      type: Schema.Types.ObjectId,
      ref: "League",
      required: [true, "League là bắt buộc"],
    },
    group: {
      type: String,
      default: null,
      uppercase: true,
      match: [/^[A-Z]$/, "Group phải là chữ cái in hoa (A-Z)"],
    },
    stats: {
      played: {
        type: Number,
        default: 0,
        min: 0,
      },
      won: {
        type: Number,
        default: 0,
        min: 0,
      },
      drawn: {
        type: Number,
        default: 0,
        min: 0,
      },
      lost: {
        type: Number,
        default: 0,
        min: 0,
      },
      goalsFor: {
        type: Number,
        default: 0,
        min: 0,
      },
      goalsAgainst: {
        type: Number,
        default: 0,
        min: 0,
      },
      goalDifference: {
        type: Number,
        default: 0,
      },
      points: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    form: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr: string[]) {
          return arr.every((item) => ["W", "D", "L"].includes(item));
        },
        message: "Form chỉ chứa W (win), D (draw), L (lose)",
      },
    },
  },
  {
    timestamps: true,
  }
);


TeamSchema.index({ league: 1 });
TeamSchema.index({ league: 1, group: 1 });
TeamSchema.index({ league: 1, "stats.points": -1, "stats.goalDifference": -1 });


TeamSchema.index({ league: 1, name: 1 }, { unique: true });
TeamSchema.index({ league: 1, shortName: 1 }, { unique: true });

export default mongoose.model<Team>("Team", TeamSchema);