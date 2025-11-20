// index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import wineRoutes from './routes/wine.routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/wine', wineRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});