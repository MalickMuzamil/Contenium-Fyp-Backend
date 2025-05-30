import asyncHandler from "express-async-handler";
import AuthController from './AuthController.js';
import path from 'path';
import { fileURLToPath } from "url";
import fs from "fs";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import bcrypt from 'bcryptjs';

import User from '../Models/UserModel.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


class ResetPassword extends AuthController {
    static resetpassword = asyncHandler(async (req, res) => {
        try {
            const { email } = req.body;

            if (!email) {
                res.status(401);
                throw new Error("Email is required");
            }

            const user = await User.findOne({ email: email.toLowerCase() });

            if (!user) {
                return res.status(404).json(this.generateResponse(400, 'User Not Found'));
            }

            const token = this.generateToken(user._id)

            const resetLink = `http://websites-page/update-password?token=${token}`; //Contenium's page link where to navigate

            const templatePath = path.join(__dirname, "..", "helper", "template.html");
            let template = fs.readFileSync(templatePath, "utf-8");

            const emailSubject = "Reset Your Password";
            const emailBody = "We have received a request to reset your password. Click the link below to reset it.";

            template = template.replace(/{{email_subject}}/g, emailSubject);
            template = template.replace(/{{email_body}}/g, emailBody);
            template = template.replace(/{{resetLink}}/g, resetLink);

            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.NodeMailer_API,
                    pass: "oikgazuzdcmllowx",
                },
            });

            const mailOptions = {
                from: "bcsm-f21-178@superior.edu.pk",
                to: email,
                subject: emailSubject,
                html: template,
            };

            await transporter.sendMail(mailOptions);
            console.log('Reset password email sent to:', email);


            res.status(200).json(this.generateResponse(200, "Reset password email sent successfully"));
        }

        catch (error) {
            console.error("Error in Reset-Password Controller:", error.message);

            res.status(400);
            throw new Error("Reset-Password Controller not working");
        }
    });

    static updatepassword = asyncHandler(async (req, res) => {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return res.status(401).json({ message: 'Token and new password are required' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            user.password = hashedPassword;
            await user.save();
            return res.status(200).json(this.generateResponse(200, 'Password Updated Successfully.'));
        }

        catch (error) {
            console.log(error.message)
            res.status(400);
            throw new Error("Password Not Updated");
        }
    })

}

export default ResetPassword;
