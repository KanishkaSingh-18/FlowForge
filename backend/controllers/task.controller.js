import mongoose from "mongoose";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Activity from "../models/Activity.js";

const isProjectMember = (project, userId) =>
    project.members.some(
        (member) => member.user.toString() === userId.toString()
    );

const isProjectOwner = (project, userId) =>
    project.owner.toString() === userId.toString();

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

        if (
            typeof title !== "string" ||
            !title.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Task title is required",
            });
        }

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

        if (!isProjectOwner(project, req.userId)) {
            return res.status(403).json({
                success: false,
                message: "Only the project owner can create tasks",
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
                (member) =>
                    member.user.toString() === assignedTo.toString()
            );

            if (!isAssigneeMember) {
                return res.status(400).json({
                    success: false,
                    message: "Assignee must be a project member",
                });
            }
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
            dueDate !== ""
        ) {
            if (
                typeof dueDate !== "string" ||
                Number.isNaN(Date.parse(dueDate))
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid due date",
                });
            }
        }

        if (
            manuallyBlocked !== undefined &&
            typeof manuallyBlocked !== "boolean"
        ) {
            return res.status(400).json({
                success: false,
                message: "manuallyBlocked must be a boolean",
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

        const uniqueDependencies = [
            ...new Set(
                taskDependencies.map((id) => id.toString())
            ),
        ];

        if (uniqueDependencies.length !== taskDependencies.length) {
            return res.status(400).json({
                success: false,
                message: "Duplicate dependencies are not allowed",
            });
        }

        if (uniqueDependencies.length > 0) {
            const dependencyTasks = await Task.find({
                _id: { $in: uniqueDependencies },
                project: project._id,
            }).select("_id");

            if (dependencyTasks.length !== uniqueDependencies.length) {
                return res.status(400).json({
                    success: false,
                    message: "Every dependency must belong to this project",
                });
            }
        }

        const task = await Task.create({
            title: title.trim(),
            description: description?.trim() ?? "",
            project: project._id,
            assignedTo: assignedTo || null,
            createdBy: req.userId,
            priority: selectedPriority,
            dueDate: dueDate || null,
            dependencies: uniqueDependencies,
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

        const enrichedTasks = tasks.map((task) => {
            const unfinishedDependencies = task.dependencies.filter(
                (dependency) => dependency.status !== "Done"
            );

            const isBlocked =
                task.manuallyBlocked ||
                unfinishedDependencies.length > 0;

            const isReadyToStart =
                task.status === "Todo" &&
                !task.manuallyBlocked &&
                unfinishedDependencies.length === 0;

            const isOverdue =
                task.status !== "Done" &&
                task.dueDate !== null &&
                task.dueDate !== undefined &&
                new Date(task.dueDate).getTime() < Date.now();

            return {
                ...task.toObject(),
                isBlocked,
                blockedBy: isBlocked
                    ? unfinishedDependencies.map((dependency) => ({
                        _id: dependency._id,
                        title: dependency.title,
                        status: dependency.status,
                    }))
                    : [],
                isReadyToStart,
                isOverdue,
            };
        });

        return res.status(200).json({
            success: true,
            count: enrichedTasks.length,
            tasks: enrichedTasks,
        });
    } catch (error) {
        console.error("Get project tasks error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve tasks",
        });
    }
};

export const getProjectDashboard = async (req, res) => {
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
            .select("status dueDate manuallyBlocked dependencies")
            .populate("dependencies", "status");

        const now = Date.now();

        const summary = {
            totalTasks: tasks.length,
            todo: 0,
            inProgress: 0,
            completed: 0,
            blocked: 0,
            readyToStart: 0,
            overdue: 0,
        };

        for (const task of tasks) {
            const unfinishedDependencies = task.dependencies.filter(
                (dependency) => dependency.status !== "Done"
            );

            const isBlocked =
                task.manuallyBlocked ||
                unfinishedDependencies.length > 0;

            const isReadyToStart =
                task.status === "Todo" &&
                !task.manuallyBlocked &&
                unfinishedDependencies.length === 0;

            const isOverdue =
                task.status !== "Done" &&
                task.dueDate != null &&
                new Date(task.dueDate).getTime() < now;

            if (task.status === "Todo") {
                summary.todo++;
            } else if (task.status === "In Progress") {
                summary.inProgress++;
            } else if (task.status === "Done") {
                summary.completed++;
            }

            if (isBlocked) {
                summary.blocked++;
            }

            if (isReadyToStart) {
                summary.readyToStart++;
            }

            if (isOverdue) {
                summary.overdue++;
            }
        }

        summary.completionRate =
            summary.totalTasks === 0
                ? 0
                : Math.round(
                    (summary.completed / summary.totalTasks) * 100
                );

        return res.status(200).json({
            success: true,
            project: {
                _id: project._id,
                name: project.name,
            },
            summary,
        });
    } catch (error) {
        console.error("Get project dashboard error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve project dashboard",
        });
    }
};

const wouldCreateDependencyCycle = async (
    taskId,
    dependencyIds,
    projectId
) => {
    const visited = new Set();

    const hasPathToTask = async (currentId) => {
        if (currentId.toString() === taskId.toString()) {
            return true;
        }

        if (visited.has(currentId.toString())) {
            return false;
        }

        visited.add(currentId.toString());

        const currentTask = await Task.findOne({
            _id: currentId,
            project: projectId,
        }).select("dependencies");

        if (!currentTask) {
            return false;
        }

        for (const dependencyId of currentTask.dependencies) {
            if (await hasPathToTask(dependencyId)) {
                return true;
            }
        }

        return false;
    };

    for (const dependencyId of dependencyIds) {
        if (await hasPathToTask(dependencyId)) {
            return true;
        }
    }

    return false;
};

export const updateTask = async (req, res) => {
    try {
        const { projectId, taskId } = req.params;

        const {
            title,
            description,
            assignedTo,
            status,
            priority,
            dueDate,
            manuallyBlocked,
            dependencies,
        } = req.body;

        if (
            !mongoose.isValidObjectId(projectId) ||
            !mongoose.isValidObjectId(taskId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid project or task ID",
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

        const task = await Task.findOne({
            _id: taskId,
            project: projectId,
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found in this project",
            });
        }

        const isOwner = isProjectOwner(project, req.userId);

        if (!isOwner) {
            const isAssignedMember =
                task.assignedTo?.toString() === req.userId.toString();

            if (!isAssignedMember) {
                return res.status(403).json({
                    success: false,
                    message: "You can only update tasks assigned to you",
                });
            }

            const submittedFields = Object.keys(req.body);

            const hasOnlyStatus =
                submittedFields.length === 1 &&
                submittedFields[0] === "status";

            if (!hasOnlyStatus) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Members can only update the status of their assigned tasks",
                });
            }
        }

        const updates = {};
        let dependencyChanged = false;

        if (title !== undefined) {
            if (typeof title !== "string" || !title.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Task title cannot be empty",
                });
            }

            updates.title = title.trim();
        }

        if (description !== undefined) {
            if (typeof description !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Description must be a string",
                });
            }

            updates.description = description.trim();
        }

        if (assignedTo !== undefined) {
            if (assignedTo === null || assignedTo === "") {
                updates.assignedTo = null;
            } else {
                if (!mongoose.isValidObjectId(assignedTo)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid assignee ID",
                    });
                }

                const isAssigneeMember = project.members.some(
                    (member) =>
                        member.user.toString() === assignedTo.toString()
                );

                if (!isAssigneeMember) {
                    return res.status(400).json({
                        success: false,
                        message: "Assignee must be a project member",
                    });
                }

                updates.assignedTo = assignedTo;
            }
        }

        if (status !== undefined) {
            const allowedStatuses = [
                "Todo",
                "In Progress",
                "Done",
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid task status",
                });
            }

            updates.status = status;
        }

        if (priority !== undefined) {
            const allowedPriorities = ["Low", "Medium", "High"];

            if (!allowedPriorities.includes(priority)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid task priority",
                });
            }

            updates.priority = priority;
        }

        if (dueDate !== undefined) {
            if (dueDate === null || dueDate === "") {
                updates.dueDate = null;
            } else {
                const parsedDate = new Date(dueDate);

                if (
                    typeof dueDate !== "string" ||
                    Number.isNaN(parsedDate.getTime())
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid due date",
                    });
                }

                updates.dueDate = parsedDate;
            }
        }

        if (manuallyBlocked !== undefined) {
            if (typeof manuallyBlocked !== "boolean") {
                return res.status(400).json({
                    success: false,
                    message: "manuallyBlocked must be a boolean",
                });
            }

            updates.manuallyBlocked = manuallyBlocked;
        }

        if (dependencies !== undefined) {
            if (!Array.isArray(dependencies)) {
                return res.status(400).json({
                    success: false,
                    message: "Dependencies must be an array",
                });
            }

            const dependencyIds = [];

            for (const dependencyId of dependencies) {
                if (!mongoose.isValidObjectId(dependencyId)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid dependency ID",
                    });
                }

                dependencyIds.push(dependencyId.toString());
            }

            const uniqueDependencyIds = [
                ...new Set(dependencyIds),
            ];

            if (uniqueDependencyIds.length !== dependencyIds.length) {
                return res.status(400).json({
                    success: false,
                    message: "Duplicate dependencies are not allowed",
                });
            }

            if (uniqueDependencyIds.includes(taskId.toString())) {
                return res.status(400).json({
                    success: false,
                    message: "A task cannot depend on itself",
                });
            }

            const dependencyTasks = await Task.find({
                _id: { $in: uniqueDependencyIds },
                project: projectId,
            }).select("_id status title");

            if (dependencyTasks.length !== uniqueDependencyIds.length) {
                return res.status(400).json({
                    success: false,
                    message:
                        "One or more dependencies do not exist in this project",
                });
            }

            const createsCycle = await wouldCreateDependencyCycle(
                taskId,
                uniqueDependencyIds,
                projectId
            );

            if (createsCycle) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Circular dependency detected. This update would create a dependency cycle.",
                });
            }

            const currentDependencies = task.dependencies
                .map((id) => id.toString())
                .sort();

            const nextDependencies = [...uniqueDependencyIds].sort();

            dependencyChanged =
                JSON.stringify(currentDependencies) !==
                JSON.stringify(nextDependencies);

            updates.dependencies = uniqueDependencyIds;
        }

        const effectiveStatus = updates.status ?? task.status;

        const effectiveDependencies =
            updates.dependencies ?? task.dependencies;

        const shouldCheckCompletion =
            effectiveStatus === "Done" &&
            (updates.status === "Done" || dependencyChanged);

        if (
            shouldCheckCompletion &&
            effectiveDependencies.length > 0
        ) {
            const prerequisiteTasks = await Task.find({
                _id: { $in: effectiveDependencies },
                project: projectId,
            }).select("title status");

            const unfinishedPrerequisites = prerequisiteTasks.filter(
                (prerequisite) => prerequisite.status !== "Done"
            );

            if (unfinishedPrerequisites.length > 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Cannot complete this task while its dependencies are unfinished",
                    blockedBy: unfinishedPrerequisites.map(
                        (prerequisite) => ({
                            id: prerequisite._id,
                            title: prerequisite.title,
                            status: prerequisite.status,
                        })
                    ),
                });
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid updates provided",
            });
        }

        const wasDone = task.status === "Done";

        Object.assign(task, updates);
        await task.save();

        let action = "TASK_UPDATED";

        if (!wasDone && task.status === "Done") {
            action = "TASK_COMPLETED";
        } else if (dependencyChanged) {
            action = "DEPENDENCY_UPDATED";
        }

        await Activity.create({
            project: project._id,
            actor: req.userId,
            task: task._id,
            action,
            details: `Updated task: ${task.title}`,
        });

        await task.populate([
            { path: "assignedTo", select: "name email" },
            { path: "createdBy", select: "name email" },
            { path: "dependencies", select: "title status" },
        ]);

        return res.status(200).json({
            success: true,
            message: "Task updated successfully",
            task,
        });
    } catch (error) {
        console.error("Update task error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update task",
        });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const { projectId, taskId } = req.params;

        if (
            !mongoose.isValidObjectId(projectId) ||
            !mongoose.isValidObjectId(taskId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid project or task ID",
            });
        }

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        if (!isProjectOwner(project, req.userId)) {
            return res.status(403).json({
                success: false,
                message: "Only the project owner can delete tasks",
            });
        }

        const task = await Task.findOne({
            _id: taskId,
            project: projectId,
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found in this project",
            });
        }

        const deletedTitle = task.title;

        await Task.updateMany(
            {
                project: projectId,
                dependencies: task._id,
            },
            {
                $pull: { dependencies: task._id },
            }
        );

        await task.deleteOne();

        await Activity.create({
            project: project._id,
            actor: req.userId,
            task: null,
            action: "TASK_DELETED",
            details: `Deleted task: ${deletedTitle}`,
        });

        return res.status(200).json({
            success: true,
            message: "Task deleted successfully",
        });
    } catch (error) {
        console.error("Delete task error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to delete task",
        });
    }
};
