import { RequestHandler } from "express";
import League  from "../models/league.model";

export const isLeagueOwner: RequestHandler = async (req, res, next) => {
    try {
        const leagueId = req.params.leagueId || req.params.id;
        const userId = req.userId;
        if(!userId){
            return res.status(401).json({
                message: "Chưa đăng nhập!",
            });
        }
        const league = await League.findById(leagueId);
        if (!league) {
            return res.status(404).json({
                message: "Giải đấu không tồn tại!",
            });
        }
        if (league.owner.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "Bạn không có quyền thực hiện hành động này!",
            });
        }
        (req as any).league = league;
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi server!",
        });

    }   
};


export const canAccessLeague: RequestHandler = async (req, res, next) => {
    try {
        const leagueId = req.params.id;
        const userId = req.userId;
        const accessToken = req.query.token;
        const league = await League.findById(leagueId);
        if (!league) {
            return res.status(404).json({
                message: "Giải đấu không tồn tại!",
            });
        }

        if(league.visibility === "public"){
            (req as any).league = league;
            return next();
        }

        if(league.visibility === "private"){
            const isOwner = userId && league.owner.toString() === userId.toString();
            const hasValidToken = accessToken === league.accessToken;
            if(isOwner || hasValidToken){
                (req as any).league = league;
                return next();
            } 
            return res.status(403).json({
                message: "Giải đấu này ở chế độ riêng tư. Bạn cần có mã truy cập!",
            });
        }
        next();
        } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi server!",
        });
    }
};
        