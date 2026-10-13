import express from "express";
import protect from "../middleware/auth.middleware.js";
import { addProjectMember } from "../controllers/member.controller.js";

const router = express.Router();

router.use(protect);

router.post("/:projectId/members", addProjectMember);

export default router;
