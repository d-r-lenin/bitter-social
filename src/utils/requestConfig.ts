import { Request } from "express";

export interface XRequest extends Request {
    user?: any
}