import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './db.js';
import User from './models/User.js';
import admin from './firebaseAdmin.js'; // Import Firebase Admin

dotenv.config();

connectDB();

const app = express();

app.use(express.json());
app.use(cors());

// Middleware to verify Firebase ID token
const protect = async (req, res, next) => {
    console.log('\n[Middleware] Entering protect middleware...'); // New log
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decodedToken = await admin.auth().verifyIdToken(token);
            req.user = decodedToken;
            next();
        } catch (error) {
            console.error('Error while verifying token:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

app.post('/api/registerUser', protect, async (req, res) => {
    // Now get uid and phoneNumber from the verified token (req.user)
    const { uid, phone_number } = req.user;
    console.log('Received registration request for uid:', uid);

    try {
        const userExists = await User.findOne({ uid });

        if (userExists) {
            console.log('User already exists:', userExists);
            return res.status(200).json({ message: 'User already registered', user: userExists });
        }

        const user = await User.create({
            uid,
            phoneNumber: phone_number, // Use phone_number from decoded token
        });

        if (user) {
            console.log('User successfully registered in DB:', user);
            res.status(201).json({
                _id: user._id,
                uid: user.uid,
                phoneNumber: user.phoneNumber,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});