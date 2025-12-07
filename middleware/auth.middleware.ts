import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret";

export const authMiddleware: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({
      message: "Thiếu access token",
    });
  }

  try {
    const decode = jwt.verify(token, ACCESS_SECRET) as { id: string };
    req.userId = decode.id;
    next();
  } catch (error) {
    return res.status(403).json({
      message: "Access Token không hợp lệ!",
    });
  }
};

export const optionalAuth: RequestHandler = async(req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if(token){
        try {
            const decode = jwt.verify(token, ACCESS_SECRET) as { id : string};
            req.userId = decode.id;
        } catch (error) {
            
        }

    }   
    next()
}