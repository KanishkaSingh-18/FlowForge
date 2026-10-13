import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const cookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
});

const sendUser = (res, user, statusCode = 200) => {
    const token = jwt.sign(
        { userId: user._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.cookie("flowforge_token", token, cookieOptions());

    return res.status(statusCode).json({
        success: true,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
        },
    });
};

export const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof email !== "string" ||
            !email.trim() ||
            typeof password !== "string" ||
            password.length < 8
        ) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required; password must be at least 8 characters",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
        });

        return sendUser(res, user, 201);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists",
            });
        }

        console.error("Signup error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to create account",
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase(),
        }).select("+password");

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        return sendUser(res, user);
    } catch (error) {
        console.error("Login error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to log in",
        });
    }
};

export const logout = (req, res) => {
    const { maxAge, ...clearOptions } = cookieOptions();

    res.clearCookie("flowforge_token", clearOptions);

    return res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
};

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account no longer exists",
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Get current user error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to retrieve current user",
        });
    }
};
