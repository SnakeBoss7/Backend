const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const userRoutes = require('./routes/user.routes');
const connectDB = require('./db');

connectDB();

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images/uploads', express.static(path.join(__dirname, 'images/uploads')));

console.log('DEBUG_URL:', process.env.DEBUG_URL);
console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ set' : '❌ MISSING');


// --- CORS CONFIGURATION ---
const allowedOrigins = [
  process.env.ORIGINKA, // from .env
  'http://localhost:3000',
  'http://localhost:5173'
];

const corsOptions = {
  origin: [
    'https://frontend-phi-one-55.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));


// --- ROUTES ---
app.get('/', (req, res) => {
   console.log('✅ Backend root hit');
  res.json({
    message: 'Hello World',
    cors_origin: process.env.ORIGINKA,
    timestamp: new Date().toISOString()
  });
});
app.use('/users', userRoutes);

// --- ERROR HANDLING ---
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

module.exports = app;
