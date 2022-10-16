import User from "../models/user";
import jwt from "jsonwebtoken";
import {  Response } from "express";
import { XRequest as Request } from "../utils/requestConfig";

interface JwtPayload {
    id: string
}

async function auth(req: Request, res: Response, next: any) {
    let token: string = req.cookies.token;
    console.log(token);
    if (!token) {
        return res.redirect('/users/signIn');
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY || "secret") as JwtPayload;
        const user:any = await User.findById(decoded.id);
        console.log(user);
        // remove password from user object
        if (!user) {
            return res.redirect('/users/signIn');
            // return res.status(400).send('/cvusers/signIn');
        }
        user.password = null;
        req.user = user;
        next();
    } catch (ex) {
        console.log(ex);
        return res.redirect('/users/signIn');
    }
}


export { auth };