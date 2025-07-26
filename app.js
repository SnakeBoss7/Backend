const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const app = express();
const cookieParser = require('cookie-parser');

const userRoutes = require('./routes/user.routes');



const connectDB = require('./db');

connectDB();


app.use(cookieParser());
app.use(express.json()); // <-- add this line before your routes
app.use(express.urlencoded({ extended: true }));
const path = require('path');

app.use(cors({
  origin: process.env.ORIGINKA,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true // only if you’re using cookies or sessions
}));
// Serve static files from /images/uploads
app.use('/images/uploads', express.static(path.join(__dirname, 'images/uploads')));

console.log('CORS Origin:', process.env.ORIGINKA);

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.use('/users', userRoutes);


module.exports=app
