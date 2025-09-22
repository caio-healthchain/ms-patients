import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // Azure PostgreSQL (Write Database)
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'lazarus_patients',
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    ssl: process.env.POSTGRES_SSL === 'true',
    // Azure specific configurations
    connectionString: process.env.DATABASE_URL,
  },
  
  // Azure Cosmos DB (MongoDB API) - Read Database (CQRS)
  // Will migrate to MongoDB Atlas later
  cosmosdb: {
    uri: process.env.COSMOSDB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/lazarus_patients_read',
    key: process.env.COSMOSDB_KEY, // Primary key for Cosmos DB
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Cosmos DB specific options
      ssl: true,
      retryWrites: false, // Cosmos DB doesn't support retryWrites
    },
  },
  
  // MongoDB Atlas (for future migration)
  mongodb: {
    uri: process.env.MONGODB_ATLAS_URI,
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },
  
  // Azure Redis Cache
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    // Azure Redis specific
    tls: process.env.REDIS_TLS === 'true',
    connectionString: process.env.REDIS_CONNECTION_STRING,
  },
  
  // Event Bus (Azure Service Bus) configuration
  eventBus: {
    connectionString: process.env.AZURE_SERVICE_BUS_CONNECTION_STRING || process.env.SERVICE_BUS_CONNECTION_STRING || '',
    enabled: process.env.USE_SERVICE_BUS !== 'false', // Default enabled
    queues: {
      patientCreated: 'patient.created',
      patientUpdated: 'patient.updated',
      patientDeleted: 'patient.deleted',
      patientValidated: 'patient.validated'
    }
  },

  // Azure Service Bus (replacing Kafka for MVP1)
  serviceBus: {
    connectionString: process.env.SERVICE_BUS_CONNECTION_STRING,
    topics: {
      patientCreated: 'patient-created',
      patientUpdated: 'patient-updated',
      patientDeleted: 'patient-deleted',
      patientValidated: 'patient-validated',
    },
  },
  
  // Kafka (for future use or hybrid approach)
  kafka: {
    enabled: process.env.USE_KAFKA === 'true', // Disabled by default
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: 'ms-patients',
    groupId: 'patients-service-group',
    topics: {
      patientCreated: 'patient.created',
      patientUpdated: 'patient.updated',
      patientDeleted: 'patient.deleted',
      patientValidated: 'patient.validated',
    },
  },
  
  // Azure Storage (for documents)
  azureStorage: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    containerName: process.env.AZURE_STORAGE_CONTAINER || 'patient-documents',
    accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
    accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY,
  },
  
  // External Services (Azure Container Instances or AKS)
  services: {
    audit: process.env.AUDIT_SERVICE_URL || 'http://localhost:3004',
    billing: process.env.BILLING_SERVICE_URL || 'http://localhost:3003',
    procedures: process.env.PROCEDURES_SERVICE_URL || 'http://localhost:3002',
    rules: process.env.RULES_SERVICE_URL || 'http://localhost:3006',
  },
  
  // Azure Application Insights
  applicationInsights: {
    instrumentationKey: process.env.APPINSIGHTS_INSTRUMENTATIONKEY,
    connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
  
  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  
  // File Upload
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'],
  },
  
  // MCP (Model Context Protocol)
  mcp: {
    enabled: process.env.MCP_ENABLED === 'true',
    serverName: 'lazarus-patients',
    version: '1.0.0',
  },
  
  // Azure specific configurations
  azure: {
    subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
    resourceGroup: process.env.AZURE_RESOURCE_GROUP,
    location: process.env.AZURE_LOCATION || 'East US',
    tenantId: process.env.AZURE_TENANT_ID,
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
  },
  
  // Feature flags for migration
  features: {
    useCosmosDB: process.env.USE_COSMOSDB !== 'false', // Default to true for MVP1
    useMongoDBAtlas: process.env.USE_MONGODB_ATLAS === 'true', // For future migration
    useServiceBus: process.env.USE_SERVICE_BUS !== 'false', // Default to true for MVP1
    useKafka: process.env.USE_KAFKA === 'true', // For future or hybrid
  },
};

