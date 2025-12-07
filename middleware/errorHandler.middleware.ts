import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("Error:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
    return;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
    return;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
    return;
  }

  if (err.name === "TokenExpiredError") {
    res.status(401).json({
      success: false,
      message: "Token expired",
    });
    return;
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
};

// 404 handler
export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};