import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },

        description: {
            type: String,
            trim: true,
            default: "",
            maxlength: 1000,
        },

        type: {
            type: String,
            enum: ["solo", "team"],
            default: "solo",
            required: true,
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        members: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                role: {
                    type: String,
                    enum: ["owner", "member"],
                    default: "member",
                },
            },
        ],
    },
    { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
