import express from "express";
import { registerUser, loginUser, getUserById } from "../controllers/userController.js";

const router = express.Router();

router.post("/register", registerUser); //register route
router.post("/login", loginUser); //  new login route
router.get("/:id", getUserById);

export default router;
