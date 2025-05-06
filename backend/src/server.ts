import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import questionnaireRoutes from './routes/questionnaireRoutes';
import marksRoutes from './routes/marksRoutes';
import fileRoute from './routes/fileRoute';
import path from 'path';

dotenv.config();

const app = express();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Configure CORS with specific options for your domains
const corsOptions = {
  origin: [
    'https://careerguide.enhc.tech',
    'https://www.careerguide.enhc.tech',
    'https://admin.enhc.tech',
    // Include development domains if needed
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  credentials: true,
  maxAge: 86400 // Cache preflight results for 24 hours
};

// Apply CORS middleware with options
app.use(cors(corsOptions));

// Ensure OPTIONS requests are handled correctly
app.options('*', cors(corsOptions));

// Additional headers middleware to ensure proper CORS
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin as string;
  if (origin && corsOptions.origin.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the Uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../Uploads/Resources')));

// Log all incoming requests for debugging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`Received ${req.method} request to ${req.path}`);
  if (req.headers.origin) {
    console.log(`Origin: ${req.headers.origin}`);
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questionnaire', questionnaireRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/files', fileRoute);

// Health check route
app.get('/', (req: Request, res: Response) => {
  res.send('Server is running');
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;