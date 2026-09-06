import jwt from "jsonwebtoken";
import { TTokenPayload } from "../types/auth.types";
import type { StringValue } from "ms";

const accessSecret = process.env.JWT_ACCESS_SECRET!;
const refreshSecret = process.env.JWT_REFRESH_SECRET!;
const accessExpiry = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const refreshExpiry = process.env.REFRESH_TOKEN_EXPIRY || "7d";

export const generateAccessToken = (payload: TTokenPayload): string => {
  return jwt.sign(payload, accessSecret, {
    expiresIn: accessExpiry as StringValue,
  });
};

export const generateRefreshToken = (payload: TTokenPayload): string => {
  return jwt.sign(payload, refreshSecret, {
    expiresIn: refreshExpiry as StringValue,
  });
};

export const verifyAccessToken = (token: string): TTokenPayload => {
  return jwt.verify(token, accessSecret) as TTokenPayload;
};

export const verifyRefreshToken = (token: string): TTokenPayload => {
  return jwt.verify(token, refreshSecret) as TTokenPayload;
};
