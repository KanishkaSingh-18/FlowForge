import express from "express";
import protect from "../middleware/auth.middleware.js";
import { getProjectActivities } from "../controllers/activity.controller.js";

const router = express.Router();

router.use(protect);

router.get("/:projectId/activities", getProjectActivities);

export default router;