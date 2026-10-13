import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
    const token = req.cookies?.flowforge_token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Authentication required",
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired session",
        });
    }
};

export default protect;