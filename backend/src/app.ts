import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/company.routes';
import doctorRoutes from './routes/doctor.routes';
import contractRoutes from './routes/contract.routes';
import financeRoutes from './routes/finance.routes';
import consultationRoutes from './routes/consultation.routes';
import { logger, morganStream } from './utils/logger';

dotenv.config();

const app: Express = express();

// Middlewares de Seguridad y Logs
app.use(helmet());
app.use(cors());
app.use(
  morgan(
    process.env.NODE_ENV === 'production'
      ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'
      : ':method :url :status :res[content-length] - :response-time ms',
    { stream: morganStream }
  )
);
app.use(express.json());

// Enrutadores Principales
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/consultations', consultationRoutes);

// Endpoint de Salud / Prueba
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Medical System Backend API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Middleware Global de Manejo y Registro de Errores
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Error no controlado en ${req.method} ${req.url}: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
  });

  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export default app;
