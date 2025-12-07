import multer from "multer";
import { Request } from "express";

const storage = multer.memoryStorage();

const imageFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ được upload file ảnh!"));
  }
};

const videoFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ được upload video định dạng: MP4, MOV, AVI, MKV!"));
  }
};

export const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export const uploadVideo = multer({
  storage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});