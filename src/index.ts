import express, { Application } from 'express';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './common/config';
import { securityMiddleware, sanitizeInput } from './common/middleware/security';
import { generalRateLimit } from './common/middleware/rateLimit';
import { errorHandler, notFoundHandler } from './common/middleware/errorHandler';
import { logger } from './common/utils/logger';
import { swaggerSpec } from './common/utils/swagger';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './modules/auth';
import doctorRoutes from './modules/doctors';
import scheduleRoutes from './modules/schedules';
import appointmentRoutes from './modules/appointments';
import paymentRoutes from './modules/payments';
import notificationRoutes from './modules/notifications';
import csvRoutes from './modules/csv';
import adminRoutes from './modules/admin';

class App {
  public app: Application;
  public port: number;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(...securityMiddleware);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Logging
    if (config.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Rate limiting
    this.app.use(generalRateLimit);

    // Input sanitization
    this.app.use(sanitizeInput);

    // Request logging
    this.app.use((req, _res, next) => {
      logger.info({
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      next();
    });
  }

  private initializeRoutes(): void {
    const apiVersion = config.apiVersion;

    // Health check
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        version: apiVersion,
      });
    });

    // API routes
    this.app.use(`/api/${apiVersion}/auth`, authRoutes);
    this.app.use(`/api/${apiVersion}/doctors`, doctorRoutes);
    this.app.use(`/api/${apiVersion}/schedules`, scheduleRoutes);
    this.app.use(`/api/${apiVersion}/appointments`, appointmentRoutes);
    this.app.use(`/api/${apiVersion}/payments`, paymentRoutes);
    this.app.use(`/api/${apiVersion}/notifications`, notificationRoutes);
    this.app.use(`/api/${apiVersion}/csv`, csvRoutes);
    this.app.use(`/api/${apiVersion}/admin`, adminRoutes);

    // Swagger documentation
    this.app.use(`/api/${apiVersion}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Root route
    this.app.get('/', (_req, res) => {
      res.json({
        message: 'MediCore Healthcare Booking API',
        version: apiVersion,
        documentation: `/api/${apiVersion}/docs`,
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  public listen(): void {
    this.app.listen(this.port, '127.0.0.1', () => {
      logger.info(`Server is running on port ${this.port} in ${config.nodeEnv} mode`);
      logger.info(`Health check: http://localhost:${this.port}/health`);
      logger.info(`API base: http://localhost:${this.port}/api/${config.apiVersion}`);
    });
  }
}

export default App;
