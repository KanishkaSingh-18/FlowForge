import express from "express";
import protect from "../middleware/auth.middleware.js";
import {
    createTask,
    getProjectTasks,
    updateTask,
    deleteTask
} from "../controllers/task.controller.js";

const router = express.Router();

router.use(protect);

router.post("/:projectId/tasks", createTask);
router.get("/:projectId/tasks", getProjectTasks);
router.patch("/:projectId/tasks/:taskId", updateTask);
router.delete("/:projectId/tasks/:taskId", deleteTask);

export default router;
