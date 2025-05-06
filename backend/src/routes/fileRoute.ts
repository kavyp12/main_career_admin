import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import cors from 'cors';
import { verifyToken, AuthRequest } from '../middleware/authMiddleware';
import User from '../models/User';

const router = express.Router();

// Configure CORS specifically for file routes
const corsOptions = {
  origin: [
    'https://careerguide.enhc.tech',
    'https://www.careerguide.enhc.tech',
    'https://admin.enhc.tech',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
};

router.use(cors(corsOptions));

// Handle OPTIONS requests explicitly for the upload route
router.options('/upload-report/:userId', cors(corsOptions));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../Uploads/Resources');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, uploadDir);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only PDF, DOC, DOCX, TXT, JPG, JPEG, and PNG files are allowed') as any);
    }
  }
});

// Log middleware for debugging file uploads
const logRequest = (req: Request, res: Response, next: NextFunction) => {
  console.log(`File upload request received for userId: ${req.params.userId}`);
  console.log(`Headers: ${JSON.stringify(req.headers)}`);
  if (req.headers.authorization) {
    console.log(`Token: ${req.headers.authorization.replace('Bearer ', '')}`);
  }
  next();
};

// Upload report for a specific student
router.post(
  '/upload-report/:userId',
  cors(corsOptions), // Apply CORS to this specific route
  logRequest,
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    // Handle specific CORS headers for this route
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Continue to upload handling
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ 
          message: err.message || 'File upload error', 
          error: err 
        });
      }
      next();
    });
  },
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded or invalid file type' });
        return;
      }

      const { userId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ message: 'Invalid user ID' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: 'Student not found' });
        return;
      }

      // Update user with file information
      user.reportPath = req.file.filename;
      user.status = 'Report Generated';
      user.reportUploadedAt = new Date();
      user.updatedAt = new Date();
      await user.save();

      // Send success response
      res.status(200).json({
        message: 'Report uploaded successfully',
        report: {
          fileName: req.file.originalname,
          filePath: req.file.filename,
          uploadedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Report upload error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Server error',
        error: error
      });
    }
  }
);

// Download file route (restrict to student's own report)
router.get('/download/:filePath', cors(corsOptions), verifyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const filePath = path.join(__dirname, '../../Uploads/Resources', req.params.filePath);
    const user = await User.findById(req.user.userId);

    if (!user || (user.reportPath !== req.params.filePath)) {
      res.status(403).json({ message: 'You are not authorized to access this file' });
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'File not found' });
      return;
    }

    res.download(filePath, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ message: 'Error downloading file' });
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Server error' });
    next(error);
  }
});

export default router;