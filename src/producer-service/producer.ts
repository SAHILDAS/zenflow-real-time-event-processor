import { Kafka, Producer } from 'kafkajs';
import { logger } from '../shared';

export class EventProducer {
  private kafka: Kafka;
  private producer: Producer;

  constructor(brokers: string[]) {
    this.kafka = new Kafka({
      clientId: 'producer-service',
      brokers,
    });
    this.producer = this.kafka.producer();
  }

  async connect() {
    try {
      await this.producer.connect();
      logger.info('Producer connected to Kafka');
    } catch (error) {
      logger.error('Failed to connect producer', { error });
      // In a real app, we might want to retry or fail fast
    }
  }

  async sendEvent(topic: string, event: any) {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(event) }],
      });
      logger.info('Event sent to Kafka', { topic, eventId: event.id });
    } catch (error) {
      logger.error('Failed to send event', { error, topic });
    }
  }

  async disconnect() {
    await this.producer.disconnect();
  }
}
