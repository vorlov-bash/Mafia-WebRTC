import {Request, Response} from "express";

export const index = (req: Request, res: Response) => {
    if (req.query.presenter) {
        res.render("room/presenter", {"roomID": req.params.roomID, "title": `Room: ${req.params.roomID}`})
    } else {
        res.render("room/index", {"roomID": req.params.roomID, "title": `Room: ${req.params.roomID}`});
    }
};
// export const createRoom = (req: Request, res: Response) => {
//
// }