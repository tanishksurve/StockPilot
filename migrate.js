require('dotenv').config();
const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');
const User = require('./models/User'); // Adjust path as needed

const encryptPassword = (password) => {
    return CryptoJS.AES.encrypt(password, process.env.ENCRYPTION_KEY).toString();
};

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log(`Found ${users.length} users to migrate`);

        for (const user of users) {
            // Skip if already encrypted (detect by format)
            if (!user.password.startsWith('U2FsdGVkX1')) {
                console.log(`Migrating user: ${user.email}`);
                // You'll need the original plain text password here
                // If passwords are already hashed, you CANNOT decrypt them
                // This only works if you have the original passwords
                user.password = encryptPassword('original_password_here');
                await user.save();
            }
        }

        console.log('Migration completed');
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
};

migrate();