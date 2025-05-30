import express from 'express';
const router = express.Router()

import documentation from '../Controllers/DocController.js'
import protect from '../middleware/authmiddleware.js'

router.post("/documentation", protect, documentation.generateDocumentation);
router.get("/get-documentation/:id", protect, documentation.getGeneratedDocumentation);
router.delete("/delete-documentation/:id", protect, documentation.DeletedGeneratedContent);

export default router