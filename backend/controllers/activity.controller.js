import mongoose from "mongoose";
import Project from "../models/Project.js";
import Activity from "../models/Activity.js";

export const getProjectActivities = async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!mongoose.isValidObjectId(projectId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID",
            });
        }

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        const isMember = project.members.some(
            (member) =>
                member.user.toString() === req.userId.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this project",
            });
        }

        const activities = await Activity.find({
            project: projectId,
        })
            .populate("actor", "name email")
            .populate("task", "title status")
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return res.status(200).json({
            success: true,
            count: activities.length,
            activities,
        });
    } catch (error) {
        console.error("Get project activities error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve project activities",
        });
    }
};