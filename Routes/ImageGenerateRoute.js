import express from 'express';
const router = express.Router()

import ImageGenerateController from '../Controllers/ImageGenerateController.js'
import protect from '../middleware/authmiddleware.js'

router.post("/image-generate", protect, ImageGenerateController.generateImage);
router.get("/get-images/:id", protect, ImageGenerateController.getgeneratedImage);
router.delete("/delete-images/:id", protect, ImageGenerateController.DeletedGeneratedImages);

export default router