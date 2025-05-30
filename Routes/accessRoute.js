import express from "express";
const router = express.Router();

import AccessController from "../Controllers/AccessController.js";

router.get("/", AccessController.ApiWorking);
router.get("/validate", AccessController.validate);
router.post("/login", AccessController.login);
router.post("/signup", AccessController.signup);
router.post("/Google-SignUp", AccessController.googleSignUp);
router.post("/Google-SignIn", AccessController.googleSignIn);

export default router;
