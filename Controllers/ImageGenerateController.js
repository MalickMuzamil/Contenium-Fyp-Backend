import asyncHandler from "express-async-handler";
import AuthController from "./AuthController.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Buffer } from 'buffer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import ImageModel from '../Models/ImageModel.js'

class ImageGenerateController extends AuthController {

    static generateImage = asyncHandler(async (req, res) => {
        const { prompt } = req.body;

        if (!prompt) {
            res.status(401);
            throw new Error("Prompt is required");
        }

        try {
            const imageResponse = await fetch(
                "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
                {
                    headers: {
                        Authorization: "Bearer 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",
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                    body: JSON.stringify({ inputs: prompt }),
                }
            );

            if (!imageResponse.ok) {
                throw new Error(`Failed to generate image: ${imageResponse.statusText}`);
            }

            const arrayBuffer = await imageResponse.arrayBuffer();
            const base64Image = Buffer.from(arrayBuffer).toString("base64");//Base64 me convert krrha hn..

            const fileName = `${Date.now()}-generated-image.png`;
            const uploadDir = path.join(__dirname, "../uploads");
            const filePath = path.join(uploadDir, fileName);

            // Upload ka Folder exist krta bhi ha?
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const imageBuffer = Buffer.from(base64Image, "base64");
            fs.writeFileSync(filePath, imageBuffer);
            const imageUrl = `/uploads/${fileName}`;

            const imageSavingURL = new ImageModel({
                userId: req.user.id,
                prompt: prompt,
                imageUrl: imageUrl,
            });

            await imageSavingURL.save();

            const response = this.generateResponse(
                200,
                'Image generated successfully',
                imageUrl
            );

            return res.status(200).json(response)

        }

        catch (error) {
            res.status(400);
            throw new error("An error occurred while generating the image", error.message)
        }
    });

    static getgeneratedImage = asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(401);
                throw new Error('Given Id is not a Valid')
            }

            const AllImages = await ImageModel.find({ userId: id }).sort({ createdAt: -1 });

            if (!AllImages || AllImages.length === 0) {
                res.status(404);
                throw new Error('No Image found for this user')
            }

            res.status(200).json(this.generateResponse(200, 'Generated AllImages fetched successfully', AllImages))

        }

        catch (error) {
            res.status(400);
            throw new error('An error occurred while fetching all the images for this user.', error.message)
        }
    });

    static DeletedGeneratedImages = asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(401);
                throw new Error('Given Id is not a Valid')
            }

            // Sari image mang lo db se del krne se phly take unlink krskn..
            const imageFiles = await ImageModel.find({ userId: id }).select('imageUrl');
            const DeletedImageModel = await ImageModel.deleteMany({ userId: id });

            if (DeletedImageModel.deletedCount === 0) {
                res.status(404);
                throw new Error('No Image found for this user')
            }

            const uploadDir = path.join(__dirname, '../uploads');

            imageFiles.forEach(image => {
                const filePath = path.join(uploadDir, image.imageUrl.replace('/uploads/', ''));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });

            res.status(200).json(this.generateResponse(200, `${DeletedImageModel.deletedCount} ${DeletedImageModel.deletedCount} Images deleted successfully, and files removed from the server.`))
        }

        catch (error) {
            res.status(400);
            throw new Error("Error fetching images: " + error.message);
        }
    });

}


export default ImageGenerateController;
