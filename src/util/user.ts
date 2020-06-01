export enum ROLES {
    Mafia,
    Citizen,
    Medic,
    Police
}

export class User {
    public id: number;
    public name: string;
    public role: number;
    public cam: any;
    session: any;

    constructor(id: number, name: string, role: number) {
        this.id = id;
        this.name = name;
        this.role = role
    }
}