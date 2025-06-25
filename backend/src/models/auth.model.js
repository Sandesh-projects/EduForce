// backend/src/models/auth.model.js

// Change 'require' to 'import'
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; // Change 'require' to 'import'

const userSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Ensures no two users have the same email
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "teacher"], // Restricts values to 'student' or 'teacher'
      default: "student", // Default role if not specified
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Method to compare entered password with hashed password in DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware to hash password before saving (only if password is new or modified)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    // If password field is not modified, skip hashing
    next();
  }

  // Generate a salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

// Export using ES Module syntax
export default User;