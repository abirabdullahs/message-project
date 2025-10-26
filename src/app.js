import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import messageRoutes from './routes/messages.routes.js';
import { notFound, errorHandler, handleValidationError, handleDuplicateKeyError } from './middlewares/error.middleware.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ],
  credentials: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error Handling
app.use(notFound);
app.use(handleValidationError);
app.use(handleDuplicateKeyError);
app.use(errorHandler);

export default app;