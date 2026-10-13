import express from "express";
import protect from "../middleware/auth.middleware.js";
import {
    createTask,
    getProjectTasks,
} from "../controllers/task.controller.js";

const router = express.Router();

router.use(protect);

router.post("/:projectId/tasks", createTask);
router.get("/:projectId/tasks", getProjectTasks);

export default router;
