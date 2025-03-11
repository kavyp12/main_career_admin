"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// E:\career-guide\backend\src\routes\marksRoutes.ts
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const Marks_1 = __importDefault(require("../models/Marks"));
const router = express_1.default.Router();
// GET /api/marks/marks - Fetch all marks for the user
router.get('/marks', authMiddleware_1.verifyToken, async (req, res) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const marks = await Marks_1.default.find({ userId: req.user.userId });
        res.status(200).json(marks);
    }
    catch (error) {
        console.error('Error fetching marks:', error);
        res.status(500).json({ error: 'Failed to fetch marks' });
    }
});
// POST /api/marks/bulk - Save or update multiple standards
router.post('/bulk', authMiddleware_1.verifyToken, async (req, res) => {
    try {
        const standards = req.body; // Array of { standard, subjects }
        if (!req.user?.userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        console.log('Received POST /api/marks/bulk with data:', standards); // Debugging log
        const operations = standards.map((entry) => Marks_1.default.updateOne({ userId: req.user?.userId, standard: entry.standard }, {
            $set: {
                subjects: entry.subjects,
                createdAt: new Date(),
            },
        }, { upsert: true } // Insert if not exists
        ));
        await Promise.all(operations);
        res.status(201).json({ message: 'All marks saved successfully' });
    }
    catch (error) {
        console.error('Error saving marks:', error);
        res.status(500).json({ error: 'Failed to save marks' });
    }
});
exports.default = router;
