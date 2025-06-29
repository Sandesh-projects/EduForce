// User model definition
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the user schema
const userSchema = mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true, // Email must be unique
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["student", "teacher"], // Role can be 'student' or 'teacher'
            default: "student", // Default role is student
            required: true,
        },
        // Optional user profile fields
        phoneNumber: {
            type: String,
            required: false,
            default: null,
        },
        dateOfBirth: {
            type: Date,
            required: false,
            default: null,
        },
        bio: {
            type: String,
            required: false,
            default: null,
            maxlength: 500, // Maximum length for bio
        },
        interests: {
            type: [String], // Array of strings for interests
            required: false,
            default: [], // Default to an empty array
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt timestamps
    }
);

// Method to compare entered password with stored hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware to hash password before saving
userSchema.pre("save", async function (next) {
    // Only hash if password is new or modified
    if (!this.isModified("password")) {
        next();
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

export default User;