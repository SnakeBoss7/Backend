const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const app = express();
const cookieParser = require('cookie-parser');
const userModel = require('./models/user');
const userRoutes = require('./routes/user.routes');



const connectDB = require('./db');

connectDB();


app.use(cookieParser());
app.use(express.json()); // <-- add this line before your routes
app.use(express.urlencoded({ extended: true }));
const path = require('path');

// Serve static files from /images/uploads
app.use('/images/uploads', express.static(path.join(__dirname, 'images/uploads')));


app.use(cors({
  origin: 'http://localhost:3000',  // React frontend origin
  credentials: true                 // allow sending cookies
}));

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.use('/users', userRoutes);


module.exports=app
