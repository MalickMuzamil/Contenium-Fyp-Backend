import express from "express";
const router = express.Router();

import ResetPassword from "../Controllers/ResetPasswordController.js";

router.post("/reset-password", ResetPassword.resetpassword);
router.post("/update-passsword", ResetPassword.updatepassword)

export default router;
