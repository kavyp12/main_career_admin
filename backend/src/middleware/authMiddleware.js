"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        console.log('Token received:', token);
        if (!token) {
            console.log('No token provided');
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded successfully:', decoded);
        req.user = { userId: decoded.userId };
        next();
    }
    catch (error) {
        console.error('Token verification failed:', error);
        res.status(403).json({ message: 'Invalid token' });
    }
};
exports.verifyToken = verifyToken;
