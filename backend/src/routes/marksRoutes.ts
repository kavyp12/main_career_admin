// E:\career-guide\backend\src\routes\marksRoutes.ts
import express from 'express';
import { verifyToken, AuthRequest } from '../middleware/authMiddleware';
import Marks from '../models/Marks';
import { Response } from 'express';

const router = express.Router();

// GET /api/marks/marks - Fetch all marks for the user
router.get('/marks', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    const marks = await Marks.find({ userId: req.user.userId });
    res.status(200).json(marks);
  } catch (error) {
    console.error('Error fetching marks:', error);
    res.status(500).json({ error: 'Failed to fetch marks' });
  }
});

// POST /api/marks/bulk - Save or update multiple standards
router.post('/bulk', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const standards = req.body; // Array of { standard, subjects }
    if (!req.user?.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    console.log('Received POST /api/marks/bulk with data:', standards); // Debugging log

    const operations = standards.map((entry: { standard: number; subjects: any[] }) =>
      Marks.updateOne(
        { userId: req.user?.userId, standard: entry.standard },
        {
          $set: {
            subjects: entry.subjects,
            createdAt: new Date(),
          },
        },
        { upsert: true } // Insert if not exists
      )
    );

    await Promise.all(operations);
    res.status(201).json({ message: 'All marks saved successfully' });
  } catch (error) {
    console.error('Error saving marks:', error);
    res.status(500).json({ error: 'Failed to save marks' });
  }
});

export default router;