import connect from "../config/db";
import { Response } from "express";
import { XRequest as Request } from "../utils/requestConfig";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user";
import FriendsList from "../models/friendsList";
import FriendRequest from "../models/friendRequest";
import mongoose from "mongoose";

const saltRounds: number = 10;

const controller = {
    getUsers: (req: Request, res: Response) => {
        User.find({})
            .then((users: Array<any>) => {
                res.send(users);
            })
            .catch((err: Error) => {
                res.send(err);
            });
    },

    signUpPage: (req: Request, res: Response) => {
        res.send(`
        <form method="POST" action="/users/signUp" enctype="json">
            <div>
                <label>Name</label>
                <input name="fname" required />
                <input name="mname" />
                <input name="lname" />
            </div>
            <div>
                <label>Email</label>
                <input name="email" required />
            </div>
            <div>
                <label>UserName</label>
                <input name="username" type="text" required />
            </div>
            <div>
                <label>Password</label>
                <input name="password" type="password" />
            </div>
            <div>
                <label>CPassword</label>
                <input name="cPassword" type="password" />
            </div>
            <button>Sign Up</button>
        </form>
        <a href="/users/signIn">Sign In</a>
    `);
    },

    sighUp: async (req: Request, res: Response) => {
        try {
            const { fname, mname, lname, email, username, password, cPassword } = req.body;
            if (password != cPassword) {
                return res.send("Password and Confirm Password does not match");
            }
            // check if user already exists
            const userExist: any = await User.findOne({ $or: [{ email }, { username }] });
            if (userExist) {
                return res.send("User already exists");
            }
            // hash password
            const hash: string = await bcrypt.hash(password, saltRounds);
            const user = new User({
                firstName: fname,
                middleName: mname,
                lastName: lname,
                email,
                username,
                password: hash,
            });

            user.save()
                .then((user: any) => {
                    res.redirect("/users/signIn");
                })
                .catch((err: Error) => {
                    res.send(err);
                });
        } catch (error) {
            res.send(error);
        }
    },

    signIn: (req: Request, res: Response) => {
        const { username, password } = req.body;
        User.findOne({ username })
            .then(async (user: any) => {
                if (!user) {
                    return res.send("User not found");
                }
                const result: boolean = await bcrypt.compare(password, user.password);
                if (result) {
                    const token: string = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret");
                    res.cookie("token", token, {
                        secure: process.env.NODE_ENV !== "development",
                        httpOnly: true,
                        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10),
                    });
                    res.redirect("/");
                } else {
                    res.send("Incorrect password");
                }
            })
            .catch((err: Error) => {
                res.send(err);
            });
    },

    signInPage: (req: Request, res: Response) => {
        res.send(`
        <form method="POST" action="/users/signIn" enctype="json">
            <div>
                <label>UserName</label>
                <input name="username" type="text" required />
            </div>
            <div>
                <label>Password</label>
                <input name="password" type="password" />
            </div>
            <button>Sign In</button>
        </form>
        <a href="/users/signUp">Sign Up</a>
    `);
    },

    signOut: (req: Request, res: Response) => {
        res.clearCookie("token");
        res.redirect("/users/signIn");
    },

    sendFriendRequest: (req: Request, res: Response) => {
        const { friendId } = req.body;
        const { id } = req.user;
        const friendRequest: any = new FriendRequest({
            sender: id,
            receiver: friendId,
        });
        friendRequest
            .save()
            .then((friendRequest: any) => {
                res.send("Friend Request Sent");
            })
            .catch((err: Error) => {
                res.send(err);
            });
    },

    acceptFriendRequest: async (req: Request, res: Response) => {
    
        const { friendRequestId } = req.body;
        const { id } = req.user;
        // using transaction to make sure the friend request, friends list for both users are updated
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const friendRequest: any = await FriendRequest.findById(friendRequestId);
            if (!friendRequest) {
                throw new Error("Friend Request not found");
            }
            if (friendRequest.receiver != id) {
                throw new Error("You are not authorized to accept this friend request");
            }
            // add friend to both users friends list
            const friendsList1: any = await FriendsList.findOne({ user: friendRequest.sender });
            const friendsList2: any = await FriendsList.findOne({ user: friendRequest.receiver });
            friendsList1.friends.push(friendRequest.receiver);
            friendsList2.friends.push(friendRequest.sender);
            await friendsList1.save();
            await friendsList2.save();
            // delete friend request
            await friendRequest.delete();
            await session.commitTransaction();
            res.send("Friend Request Accepted");
        } catch (error) {
            await session.abortTransaction();
            res.send(error);
        } finally {
            session.endSession();
        }

    },

    rejectFriendRequest: async (req: Request, res: Response) => {
        try {
            const { friendRequestId } = req.body;
            const { id } = req.user;
            const friendRequest: any = await FriendRequest.findById(friendRequestId);
            if (!friendRequest) {
                return res.send("Friend Request not found");
            }
            if (friendRequest.receiver != id) {
                return res.send("You are not authorized to reject this friend request");
            }
            await FriendRequest.findByIdAndDelete(friendRequestId);
            res.send("Friend Request Rejected");
        } catch (error) {
            res.send(error);
        }
    },

    removeFriend: async(req: Request, res: Response) => {
        const { friendId } = req.body;
        const { id } = req.user;
        // using transaction to remove friend from both friends list
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const friendsList: any = await FriendsList.findOne({ user: id });
            if (!friendsList) {
                return res.send("You have no friends");
            }
            const friendIndex = friendsList.friends.indexOf(friendId);
            if (friendIndex == -1) {
                return res.send("Friend not found");
            }
            friendsList.friends.splice(friendIndex, 1);
            await friendsList.save({ session });
            const friendFriendsList: any = await FriendsList.findOne({ user: friendId });
            if (!friendFriendsList) {
                return res.send("Friend has no friends");
            }
            const friendFriendIndex = friendFriendsList.friends.indexOf(id);
            if (friendFriendIndex == -1) {
                return res.send("Friend not found");
            }
            friendFriendsList.friends.splice(friendFriendIndex, 1);
            await friendFriendsList.save({ session });
            await session.commitTransaction();
            res.send("Friend Removed");
        } catch (error) {
            await session.abortTransaction();
            res.send(error);
        } finally {
            session.endSession();
        }
    },

    getFriends: async (req: Request, res: Response) => {
        try {
            const { id } = req.user;
            const friendsList: any = await FriendsList.findOne({ user: id }).populate("friends");
            if (!friendsList) {
                return res.send("You have no friends");
            }
            res.send(friendsList.friends);
        } catch (error) {
            res.send(error);
        }
    },

    getFriendRequests: async (req: Request, res: Response) => {
        try {
            const { id } = req.user;
            const friendRequests: any = await FriendRequest.find({ receiver: id }).populate("sender");
            res.send(friendRequests);
        } catch (error) {
            res.send(error);
        }
    },

    declineFriendRequest: async (req: Request, res: Response) => {
        try {
            const { friendRequestId } = req.body;
            await FriendRequest.findByIdAndDelete(friendRequestId);
            res.send("Friend Request Declined");
        } catch (error) {
            res.send(error);
        }        
    },

    getMessages: (req: Request, res: Response) => {
        res.send("Hi there!");
    },

    sendMessage: (req: Request, res: Response) => {
        res.send("Hi there!");
    },

    getProfile: (req: Request, res: Response) => {
        res.send("Hi there!");
    },

    updateProfile: (req: Request, res: Response) => {
        res.send("Hi there!");
    },
};

export default controller;
