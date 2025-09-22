import { ServiceBusClient, ServiceBusSender, ServiceBusReceiver } from '@azure/service-bus';
import { config } from './config';
import { logger } from './logger';

interface EventMessage {
  eventType: string;
  patientId?: string;
  data?: any;
  timestamp?: string;
  service?: string;
  [key: string]: any;
}

class EventBusService {
  private client: ServiceBusClient | null = null;
  private senders: Map<string, ServiceBusSender> = new Map();
  private receivers: Map<string, ServiceBusReceiver> = new Map();
  private isTestMode: boolean;

  constructor() {
    // Check if we're in test mode (connection string is test or empty)
    this.isTestMode = !config.eventBus.connectionString || 
                      config.eventBus.connectionString === 'test-connection-string' ||
                      config.eventBus.connectionString.includes('test');
    
    if (!this.isTestMode) {
      // Initialize Service Bus client with connection string only in production
      this.client = new ServiceBusClient(config.eventBus.connectionString);
    }
  }

  async connect(): Promise<void> {
    try {
      if (this.isTestMode) {
        logger.info('Event Bus running in TEST MODE - no real Azure Service Bus connection');
        logger.info('Configured queues: patient.created, patient.updated, patient.deleted, patient.validated');
        return;
      }

      if (!this.client) {
        throw new Error('Service Bus client not initialized');
      }

      // Create senders for each queue
      const queues = [
        'patient.created',
        'patient.updated', 
        'patient.deleted',
        'patient.validated'
      ];

      for (const queue of queues) {
        const sender = this.client.createSender(queue);
        this.senders.set(queue, sender);
      }

      logger.info('Azure Service Bus connected successfully');
    } catch (error) {
      logger.error('Service Bus connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isTestMode) {
        logger.info('Event Bus TEST MODE - no real connections to close');
        return;
      }

      // Close all senders
      for (const [queue, sender] of this.senders) {
        await sender.close();
        logger.info(`Sender for queue ${queue} closed`);
      }

      // Close all receivers
      for (const [queue, receiver] of this.receivers) {
        await receiver.close();
        logger.info(`Receiver for queue ${queue} closed`);
      }

      // Close the client
      if (this.client) {
        await this.client.close();
      }
      logger.info('Service Bus disconnected successfully');
    } catch (error) {
      logger.error('Service Bus disconnection failed:', error);
    }
  }

  async publishEvent(queueName: string, message: EventMessage, messageId?: string): Promise<void> {
    try {
      if (this.isTestMode) {
        const testMessage = {
          messageId: messageId || `${message.eventType}-${Date.now()}`,
          body: {
            ...message,
            timestamp: new Date().toISOString(),
            service: 'ms-patients',
          },
          contentType: 'application/json',
          correlationId: message.patientId,
          subject: message.eventType,
        };
        
        logger.info(`[TEST MODE] Event would be published to queue ${queueName}:`, { 
          messageId: testMessage.messageId, 
          eventType: message.eventType,
          patientId: message.patientId 
        });
        return;
      }

      const sender = this.senders.get(queueName);
      if (!sender) {
        throw new Error(`Sender for queue ${queueName} not found`);
      }

      const serviceBusMessage = {
        messageId: messageId || `${message.eventType}-${Date.now()}`,
        body: {
          ...message,
          timestamp: new Date().toISOString(),
          service: 'ms-patients',
        },
        contentType: 'application/json',
        correlationId: message.patientId,
        subject: message.eventType,
      };

      await sender.sendMessages(serviceBusMessage);
      logger.info(`Event published to queue ${queueName}:`, { 
        messageId: serviceBusMessage.messageId, 
        eventType: message.eventType,
        patientId: message.patientId 
      });
    } catch (error) {
      logger.error(`Failed to publish event to queue ${queueName}:`, error);
      throw error;
    }
  }

  async subscribe(queueName: string, messageHandler: (message: any) => Promise<void>): Promise<void> {
    try {
      if (this.isTestMode) {
        logger.info(`[TEST MODE] Would subscribe to queue: ${queueName}`);
        return;
      }

      if (!this.client) {
        throw new Error('Service Bus client not initialized');
      }

      const receiver = this.client.createReceiver(queueName);
      this.receivers.set(queueName, receiver);

      // Start receiving messages
      receiver.subscribe({
        processMessage: async (brokeredMessage) => {
          try {
            logger.info(`Received message from queue ${queueName}:`, {
              messageId: brokeredMessage.messageId,
              correlationId: brokeredMessage.correlationId,
              subject: brokeredMessage.subject,
            });

            await messageHandler(brokeredMessage.body);
            
            // Complete the message (remove from queue)
            await receiver.completeMessage(brokeredMessage);
          } catch (error) {
            logger.error('Error processing message:', error);
            // Abandon the message (will be retried)
            await receiver.abandonMessage(brokeredMessage);
          }
        },
        processError: async (args) => {
          logger.error(`Error from source ${args.errorSource}:`, args.error);
        }
      });

      logger.info(`Subscribed to queue: ${queueName}`);
    } catch (error) {
      logger.error(`Failed to subscribe to queue ${queueName}:`, error);
      throw error;
    }
  }

  // Patient-specific event publishers (same interface as Kafka)
  async publishPatientCreated(patient: any): Promise<void> {
    await this.publishEvent('patient.created', {
      eventType: 'PatientCreated',
      patientId: patient.id,
      data: patient,
    }, patient.id);
  }

  async publishPatientUpdated(patientId: string, oldData: any, newData: any): Promise<void> {
    await this.publishEvent('patient.updated', {
      eventType: 'PatientUpdated',
      patientId,
      oldData,
      newData,
      changes: this.getChanges(oldData, newData),
    }, patientId);
  }

  async publishPatientDeleted(patientId: string, patientData: any): Promise<void> {
    await this.publishEvent('patient.deleted', {
      eventType: 'PatientDeleted',
      patientId,
      data: patientData,
    }, patientId);
  }

  async publishPatientValidated(patientId: string, validationResult: any): Promise<void> {
    await this.publishEvent('patient.validated', {
      eventType: 'PatientValidated',
      patientId,
      validationResult,
    }, patientId);
  }

  private getChanges(oldData: any, newData: any): Record<string, { from: any; to: any }> {
    const changes: Record<string, { from: any; to: any }> = {};
    
    for (const key in newData) {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          from: oldData[key],
          to: newData[key],
        };
      }
    }
    
    return changes;
  }
}

export const eventBusService = new EventBusService();

export const initializeEventBus = async (): Promise<void> => {
  await eventBusService.connect();
  
  // Subscribe to relevant queues for this service if needed
  // For now, this service only publishes events
  logger.info('Event Bus initialized successfully');
};

