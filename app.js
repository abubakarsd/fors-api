// app.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());
app.use(cors()); // Enable CORS for all routes

// Logging Middleware
app.use(morgan('dev'));

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Dynamic Port Configuration
// This is already handled by process.env.PORT or the fallback 3000

// Routes - structured by feature/entity
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/permissions', require('./routes/permissionRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/farmers', require('./routes/farmerRoutes'));
app.use('/api/farmer-types', require('./routes/farmerTypeRoutes'));
app.use('/api/quarters', require('./routes/quarterRoutes'));
app.use('/api/chats', require('./routes/chatRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes')); // For dashboard summary stats
app.use('/api/data-analysis', require('./routes/dataAnalysisRoutes')); // For reporting and analysis

// Welcome Route
app.get('/', (req, res) => {
    res.send('Welcome to the FORS API!');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

app.listen(PORT, () => {
    console.log(`FORS API listening on port ${PORT}`);
});