import { Kafka, Consumer } from 'kafkajs';
import { Pool } from 'pg';
import { Server as SocketServer } from 'socket.io';
import { logger, EventPayload } from '../shared';

export class EventConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private db: Pool;
  private io: SocketServer | null;

  constructor(brokers: string[], databaseUrl: string, io?: SocketServer) {
    this.kafka = new Kafka({
      clientId: 'consumer-service',
      brokers,
    });
    this.consumer = this.kafka.consumer({ groupId: 'event-processing-group' });
    this.db = new Pool({ connectionString: databaseUrl });
    this.io = io || null;
  }

  async connect() {
    try {
      await this.consumer.connect();
      logger.info('Consumer connected to Kafka');
    } catch (error) {
      logger.error('Failed to connect consumer', { error });
    }
  }

  async subscribe(topic: string) {
    await this.consumer.subscribe({ topic, fromBeginning: false });
    
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        const payload = message.value?.toString();
        if (!payload) return;

        try {
          const event: EventPayload = JSON.parse(payload);
          await this.processEvent(event);
        } catch (error) {
          logger.error('Error processing Kafka message', { error });
        }
      },
    });
  }

  private async processEvent(event: EventPayload) {
    logger.info('Processing event', { eventId: event.id });

    // Store in Postgres
    try {
      await this.db.query(
        'INSERT INTO events (event_id, event_type, source, payload) VALUES ($1, $2, $3, $4)',
        [event.id, event.type, event.source, event.data]
      );
    } catch (error) {
      logger.error('Database insertion failed', { error, eventId: event.id });
    }

    // Broadcast to Dashboard via Socket.io
    if (this.io) {
      this.io.emit('new_event', event);
      this.io.emit('stats_update', {
        type: event.type,
        timestamp: event.timestamp
      });
    }
  }

  async disconnect() {
    await this.consumer.disconnect();
    await this.db.end();
  }
}
