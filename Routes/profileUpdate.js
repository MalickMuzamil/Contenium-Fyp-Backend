import express from 'express';
const router = express.Router()

import ProfileUpdate from '../Controllers/ProfileUpdate.js';
import protect from '../middleware/authmiddleware.js';

router.patch("/:id", protect,  ProfileUpdate.updateProfile);

export default router