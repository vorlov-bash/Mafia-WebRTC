import {Request, Response} from "express";

export const index = (req: Request, res: Response) => {
    res.render("home/index", {'title': "home"});
};

export const createroom = (req: Request, res: Response) => {
    let room_id = Math.floor(Math.random() * 1000000) + 1;
    res.redirect(`room/${room_id}?presenter=true`)
};
