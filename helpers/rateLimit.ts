import rateLimit from "express-rate-limit";

export const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: {
    status: 429,
    message: "Quá nhiều request, vui lòng thử lại sau 15 phút!",
  },
  standardHeaders: true,
  legacyHeaders: false,
});