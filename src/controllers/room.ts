import {Request, Response} from "express";

export const index = (req: Request, res: Response) => {
    res.render("room/index", {"roomName": req.params.roomName, "title": `Room: ${req.params.roomName}`});
};

// export const createRoom = (req: Request, res: Response) => {
//
// }