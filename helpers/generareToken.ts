import cryto from "crypto";

export const generateToken = (): string => {
  return cryto.randomBytes(32).toString("hex");
};