import Project from "../models/Project.js";
import User from "../models/User.js";

export const addProjectMember = async (req, res) => {
    try {
        const { email } = req.body;
        const { projectId } = req.params;

        if (typeof email !== "string" || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Member email is required",
            });
        }

        const project = await Project.findOne({
            _id: projectId,
            owner: req.userId,
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found or you are not the owner",
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase(),
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No registered user found with this email",
            });
        }

        const alreadyMember = project.members.some(
            (member) => member.user.toString() === user._id.toString()
        );

        if (alreadyMember) {
            return res.status(409).json({
                success: false,
                message: "User is already a project member",
            });
        }

        project.members.push({
            user: user._id,
            role: "member",
        });

        await project.save();

        await project.populate("members.user", "name email");

        return res.status(200).json({
            success: true,
            message: "Member added successfully",
            members: project.members,
        });
    } catch (error) {
        const status = error.name === "CastError" ? 400 : 500;

        console.error("Add project member error:", error.message);

        return res.status(status).json({
            success: false,
            message:
                status === 400
                    ? "Invalid project ID"
                    : "Unable to add project member",
        });
    }
};
