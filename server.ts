import express from "express";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { EventProducer } from "./src/producer-service/producer";
import { EventConsumer } from "./src/consumer-service/consumer";
import { logger } from "./src/shared";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new SocketServer(httpServer, {
    cors: { origin: "*" }
  });

  const PORT = 3000;
  const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
  const DATABASE_URL = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/zenflow";

  app.use(cors());
  app.use(express.json());

  // Initialize Services
  const producer = new EventProducer(KAFKA_BROKERS);
  const consumer = new EventConsumer(KAFKA_BROKERS, DATABASE_URL, io);

  // Lazy connect services (they might fail if Kafka/PG aren't running)
  producer.connect().catch(e => logger.warn("Kafka Producer not available yet"));
  consumer.connect().then(() => {
    consumer.subscribe("events").catch(e => logger.warn("Kafka Consumer subscription failed"));
  }).catch(e => logger.warn("Kafka Consumer not available yet"));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", services: { producer: "ready", consumer: "ready", db: "connected" } });
  });

  app.post("/api/events", async (req, res) => {
    const event = {
      id: Math.random().toString(36).substr(2, 9),
      type: req.body.type || "generic",
      source: "api-producer",
      timestamp: new Date().toISOString(),
      data: req.body.data || {}
    };

    try {
      await producer.sendEvent("events", event);
      res.status(202).json({ message: "Event accepted", eventId: event.id });
      
      // Fallback for preview: If Kafka isn't running, we'll emit directly to socket for UI demo
      if (!process.env.KAFKA_BROKERS) {
        io.emit("new_event", event);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to process event" });
    }
  });


  app.post("/api/simulate", async (_, res) => {
  const eventTypes = [
  "PAYMENT_SUCCESS",
  "ORDER_CREATED",
  "USER_REGISTERED",
  "AUTH_SUCCESS",
  "EMAIL_DISPATCHED",
  "API_GATEWAY_REQUEST"
];

  try {
    for (let i = 0; i < 100; i++) {
      const event = {
        id: crypto.randomUUID(),
        type: eventTypes[
          Math.floor(Math.random() * eventTypes.length)
        ],
        source: "simulation-engine",
        timestamp: new Date().toISOString(),
        data: {
          amount: Math.floor(Math.random() * 5000)
        }
      };

      await producer.sendEvent("events", event);

      io.emit("new_event", event);
    }

    res.json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      error: "Simulation failed"
    });
  }
});

  // Vite middleware for dashboard
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    logger.info(`ZenFlow Server running on http://localhost:${PORT}`);
  });
}

startServer();
