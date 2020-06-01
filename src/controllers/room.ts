import { Request, Response } from "express";

export const index = (req: Request, res: Response) => {
    res.render("room", {"title": "room"})
};

// export const createRoom = (req: Request, res: Response) => {
//
// }