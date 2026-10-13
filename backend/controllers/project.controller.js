import Project from "../models/Project.js";

export const createProject = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Project name is required",
            });
        }

        const project = await Project.create({
            name: name.trim(),
            description: description || "",
            owner: req.userId,
            members: [{ user: req.userId, role: "owner" }],
        });

        return res.status(201).json({ success: true, project });
    } catch (error) {
        console.error("Create project error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to create project",
        });
    }
};

export const getProjects = async (req, res) => {
    try {
        const projects = await Project.find({
            "members.user": req.userId,
        })
            .populate("owner", "name email")
            .populate("members.user", "name email")
            .sort({ updatedAt: -1 });

        return res.status(200).json({ success: true, projects });
    } catch (error) {
        console.error("Get projects error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to retrieve projects",
        });
    }
};

export const getProjectById = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.projectId,
            "members.user": req.userId,
        })
            .populate("owner", "name email")
            .populate("members.user", "name email");

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        return res.status(200).json({ success: true, project });
    } catch (error) {
        const status = error.name === "CastError" ? 400 : 500;

        return res.status(status).json({
            success: false,
            message: status === 400
                ? "Invalid project ID"
                : "Unable to retrieve project",
        });
    }
};

export const updateProject = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (
            name !== undefined &&
            (typeof name !== "string" || !name.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Project name cannot be empty",
            });
        }

        if (
            description !== undefined &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Description must be a string",
            });
        }

        const updates = {};

        if (name !== undefined) updates.name = name.trim();
        if (description !== undefined) updates.description = description;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid updates provided",
            });
        }

        const project = await Project.findOneAndUpdate(
            {
                _id: req.params.projectId,
                owner: req.userId,
            },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found or you are not the owner",
            });
        }

        return res.status(200).json({ success: true, project });
    } catch (error) {
        const status = error.name === "CastError" ? 400 : 500;

        return res.status(status).json({
            success: false,
            message: status === 400
                ? "Invalid project ID"
                : "Unable to update project",
        });
    }
};

export const deleteProject = async (req, res) => {
    try {
        const project = await Project.findOneAndDelete({
            _id: req.params.projectId,
            owner: req.userId,
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found or you are not the owner",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Project deleted successfully",
        });
    } catch (error) {
        const status = error.name === "CastError" ? 400 : 500;

        return res.status(status).json({
            success: false,
            message: status === 400
                ? "Invalid project ID"
                : "Unable to delete project",
        });
    }
};
