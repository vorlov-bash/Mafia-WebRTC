import {Request, Response} from "express";

export const index = (req: Request, res: Response) => {
    res.render("room/client", {"roomName": req.params.roomName});
};

// export const createRoom = (req: Request, res: Response) => {
//
// }