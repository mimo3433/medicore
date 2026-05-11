import App from './index';
import prisma from './common/database/prisma';
import redis from './common/database/redis';
import { logger } from './common/utils/logger';

const app = new App();
app.listen();

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    // Close HTTP server
    // (app.server.close() would be called here if we had a reference to it)

    // Close database connections
    await prisma.$disconnect();
    logger.info('Database connections closed');

    // Close Redis connection
    await redis.quit();
    logger.info('Redis connection closed');

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Server started above
