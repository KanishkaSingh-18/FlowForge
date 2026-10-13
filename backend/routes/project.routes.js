import express from "express";
import protect from "../middleware/auth.middleware.js";
import {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
} from "../controllers/project.controller.js";

const router = express.Router();

router.use(protect);

router.post("/", createProject);
router.get("/", getProjects);
router.get("/:projectId", getProjectById);
router.patch("/:projectId", updateProject);
router.delete("/:projectId", deleteProject);

export default router;
