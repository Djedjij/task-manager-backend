import { TUserResponse } from "./user.types";

export type TRegisterUserDto = {
  email: string;
  password: string;
};

export type TLoginUserDto = {
  email: string;
  password: string;
};

export type TAuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: TUserResponse;
};

export type TTokenPayload = {
  userId: string;
  email: string;
};

export type TChangePasswordDto = {
  currentPassword: string;
  newPassword: string;
};
