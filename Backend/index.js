import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './db.js';
import User from './models/User.js';

dotenv.config();

connectDB();

const app = express();

app.use(express.json());
app.use(cors());

app.post('/api/registerUser', async (req, res) => {
    const { uid, phoneNumber } = req.body;
    console.log('Received registration request:', { uid, phoneNumber });

    try {
        const userExists = await User.findOne({ uid });

        if (userExists) {
            console.log('User already exists:', userExists);
            return res.status(200).json({ message: 'User already registered' });
        }

        const user = await User.create({
            uid,
            phoneNumber,
        });

        if (user) {
            console.log('User successfully registered in DB:', user);
            res.status(201).json({
                _id: user._id,
                uid: user.uid,
                phoneNumber: user.phoneNumber,
            });
        } else {
            console.log('Invalid user data received.');
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