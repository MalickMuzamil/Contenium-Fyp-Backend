import { GoogleGenerativeAI } from "@google/generative-ai";
import asyncHandler from "express-async-handler";
import AuthController from "./AuthController.js";
import http from "https";
import qs from "querystring";

import ChatModel from "../Models/ChatModel.js";

class GeminiApi extends AuthController {

    static generateContent = asyncHandler(async (req, res) => {
        const { prompt } = req.body;
    
        if (!prompt) {
            res.status(401);
            throw new Error("Prompt is required");
        }
    
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
            const result = await model.generateContent(prompt);
            const generatedContent = result.response ? result.response.text() : "No content generated";
            
            console.log("Generated Content: ", generatedContent);
    
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
                    console.log("Received response from paraphrasing API: ", body);
    
                    try {
                        const parsedBody = JSON.parse(body);
                        if (parsedBody.message && parsedBody.message.includes("You have exceeded the DAILY quota")) {
                            res.status(400).json({
                                message: "Quota exceeded for the paraphrasing API. Please try again later.",
                                error: parsedBody.message
                            });
                        }
                        
                        if (!parsedBody.result) {
                            throw new Error("No result field in response from paraphrasing API");
                        }
    
                        const resultText = parsedBody.result || "No result available";
                        // console.log("Rephrased Content: ", resultText);
    
                        const rephrasedContent = resultText || "No rephrased content";
    
                        const cleanedRephrasedContent = rephrasedContent
                            .replace(/<del\b[^>]*>([\s\S]*?)<\/del>/g, "")
                            .replace(/<\/?ins[^>]*>/g, "")
                            .replace(/\*\*/g, "")
                            .replace(/\*/g, "");
    
                        console.log("Cleaned Rephrased Content: ", cleanedRephrasedContent);
    
                        const newChat = new ChatModel({
                            userId: req.user.id,
                            prompt: prompt,
                            generatedContent: generatedContent,
                            rephrasedContent: cleanedRephrasedContent,
                        });
    
                        await newChat.save();
    
                        const response = this.generateResponse(
                            200,
                            "Content rephrased and saved successfully",
                            {
                                rephrasedContent: cleanedRephrasedContent,
                                generatedContent: generatedContent,
                            }
                        );
    
                        return res.status(200).json(response);
                    } 
                    
                    catch (parseError) {
                        console.error("Error parsing rephrased content: ", parseError.message);
                        res.status(400);
                        throw new Error("Error parsing rephrased content: " + parseError.message);
                    }
                });
            });
    
            // Send the request with data to paraphrase
            request.write(requestData);
            request.end();
    
        } catch (error) {
            console.error("Error generating or rephrasing content: ", error.message);
            res.status(400);
            throw new Error("Error generating or rephrasing content: " + error.message);
        }
    });

    static getGeneratedContent = asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;
    
            if (!id) {
                res.status(401);
                throw new Error('Given Id is not valid');
            }
    
            const Chats = await ChatModel.find({ userId: id }).sort({ createdAt: -1 });
    
            if (!Chats || Chats.length === 0) {
                res.status(404);
                throw new Error('No Chats found for this user');
            }
    
            const AllChats = Chats.map(chat => ({
                _id: chat._id,
                userId: chat.userId,
                prompt: chat.prompt,
                generatedContent: chat.generatedContent,
                rephrasedContent: chat.rephrasedContent,
                createdAt: chat.createdAt,
                updatedAt: chat.updatedAt,
                __v: chat.__v,
                markdown: {
                    title: chat.prompt, 
                    content: chat.generatedContent, 
                    rephrased: chat.rephrasedContent, 
                }
            }));
    
            res.status(200).json(this.generateResponse(200, 'Generated content fetched successfully', AllChats));
        } 
        
        catch (error) {
            res.status(400);
            throw new Error("Error fetching content: " + error.message);
        }
    });

    static DeletedGeneratedContent = asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(401);
                throw new Error('Given Id is not a Valid')
            }

            const DeletedChatModel = await ChatModel.deleteMany({ userId: id });

            if (DeletedChatModel.deletedCount === 0) {
                res.status(404);
                throw new Error('No Chats found for this user')
            }

            res.status(200).json(this.generateResponse(200, `${DeletedChatModel.deletedCount} chats deleted successfully`))
        }

        catch (error) {
            res.status(400);
            throw new Error("Error fetching content: " + error.message);
        }
    });

}


export default GeminiApi;
