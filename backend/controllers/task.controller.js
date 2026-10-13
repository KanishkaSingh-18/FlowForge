import mongoose from "mongoose";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Activity from "../models/Activity.js";

const isProjectMember = (project, userId) =>
    project.members.some(
        (member) => member.user.toString() === userId.toString()
    );

export const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            assignedTo,
            priority,
            dueDate,
            dependencies,
            manuallyBlocked,
        } = req.body;

        const { projectId } = req.params;

        if (typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Task title is required",
            });
        }

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        if (!isProjectMember(project, req.userId)) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this project",
            });
        }

        if (
            assignedTo !== undefined &&
            assignedTo !== null &&
            assignedTo !== ""
        ) {
            if (!mongoose.isValidObjectId(assignedTo)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid assignee ID",
                });
            }

            const isAssigneeMember = project.members.some(
                (member) => member.user.toString() === assignedTo
            );

            if (!isAssigneeMember) {
                return res.status(400).json({
                    success: false,
                    message: "Assignee must be a project member",
                });
            }
        }

        const allowedPriorities = ["Low", "Medium", "High"];
        const selectedPriority = priority ?? "Medium";

        if (!allowedPriorities.includes(selectedPriority)) {
            return res.status(400).json({
                success: false,
                message: "Priority must be Low, Medium, or High",
            });
        }

        if (
            dueDate !== undefined &&
            dueDate !== null &&
            dueDate !== "" &&
            Number.isNaN(Date.parse(dueDate))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid due date",
            });
        }

        const taskDependencies = dependencies ?? [];

        if (
            !Array.isArray(taskDependencies) ||
            taskDependencies.some(
                (id) => !mongoose.isValidObjectId(id)
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Dependencies must be an array of valid task IDs",
            });
        }

        if (manuallyBlocked !== undefined &&
            typeof manuallyBlocked !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "manuallyBlocked must be a boolean",
            });
        }

        const uniqueDependencies = [...new Set(taskDependencies)];

        if (uniqueDependencies.length !== taskDependencies.length) {
            return res.status(400).json({
                success: false,
                message: "Duplicate dependencies are not allowed",
            });
        }

        const task = await Task.create({
            title: title.trim(),
            description: description ?? "",
            project: project._id,
            assignedTo: assignedTo || null,
            createdBy: req.userId,
            priority: selectedPriority,
            dueDate: dueDate || null,
            dependencies: [],
            manuallyBlocked: manuallyBlocked ?? false,
        });

        await Activity.create({
            project: project._id,
            actor: req.userId,
            task: task._id,
            action: "TASK_CREATED",
            details: `Created task: ${task.title}`,
        });

        return res.status(201).json({
            success: true,
            task,
        });
    } catch (error) {
        console.error("Create task error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to create task",
        });
    }
};

export const getProjectTasks = async (req, res) => {
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

        if (!isProjectMember(project, req.userId)) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this project",
            });
        }

        const tasks = await Task.find({ project: projectId })
            .populate("assignedTo", "name email")
            .populate("createdBy", "name email")
            .populate("dependencies", "title status");

        return res.status(200).json({
            success: true,
            count: tasks.length,
            tasks,
        });
    } catch (error) {
        console.error("Get project tasks error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve tasks",
        });
    }
};
