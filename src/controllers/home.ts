import { Response } from "express";
import { XRequest as Request } from "../utils/requestConfig";
import User from "../models/user";
import friendRequest from "../models/friendRequest";
import FriendsList from "../models/friendsList";


const controller = {
    getHome: async (req: Request, res: Response) => {
        const { user } = req;
        const friends = await FriendsList.findOne({ user: user._id }).populate("friends");
        const friendRequests: any = await friendRequest.find({ receiver: user._id }).populate("sender");
        console.log(friendRequests);
        console.log(friends);
        
        const allUsers = await User.find({ _id: { $ne: user._id } });
        res.render('index', { 
            name: req.user.firstName, 
            email: req.user.email, 
            username: req.user.username, 
            friends: friends ? friends.friends : [], 
            friendRequests: friendRequests ? friendRequests : [],
            allUsers: allUsers ? allUsers : []
        });
    }
};

export default controller;