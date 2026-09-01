import app from './app';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Servidor Backend iniciado exitosamente en http://localhost:${PORT}`);
  logger.info(`🏥 Health check disponible en http://localhost:${PORT}/api/health`);
});

// Captura de Excepciones No Manejadas
process.on('uncaughtException', (error: Error) => {
  logger.error(`Excepción no capturada (Uncaught Exception): ${error.message}`, {
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error(`Promesa rechazada no manejada (Unhandled Rejection): ${reason}`);
});

export default server;
