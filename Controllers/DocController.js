import { GoogleGenerativeAI } from "@google/generative-ai";
import asyncHandler from "express-async-handler";
import AuthController from "./AuthController.js";
import http from "https";
import qs from "querystring";

import DocumentModel from "../Models/DocModel.js";

class GeminiApi extends AuthController {

    static generateDocumentation = asyncHandler(async (req, res) => {
        const { prompt } = req.body;

        if (!prompt) {
            res.status(401);
            throw new Error("Prompt is required");
        }

        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const modifiedPrompt = `Generate a detailed and clear documentation for the following code: \n\n${prompt}`;

            const result = await model.generateContent(modifiedPrompt);
            const generatedContent = result.response ? result.response.text() : "No content generated";

            const options = {
                method: "POST",
                hostname: "rimedia-paraphraser.p.rapidapi.com",
                port: null,
                path: "/api_paraphrase.php",
                headers: {
                    "x-rapidapi-key": process.env.REPHRASE_API,
                    "x-rapidapi-host": "rimedia-paraphraser.p.rapidapi.com",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            };

            const requestData = qs.stringify({
                text: generatedContent,
                lang: "en",
                paraphrase_capital: "true",
                protected: "YOUR;something",
            });

            const request = http.request(options, (response) => {
                const chunks = [];

                response.on("data", (chunk) => {
                    chunks.push(chunk);
                });

                response.on("end", async () => {
                    const body = Buffer.concat(chunks).toString();

                    try {
                        if (body.trim().startsWith("<")) {
                            throw new Error("Received HTML or bot detection response instead of JSON");
                        }

                        const parsedBody = JSON.parse(body);

                        const resultText = parsedBody.result || "No result available";

                        const rephrasedContent = resultText || "No rephrased content";

                        const cleanedRephrasedContent = rephrasedContent
                            .replace(/<del\b[^>]*>([\s\S]*?)<\/del>/g, "") 
                            .replace(/<\/?ins[^>]*>/g, "")               
                            .replace(/\*\*/g, "")
                            .replace(/\*/g, ""); 


                        const newDocument = new DocumentModel({
                            userId: req.user.id,
                            prompt: prompt,
                            generatedDocuments: generatedContent,
                            rephrasedContent: cleanedRephrasedContent,
                        });

                        await newDocument.save();

                        const response = this.generateResponse(
                            200,
                            'Document rephrased and saved successfully',
                            {
                                rephrasedContent: cleanedRephrasedContent,
                                generatedContent: generatedContent
                            }
                        );

                        return res.status(200).json(response)

                    }

                    catch (parseError) {
                        res.status(500);
                        throw new error("Error parsing rephrased content: " + parseError.message)
                    }
                });
            });

            request.write(requestData);
            request.end();

        }

        catch (error) {
            res.status(400);
            throw new Error("Error generating or rephrasing content: " + error.message);
        }
    });

    static getGeneratedDocumentation = asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(401);
                throw new Error('Given Id is not Valid');
            }

            const Documentation = await DocumentModel.find({ userId: id }).sort({ createdAt: -1 });

            if (!Documentation || Documentation.length === 0) {
                res.status(404);
                throw new Error('No Documentation found for this user');
            }

            let documentsArray = Documentation.map(doc => {
                const docTitle = doc.prompt || "Untitled";
                const docContent = doc.generatedDocuments || "No content available";
                const createdAt = new Date(doc.createdAt).toISOString();

                return {
                    title: docTitle,
                    createdAt: createdAt,
                    markdown: `## ${docTitle}\n**Created At:** ${createdAt}\n\n**Content:**\n${docContent}\n\n---\n\n`,
                    content: `${docTitle.toUpperCase()}\nCreated At: ${createdAt}\n\n${docContent}\n\n----------------------------\n\n`
                };
            });

            res.status(200).json({
                status: 200,
                message: 'Generated Documentation fetched successfully',
                documents: documentsArray
            });

        } catch (error) {
            res.status(400);
            throw new Error("Error fetching Documentation: " + error.message);
        }
    });

    static DeletedGeneratedContent = asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(401);
                throw new Error('Given Id is not a Valid')
            }

            const DeletedChatModel = await DocumentModel.deleteMany({ userId: id });

            if (DeletedChatModel.deletedCount === 0) {
                res.status(404);
                throw new Error('No documentation found for this user')
            }

            res.status(200).json(this.generateResponse(200, `${DeletedChatModel.deletedCount} documentation deleted successfully`))
        }

        catch (error) {
            res.status(400);
            throw new Error("Error fetching documentation: " + error.message);
        }
    });

}


export default GeminiApi;
