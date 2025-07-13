interface IUser {
    id: string;
    name: string | null;
    email: string;
    password: string;
    avatar: string;
    username: string | null;
    createdAt: Date;
}

export type { IUser };