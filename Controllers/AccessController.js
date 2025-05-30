import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";

import AuthController from "./AuthController.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

import User from "../Models/UserModel.js";
import RoleModel from "../Models/RoleModel.js";

class AccessController extends AuthController {
    static ApiWorking = asyncHandler(async (req, res) => {
        try {
            res.status(200).json(this.generateResponse(200, "Api Working"));
        } catch (error) {
            res.status(400);
            throw new Error("Api not working");
        }
    });

    static validate = asyncHandler(async (req, res) => {
        let token;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            try {
                // Get token from header
                token = req.headers.authorization.split(" ")[1];
                // Verify token
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                res
                    .status(200)
                    .json(this.generateResponse(200, "Validated", decoded, token));
            }
            catch (error) {
                res.status(401);
                throw new Error("Authorization Token Not Valid");
            }
        }
        if (!token) {
            res.status(401);
            throw new Error("Authorization Token Not Present");
        }
    });

    static signup = asyncHandler(async (req, res) => {
        try {
            const { first_name, last_name, email, password, phonenumber } = req.body;

            if (!first_name || !last_name || !email || !password || !phonenumber) {
                res.status(400);
                throw new Error("Important Fields are required.");
            }

            const userExists = await User.findOne({ email: email.toLowerCase(), is_deleted: false });

            if (userExists) {
                console.log(userExists);
                res.status(409);
                throw new Error("User already exists with this email");
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUser = await User.create({
                first_name,
                last_name,
                email: email.toLowerCase(),
                password: hashedPassword,
                phonenumber,
            });

            try {
                await RoleModel.create({
                    userId: newUser._id,
                    role: "AI-User",
                });
            }

            catch (err) {
                res.status(400);
                throw new Error("Failed to assign role");
            }

            const token = this.generateToken(newUser._id);
            const response = this.generateResponse(201, "Signup successful", newUser, token);

            return res.status(201).json(response);
        }
        catch (error) {
            res.status(res.statusCode && res.statusCode !== 200 ? res.statusCode : 400);
            throw new Error(error.message);
        }
    });

    static login = asyncHandler(async (req, res) => {
        try {
            const { email, password } = req.body;
            let user = await User.findOne({
                email: email.toLowerCase(),
                is_deleted: false,
            });

            if (!user) {
                res.status(404);
                throw new Error("User not found or has been deleted");
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                res.status(403);
                throw new Error("Invalid password");
            }

            let role = await RoleModel.findOne({ userId: user._id });

            if (!role) {
                res.status(404);
                throw new Error("Role not found for the user");
            }

            const token = this.generateToken(user._id)

            const response = this.generateResponse(
                200,
                "Login successful",
                {
                    ...user.toObject(),
                    role: role.role
                },
                token
            );
            return res.status(200).json(response);
        }

        catch (error) {
            res.status(400);
            throw new Error(error);
        }
    });

    static googleSignUp = asyncHandler(async (req, res) => {
        try {
            const { idToken } = req.body;

            if (!idToken) {
                res.status(400)
                throw new Error('Google ID Token is required');
            }

            const ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            const { email, given_name, family_name, picture } = payload;

            let user = await User.findOne({ email });

            if (!user) {
                user = await User.create({
                    first_name: given_name,
                    last_name: family_name,
                    email,
                    password: null,
                    phonenumber: "",
                    profileImage: picture,
                });

                await RoleModel.create({
                    userId: user._id,
                    role: "AI-User",
                });
            }

            const token = this.generateToken(user._id);

            return res.status(200).json({
                message: "Login successful",
                user: {
                    ...user.toObject(),
                    token,
                },
            });

        }
        catch (error) {
            res.status(400);
            throw new Error("Google login failed: " + error.message);
        }
    });

    static googleSignIn = asyncHandler(async (req, res) => {
        try {
            const { idToken } = req.body;

            if (!idToken) {
                res.status(400);
                throw new Error('Google ID Token is required');
            }
            const ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            const { email, given_name, family_name, picture } = payload;

            let user = await User.findOne({ email });

            if (!user) {
                res.status(400);
                throw new Error('User not found. Please sign up first.');
            }
    

            const token = this.generateToken(user._id);

            return res.status(200).json({
                message: "Login successful",
                user: {
                    ...user.toObject(),
                    token,
                },
            });

        }
        catch (error) {
            res.status(400);
            throw new Error("Google login failed: " + error.message);
        }
    });

}

export default AccessController;
