interface IResponse {
    msg: string;
    token?: string;
    error?: Error;
    data?: any;
}

export type { IResponse };