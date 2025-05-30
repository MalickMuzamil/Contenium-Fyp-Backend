import express from 'express';
const router = express.Router()

import GeminiApi from '../Controllers/GeminiApi.js'
import protect from '../middleware/authmiddleware.js'

router.post("/content", protect, GeminiApi.generateContent);
router.get("/get-chat/:id", protect, GeminiApi.getGeneratedContent);
router.delete("/delete-chat/:id", protect, GeminiApi.DeletedGeneratedContent);

export default router