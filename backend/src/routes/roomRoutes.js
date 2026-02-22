import express from "express";
import { createRoom, joinRoom, getRoomStatus, startRoomGame  } from "../controllers/roomController.js";

const router = express.Router();

router.post("/create", createRoom);
router.post("/join/:code", joinRoom);
router.get("/status/:code", getRoomStatus);
router.post("/start/:code", startRoomGame);
export default router;
