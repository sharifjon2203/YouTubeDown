import express from 'express';
import cors from 'cors';
import downloadRoutes from './routes/download.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins
app.use(cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', downloadRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('YouTube Downloader API is running');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});