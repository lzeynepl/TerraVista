require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const mongoose = require('mongoose');
const path = require('path'); 
const userRoutes = require('./routes/userRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const tripRoutes = require('./routes/tripRoutes');
const imageRoutes = require('./routes/imageRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const landmarkRoutes = require('./routes/landmarkRoutes');
const chatBotRoutes = require('./routes/chatBotRoutes');
const cors = require('cors');

const app = express();

// RETRIEVE AND COMBINE MONGO DB CONNECTION URI
const rawURI = process.env['MONGO-URI']; 
const dbPassword = process.env['DB-PASSWORD'];
const mongoURI = rawURI.replace('$$pw=', dbPassword);

// SETUP STATIC DIR
app.use(express.static(path.join(__dirname, 'public')));

// MIDDLEWARE
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'], 
    credentials: true 
  }));
app.use(express.urlencoded({ extended: true }));

app.options('*', cors());

// CONNECT TO MONGO DATABASE
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
})
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => console.error('Error connecting to MongoDB Atlas:', err));

// HOMEPAGE
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ROUTES

app.use('/api', userRoutes);
app.use('/api', hotelRoutes);
app.use('/api', restaurantRoutes);
app.use('/api', landmarkRoutes);
app.use('/api', tripRoutes);
app.use('/api', imageRoutes);
app.use('/api', chatBotRoutes);



app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signin.html'));
});

app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'resetPassword.html'));
});

app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'forgotPassword.html'));
});



// 404
app.use((req, res) => {
    res.status(404).send('404 - Sayfa Bulunamadı');
});

// START LISTENING
app.listen(3000, () => {
    console.log('TerraVista Backend is Running on http://localhost:3000');
});
