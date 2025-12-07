import mongoose, {Document, mongo, Schema} from "mongoose";

export interface League extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    logo?: string;
    owner: mongoose.Types.ObjectId;
    type: "group-stage" | "round-robin";
    visibility: "public" | "private";
    accessToken?: string;
    tournamentStatus: "upcoming" | "ongoing" | "completed";
    numberOfTeams: number;
    teams: mongoose.Types.ObjectId[];
    groupSettings?: {
        numberOfGroups: number;
        teamsPerGroup: number;
    };
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

const LeagueSchema = new Schema<League>(
    {
        name: {
            type: String,
            required: [true, "Tên giải đấu là bắt buộc"],
            trim: true,
            minlength: [3, "Tên giải đấu tối thiểu 3 ký tự"],
            maxlength: [100, "Tên giải đấu tối đa 100 ký tự"],
        },
        description: {
            type: String,
            default: null,
            maxlength: [500, "Mô tả tối đa 500 ký tự"],
        },
        logo: {
            type: String,
            default: null,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["group-stage", "round-robin"],
            required: [true, "Thể thức thi đấu là bắt buộc"],
        },
        visibility: {
            type: String,   
            enum: ["public", "private"],
            default: "public",
        },
        accessToken: {
            type: String,
            default: null,
        },
        tournamentStatus: {
            type: String,
            enum: ["upcoming", "ongoing", "completed"],
            default: "upcoming",
        },
        numberOfTeams: {    
            type: Number,
            required: [true, "Số đội tham gia là bắt buộc"],
            min: [2, "Số đội tham gia tối thiểu là 2"],
            max: [32, "Số đội tham gia tối đa là 32"],
        },
        teams: [
            {
                type: Schema.Types.ObjectId,
                ref: "Team",
            },
        ],
        groupSettings: {
            numberOfGroups: {
                type: Number,
                min: [2, "Tối thiểu 2 bảng"],
                max: [8, "Tối đa 8 bảng"],
            },
            teamsPerGroup: {
                type: Number,
                min: [3, "Tối thiểu 3 đội/bảng"],
                max: [6, "Tối đa 6 đội/bảng"],
            },
        },
        startDate: {
            type: Date,
            default: null,
        },
        endDate: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);


LeagueSchema.index({owner: 1});
LeagueSchema.index({visibility: 1});
LeagueSchema.index({tournamentStatus: 1});
LeagueSchema.index({createdAt: -1});

export default mongoose.model<League>("League", LeagueSchema)