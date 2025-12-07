import { Response } from "express";

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  errors?: any;
}

export const sendSuccess = (
  res: Response,
  data: any = null,
  message: string = "Success",
  statusCode: number = 200
): Response => {
  const response: ApiResponse = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string = "Error",
  errors: any = null,
  statusCode: number = 400
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

export const sendCreated = (
  res: Response,
  data: any = null,
  message: string = "Created successfully"
): Response => {
  return sendSuccess(res, data, message, 201);
};

export const sendUnauthorized = (
  res: Response,
  message: string = "Unauthorized"
): Response => {
  return sendError(res, message, null, 401);
};

export const sendForbidden = (
  res: Response,
  message: string = "Forbidden"
): Response => {
  return sendError(res, message, null, 403);
};

export const sendNotFound = (
  res: Response,
  message: string = "Not found"
): Response => {
  return sendError(res, message, null, 404);
};

export const sendServerError = (
  res: Response,
  message: string = "Internal server error",
  error?: any
): Response => {
  console.error("Server Error:", error);
  return sendError(res, message, null, 500);
};