require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const CryptoJS = require('crypto-js');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

connectDB();

// User Model
const User = mongoose.model('User', {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, 'users');

// Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Test Route (Temporary - can remove after testing)
app.post('/api/create-test-user', async (req, res) => {
    try {
        const testUser = new User({
            email: 'test@example.com',
            password: 'test123'
        });
        await testUser.save();
        res.json({ message: 'Test user created', user: testUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating test user', error: error.message });
    }
});

// Forgot Password Endpoint
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        console.log('Searching for user with email:', email);

        const user = await User.findOne({ email }).maxTimeMS(10000);

        if (!user) {
            console.log('No user found with email:', email);
            return res.status(404).json({
                message: 'No account found with that email address',
                suggestion: 'Please check the email or register first'
            });
        }

        console.log('Found user:', user.email);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Password Recovery',
            text: `Your password is: ${user.password}\n\nPlease keep this information secure.`,
            html: `<p>Your password is: <strong>${user.password}</strong></p><p>Please keep this information secure.</p>`
        };

        await transporter.sendMail(mailOptions);
        console.log('Password recovery email sent to:', email);

        res.json({ message: 'Password recovery email sent successfully' });
    } catch (error) {
        console.error('Error in forgot password:', error);
        res.status(500).json({
            message: 'Error processing your request',
            error: error.message
        });
    }
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        dbState: mongoose.connection.readyState,
        dbName: mongoose.connection.name
    });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`MongoDB state: ${mongoose.connection.readyState}`);
});