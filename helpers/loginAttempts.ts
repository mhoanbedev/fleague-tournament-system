import { User } from "../models/user.model";

export const isUserLocked = (user: User): boolean => {
  if (user.lockUntil && user.lockUntil > new Date()) {
    return true;
  }
  return false;
};

export const handleFailedLogin = async (user: User): Promise<void> => {
  user.failedAttempts += 1;
  if (user.failedAttempts >= 5) {
    user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Khóa 15 phút
  }
  await user.save();
};

export const resetLoginAttempts = async (user: User): Promise<void> => {
  user.failedAttempts = 0;
  user.lockUntil = null;
  await user.save();
};