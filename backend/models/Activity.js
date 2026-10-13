import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },

        actor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            default: null,
        },

        action: {
            type: String,
            required: true,
            enum: [
                "PROJECT_CREATED",
                "PROJECT_UPDATED",
                "MEMBER_ADDED",
                "TASK_CREATED",
                "TASK_UPDATED",
                "TASK_COMPLETED",
                "TASK_DELETED",
                "DEPENDENCY_UPDATED",
            ],
        },
        
        details: {
            type: String,
            trim: true,
            default: "",
        },
    },
    { timestamps: true }
);

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;
