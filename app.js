const dotenv = require('dotenv');
dotenv.config();

// Debug logging
console.log('Environment Check:');
console.log('ORIGINKA:', process.env.ORIGINKA);

const express = require('express');
const cors = require('cors');
const app = express();
const cookieParser = require('cookie-parser');
const path = require('path');

const userRoutes = require('./routes/user.routes');
const connectDB = require('./db');

connectDB();

// Middleware order is important!
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/images/uploads', express.static(path.join(__dirname, 'images/uploads')));

// CORS configuration - try this explicit setup
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://frontend-phi-one-55.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    
    console.log('Request from origin:', origin);
    
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // Cache preflight response for 24 hours
};

app.use(cors(corsOptions));

// Explicit OPTIONS handling for preflight
app.options('*', cors(corsOptions));

// Test route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Hello World',
        cors_origin: process.env.ORIGINKA,
        timestamp: new Date().toISOString()
    });
});

// Your routes
app.use('/users', userRoutes);

// app.get('/test-cors', (req, res) => {
//     res.json({ 
//         message: 'CORS test endpoint',
//         origin_configured: process.env.ORIGINKA || 'NOT SET',
//         headers: req.headers,
//         timestamp: new Date().toISOString()
//     });
// });

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
});

module.exports = app;