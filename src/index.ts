import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { config } from './config/config';
import { logger } from './config/logger';
import { connectDatabases } from './config/database';
import { initializeEventBus } from './config/eventbus';
// import { initializeKafka } from './config/kafka'; // Disabled for MVP1
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { authMiddleware } from './middleware/auth';

// Routes
import patientRoutes from './routes/patient.routes';
import healthRoutes from './routes/health.routes';
// import mcpRoutes from './routes/mcp.routes'; // TODO: Implement MCP routes

class PatientService {
  private app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    this.app.use(cors({
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        timestamp: new Date().toISOString()
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(compression());

    // Logging
    this.app.use(requestLogger);
  }

  private initializeRoutes(): void {
    // Health check (no auth required)
    this.app.use('/health', healthRoutes);
    
    // API routes (auth required)
    this.app.use('/api/v1/patients', authMiddleware, patientRoutes);
    
    // MCP routes (auth required) - TODO: Implement
    // this.app.use('/mcp', authMiddleware, mcpRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'Lazarus Patients Microservice',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        features: {
          cosmosDB: config.features.useCosmosDB,
          mongoDBAtlas: config.features.useMongoDBAtlas,
          serviceBus: config.features.useServiceBus,
          kafka: config.features.useKafka
        }
      });
    });
  }

  private initializeSwagger(): void {
    const options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'Lazarus Patients API',
          version: '1.0.0',
          description: 'API para gerenciamento de pacientes do sistema Lazarus',
          contact: {
            name: 'Lazarus Team',
            email: 'dev@lazarus.com'
          }
        },
        servers: [
          {
            url: `http://localhost:${this.port}`,
            description: 'Development server',
          },
          {
            url: `https://lazarus-patients.azurewebsites.net`,
            description: 'Production server (Azure)',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
        tags: [
          {
            name: 'Health',
            description: 'Health check endpoints'
          },
          {
            name: 'Patients',
            description: 'Patient management endpoints'
          }
        ]
      },
      apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
    };

    const specs = swaggerJsdoc(options);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Lazarus Patients API Documentation'
    }));
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Initialize databases (skip in test mode)
      if (process.env.SKIP_DATABASE_CONNECTION !== 'true') {
        await connectDatabases();
        logger.info('Databases connected successfully');
      } else {
        logger.info('Database connection skipped (test mode)');
      }

      // Initialize Event Bus (Azure Service Bus)
      if (config.eventBus.enabled) {
        await initializeEventBus();
        logger.info('Event Bus (Azure Service Bus) initialized successfully');
      }

      // Initialize Kafka (disabled for MVP1)
      // if (config.kafka.enabled) {
      //   await initializeKafka();
      //   logger.info('Kafka initialized successfully');
      // }

      // Start server
      this.app.listen(this.port, '0.0.0.0', () => {
        logger.info(`Patients service running on port ${this.port}`);
        logger.info(`API Documentation available at http://localhost:${this.port}/api-docs`);
        logger.info(`Health check available at http://localhost:${this.port}/health`);
        
        // Log configuration
        logger.info('Service configuration:', {
          nodeEnv: config.nodeEnv,
          features: config.features,
          azure: {
            location: config.azure.location,
            resourceGroup: config.azure.resourceGroup
          }
        });
      });
    } catch (error) {
      logger.error('Failed to start service:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    logger.info('Stopping Patients service...');
    // Add graceful shutdown logic here
    process.exit(0);
  }
}

// Start the service
const service = new PatientService();
service.start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await service.stop();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await service.stop();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

