"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const questionnaireRoutes_1 = __importDefault(require("./routes/questionnaireRoutes"));
const marksRoutes_1 = __importDefault(require("./routes/marksRoutes"));
const fileRoute_1 = __importDefault(require("./routes/fileRoute"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Connect to MongoDB
mongoose_1.default
    .connect(process.env.MONGO_URI)
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
app.use((0, cors_1.default)(corsOptions));
// Ensure OPTIONS requests are handled correctly
app.options('*', (0, cors_1.default)(corsOptions));
// Additional headers middleware to ensure proper CORS
app.use((req, res, next) => {
    const origin = req.headers.origin;
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
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files from the Uploads directory
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../Uploads/Resources')));
// Log all incoming requests for debugging
app.use((req, res, next) => {
    console.log(`Received ${req.method} request to ${req.path}`);
    if (req.headers.origin) {
        console.log(`Origin: ${req.headers.origin}`);
    }
    next();
});
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/questionnaire', questionnaireRoutes_1.default);
app.use('/api/marks', marksRoutes_1.default);
app.use('/api/files', fileRoute_1.default);
// Health check route
app.get('/', (req, res) => {
    res.send('Server is running');
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
});
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
exports.default = app;
