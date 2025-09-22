import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { config } from './config';
import { logger } from './logger';

class KafkaService {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;

  constructor() {
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.producer = this.kafka.producer({
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000,
    });

    this.consumer = this.kafka.consumer({
      groupId: config.kafka.groupId,
      sessionTimeout: 30000,
      rebalanceTimeout: 60000,
      heartbeatInterval: 3000,
    });
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      logger.info('Kafka connected successfully');
    } catch (error) {
      logger.error('Kafka connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      await this.consumer.disconnect();
      logger.info('Kafka disconnected successfully');
    } catch (error) {
      logger.error('Kafka disconnection failed:', error);
    }
  }

  async publishEvent(topic: string, message: any, key?: string): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: key || null,
            value: JSON.stringify({
              ...message,
              timestamp: new Date().toISOString(),
              service: 'ms-patients',
            }),
          },
        ],
      });
      logger.info(`Event published to topic ${topic}:`, { key, message });
    } catch (error) {
      logger.error(`Failed to publish event to topic ${topic}:`, error);
      throw error;
    }
  }

  async subscribe(topics: string[], messageHandler: (payload: EachMessagePayload) => Promise<void>): Promise<void> {
    try {
      await this.consumer.subscribe({ topics, fromBeginning: false });
      
      await this.consumer.run({
        eachMessage: async (payload) => {
          try {
            logger.info(`Received message from topic ${payload.topic}:`, {
              partition: payload.partition,
              offset: payload.message.offset,
              key: payload.message.key?.toString(),
            });
            
            await messageHandler(payload);
          } catch (error) {
            logger.error('Error processing message:', error);
            // Implement dead letter queue or retry logic here
          }
        },
      });
      
      logger.info(`Subscribed to topics: ${topics.join(', ')}`);
    } catch (error) {
      logger.error('Failed to subscribe to topics:', error);
      throw error;
    }
  }

  // Patient-specific event publishers
  async publishPatientCreated(patient: any): Promise<void> {
    await this.publishEvent(config.kafka.topics.patientCreated, {
      eventType: 'PatientCreated',
      patientId: patient.id,
      data: patient,
    }, patient.id);
  }

  async publishPatientUpdated(patientId: string, oldData: any, newData: any): Promise<void> {
    await this.publishEvent(config.kafka.topics.patientUpdated, {
      eventType: 'PatientUpdated',
      patientId,
      oldData,
      newData,
      changes: this.getChanges(oldData, newData),
    }, patientId);
  }

  async publishPatientDeleted(patientId: string, patientData: any): Promise<void> {
    await this.publishEvent(config.kafka.topics.patientDeleted, {
      eventType: 'PatientDeleted',
      patientId,
      data: patientData,
    }, patientId);
  }

  async publishPatientValidated(patientId: string, validationResult: any): Promise<void> {
    await this.publishEvent(config.kafka.topics.patientValidated, {
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

export const kafkaService = new KafkaService();

export const initializeKafka = async (): Promise<void> => {
  await kafkaService.connect();
  
  // Subscribe to relevant topics for this service
  const topicsToSubscribe: string[] = [
    // Add topics this service should listen to
    // For example: billing events, audit events, etc.
  ];
  
  if (topicsToSubscribe.length > 0) {
    await kafkaService.subscribe(topicsToSubscribe, async (payload) => {
      // Handle incoming messages
      const message = JSON.parse(payload.message.value?.toString() || '{}');
      logger.info('Received event:', { topic: payload.topic, message });
      
      // Process the message based on topic and event type
      // This is where you'd implement event handlers
    });
  }
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await kafkaService.disconnect();
});

