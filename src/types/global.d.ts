import { IUser } from "./user";

export {}; // 👈 REQUIRED to make this a module

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}