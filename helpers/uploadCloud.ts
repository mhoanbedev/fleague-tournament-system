import { RequestHandler } from "express";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

const streamUpload = (buffer: any, resourceType: "image" | "video" | "auto" = "auto", folder: string = "football-league") => {
  return new Promise((resolve, reject) => {
    let stream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: folder,
      },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

const uploadToCloudinary = async (buffer: any, resourceType: "image" | "video" | "auto" = "auto", folder: string = "football-league") => {
  let result = (await streamUpload(buffer, resourceType, folder)) as { url: string };
  return result.url;
};

export const uploadSingle: RequestHandler = async (req, res, next) => {
  try {
    const file = (req as any).file;
    
    if (!file) {
      return next();
    }

    const result = await uploadToCloudinary(file.buffer, "image", "football-league/images");
    req.body[file.fieldname] = result;
  } catch (error) {
    console.log("Upload error:", error);
    return res.status(500).json({
      message: "Upload file thất bại!",
    });
  }
  next();
};

export const uploadFields: RequestHandler = async (req, res, next) => {
  try {
    const files = (req as any).files;
    if (!files) return next();

    const resultList: string[] = [];
    if (Array.isArray(files)) {
      for (const file of files) {
        const url = await uploadToCloudinary(file.buffer, "image", "football-league/images");
        resultList.push(url);
      }

      req.body.photos = resultList;
      return next();
    }
    for (const key in files) {
      req.body[key] = [];

      for (const file of files[key]) {
        const url = await uploadToCloudinary(file.buffer, "image", "football-league/images");
        req.body[key].push(url);
      }
    }

    next();
  } catch (error) {
    console.log("Upload error:", error);
    res.status(500).json({ message: "Upload files thất bại!" });
  }
};



export const uploadSingleVideo: RequestHandler = async (req, res, next) => {
  try {
    const file = (req as any).file;
    
    if (!file) {
      return next();
    }

    const result = await uploadToCloudinary(file.buffer, "video", "football-league/highlights");
    req.body.videoUrl = result;
  } catch (error) {
    console.log("Upload video error:", error);
    return res.status(500).json({
      message: "Upload video thất bại!",
    });
  }
  next();
};


export const uploadMultipleVideos: RequestHandler = async (req, res, next) => {
  try {
    const files = (req as any).files;
    
    if (!files || files.length === 0) {
      return next();
    }

    const uploadedVideos = [];
    
    for (const file of files) {
      const result = await uploadToCloudinary(file.buffer, "video", "football-league/highlights");
      uploadedVideos.push(result);
    }
    
    req.body.uploadedVideos = uploadedVideos;
  } catch (error) {
    console.log("Upload videos error:", error);
    return res.status(500).json({
      message: "Upload videos thất bại!",
    });
  }
  next();
};