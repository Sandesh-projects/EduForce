// backend/models/auth.model.js
import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs'; // You'll still need this for password hashing

/**
 * @typedef User
 * @property {string} fullName - The full name of the user. Required.
 * @property {string} email - The email address of the user. Required, unique, and lowercase.
 * @property {string} password - The hashed password of the user. Required.
 * @property {Date} createdAt - Timestamp of when the user was created.
 * @property {Date} updatedAt - Timestamp of when the user was last updated.
 */

const userSchema = mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, 'Please add a full name'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/.+@.+\..+/, 'Please enter a valid email address'],
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
            minlength: [6, 'Password must be at least 6 characters long'],
            // Remember: This password should be hashed before saving!
            // The pre-save hook below is crucial for this.
        },
        // Removed 'username' and 'userType' as per frontend data structure
    },
    {
        timestamps: true, // This option automatically adds createdAt and updatedAt fields
    }
);

// --- IMPORTANT: Password Hashing Pre-save Hook ---
// This is critical for security. Uncomment and ensure bcryptjs is installed.
// Install: npm install bcryptjs
/*
userSchema.pre('save', async function (next) {
    // Only hash the password if it's new or has been modified
    if (!this.isModified('password')) {
        next();
        return;
    }

    const salt = await bcrypt.genSalt(10); // Generate a salt
    this.password = await bcrypt.hash(this.password, salt); // Hash the password
    next(); // Proceed to save the user
});
*/
// --- End of Password Hashing Hook ---


/**
 * @function matchPassword
 * @description Method to compare entered password with hashed password during login.
 * Uncomment this method and ensure bcryptjs is imported when implementing login.
 *
 * userSchema.methods.matchPassword = async function (enteredPassword) {
 * return await bcrypt.compare(enteredPassword, this.password);
 * };
 */

const User = mongoose.model('User', userSchema);

export default User;