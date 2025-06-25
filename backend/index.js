// backend/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/auth.routes.js'

dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000; // Use PORT from .env or default to 5000

app.use(cors());
app.use(express.json()); // Middleware to parse JSON request bodies


app.get('/', (req, res) => {
  res.send('API is running...');
});
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  connectDB();
});