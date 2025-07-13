export interface IRoom{
	id: string;
	name:string;
	description:string;
	isPublic: boolean;
	active: boolean;
	duration:number;
	createdById: string;
	createdAt: Date;
}
