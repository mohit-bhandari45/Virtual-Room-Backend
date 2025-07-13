interface IUser {
    id: string;
    name: string | null;
    email: string;
    password: string;
    avatar: string;
    username: string | null;
    createdAt: Date;
    passwordResetToken: string | null;
    passwordResetExpires: Date;
}

export type { IUser };