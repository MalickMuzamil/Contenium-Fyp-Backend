import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";

import AuthController from "./AuthController.js";

import User from "../Models/UserModel.js";

class ProfileUpdate extends AuthController {
    static updateProfile = asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;
            const { action, password, newPassword, name, address, zipcode, city, country, phonenumber } = req.body;

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (action === "updateCredentials") {
                if (address || zipcode || city || country || phonenumber) {
                    res.status(405);
                    throw new Error("Personal information fields (address, zipcode, city, country, phonenumber) cannot be updated with updateCredentials action");
                }

                if (!password || !newPassword) {
                    res.status(401);
                    throw new Error("Current password and new password are required for updating credentials");
                }

                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid) {
                    res.status(403);
                    throw new Error("Current password is invalid");
                }

                user.password = await bcrypt.hash(newPassword, 10);

                if (name) {
                    user.name = name;
                }

                await user.save();

                return res.status(200).json(this.generateResponse(200, "User credentials updated successfully", user));
            }

            else if (action === "updatePersonalInfo") {
                if (password || newPassword || name) {
                    res.status(405);
                    throw new Error("Password and name cannot be updated with updatePersonalInfo action");
                }

                const updateData = {
                    "meta.address": address || user.meta?.address,
                    "meta.zipcode": zipcode || user.meta?.zipcode,
                    "meta.city": city || user.meta?.city,
                    "meta.country": country || user.meta?.country,
                    "meta.phonenumber": phonenumber || user.meta?.phonenumber,
                };

                if (imagePath) {
                    updateData["meta.image"] = imagePath;
                }

                const updatedUser = await User.findByIdAndUpdate(
                    id,
                    { $set: updateData },
                    { new: true }
                );

                return res.status(200).json(this.generateResponse(200, "User personal information updated successfully", updatedUser));
            }

            else if (action === "updateImage") {
                if (password || newPassword || name || address || zipcode || city || country || phonenumber) {
                    res.status(405);
                    throw new Error("Credentials and personal information fields cannot be updated with updateImage action");
                }

                const file = req.file;
                if (!file) {
                    res.status(401);
                    throw new Error("No image file uploaded");
                }

                console.log("File uploaded:", file.filename);
                const imagePath = "uploads/" + file.filename;

                const updatedUser = await User.findByIdAndUpdate(
                    id,
                    { $set: { "meta.image": imagePath } },
                    { new: true }
                );

                return res.status(200).json(this.generateResponse(200, "User image updated successfully", updatedUser));
            }

            else {
                res.status(400);
                throw new Error("Invalid action. Please provide a valid action.");
            }

        }

        catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
    });
}


export default ProfileUpdate;