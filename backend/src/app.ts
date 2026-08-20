import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import contractRoutes from './routes/contract.routes';

dotenv.config();

const app: Express = express();

// Middlewares de Seguridad y Logs
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Enrutadores Principales
app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractRoutes);

// Endpoint de Salud / Prueba
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Medical System Backend API is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default app;
