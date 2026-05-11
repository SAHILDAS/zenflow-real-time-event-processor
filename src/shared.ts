import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ],
});

export interface EventPayload {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  data: Record<string, any>;
}
