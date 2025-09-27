import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { config } from './config';
import { logger } from './logger';

// PostgreSQL (Write Database) - Azure Database for PostgreSQL
export const prisma = new PrismaClient({
  log: config.nodeEnv === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: config.postgres.connectionString || 
           `postgresql://${config.postgres.username}:${config.postgres.password}@${config.postgres.host}:${config.postgres.port}/${config.postgres.database}?sslmode=${config.postgres.ssl ? 'require' : 'prefer'}`
    }
  }
});

// MongoDB/Cosmos DB (Read Database - CQRS)
export const connectMongoDB = async (): Promise<void> => {
  try {
    let connectionUri: string;
    let connectionOptions: any;

    if (config.features.useMongoDBAtlas && config.mongodb.uri) {
      // MongoDB Atlas (future migration)
      connectionUri = config.mongodb.uri;
      connectionOptions = config.mongodb.options;
      logger.info('Connecting to MongoDB Atlas...');
    } else {
      // Azure Cosmos DB (MVP1)
      connectionUri = config.cosmosdb.uri;
      connectionOptions = {
        ...config.cosmosdb.options,
        // Cosmos DB specific authentication
        ...(config.cosmosdb.key && {
          auth: {
            username: config.cosmosdb.uri.split('@')[0].split('//')[1].split(':')[0],
            password: config.cosmosdb.key
          }
        })
      };
      logger.info('Connecting to Azure Cosmos DB (MongoDB API)...');
    }

    await mongoose.connect(connectionUri, connectionOptions);
    
    // Configure Mongoose for Cosmos DB optimizations
    if (config.features.useCosmosDB) {
      // Disable some MongoDB features not supported by Cosmos DB
      mongoose.set('bufferCommands', false);
      // Note: bufferMaxEntries is not a valid mongoose option, removing it
    }

    logger.info('MongoDB/Cosmos DB connected successfully');
  } catch (error) {
    logger.error('MongoDB/Cosmos DB connection failed:', error);
    throw error;
  }
};

// Redis (Cache) - Azure Redis Cache
export const redisClient = createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port,
    ...(config.redis.tls && { tls: true })
  },
  password: config.redis.password,
  database: config.redis.db,
  // Use connection string if provided (Azure Redis format)
  ...(config.redis.connectionString && {
    url: config.redis.connectionString
  })
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis connected successfully');
});

redisClient.on('ready', () => {
  logger.info('Redis ready for operations');
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

// Connect all databases
export const connectDatabases = async (): Promise<void> => {
  try {
    // Test PostgreSQL connection
    await prisma.$connect();
    logger.info('Azure PostgreSQL connected successfully');

    // Connect MongoDB/Cosmos DB
    await connectMongoDB();

    // Connect Redis
    //await connectRedis();

    logger.info('All databases connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

// Health check functions
export const checkDatabaseHealth = async (): Promise<{
  postgres: boolean;
  mongodb: boolean;
  redis: boolean;
}> => {
  const health = {
    postgres: false,
    mongodb: false,
    redis: false
  };

  try {
    // Check PostgreSQL
    await prisma.$queryRaw`SELECT 1`;
    health.postgres = true;
  } catch (error) {
    logger.error('PostgreSQL health check failed:', error);
  }

  try {
    // Check MongoDB/Cosmos DB
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      health.mongodb = true;
    }
  } catch (error) {
    logger.error('MongoDB/Cosmos DB health check failed:', error);
  }

  try {
    // Check Redis
    if (redisClient.isOpen) {
      await redisClient.ping();
      health.redis = true;
    }
  } catch (error) {
    logger.error('Redis health check failed:', error);
  }

  return health;
};

// Graceful shutdown
export const disconnectDatabases = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    await mongoose.disconnect();
    await redisClient.disconnect();
    logger.info('All databases disconnected successfully');
  } catch (error) {
    logger.error('Database disconnection failed:', error);
  }
};

// Handle process termination
process.on('beforeExit', async () => {
  await disconnectDatabases();
});

// Export utility functions for cache operations
export const cacheUtils = {
  // Set cache with TTL
  set: async (key: string, value: any, ttlSeconds: number = 3600): Promise<void> => {
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set failed:', error);
    }
  },

  // Get from cache
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get failed:', error);
      return null;
    }
  },

  // Delete from cache
  del: async (key: string): Promise<void> => {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error('Cache delete failed:', error);
    }
  },

  // Clear cache by pattern
  clearPattern: async (pattern: string): Promise<void> => {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      logger.error('Cache clear pattern failed:', error);
    }
  }
};

