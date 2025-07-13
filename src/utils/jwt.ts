import { IUser } from "@virtualroom/types";
import jwt from "jsonwebtoken";

const secret: string = "mohirwg";

function encode(user: IUser): string {
    const payload = {
        id: user.id,
        email: user.email
    };

    const token: string = jwt.sign(payload, secret);
    return token;
}

function decode(token: string): IUser {
    const user = jwt.verify(token, secret) as IUser;
    return user;
}

export { encode, decode };