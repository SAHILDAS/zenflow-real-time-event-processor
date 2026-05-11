# ZenFlow: Real-time Event processing System

A production-ready event processing architecture built with Node.js, Kafka, PostgreSQL, and Socket.io.

## Architecture

ZenFlow follows a distributed event-driven architecture:

1.  **Producer Service**: An Express-based API that accepts incoming events and pushes them to Kafka.
2.  **Kafka Message Broker**: Decouples producer and consumer, ensuring reliability and scalability.
3.  **Consumer Service**: Subscribes to events, processes business logic, persists data to PostgreSQL, and broadcasts real-time updates via Socket.io.
4.  **Dashboard Hub**: A React-based interface for real-time monitoring and analytics.

## Tech Stack

-   **Backend**: Node.js, TypeScript, Express
-   **Messaging**: Kafka (via KafkaJS)
-   **Database**: PostgreSQL
-   **Real-time**: Socket.io
-   **Observability**: Winston (Structured Logging)
-   **Deployment**: Docker Compose

## Prerequisites

-   Docker & Docker Compose
-   Node.js 18+ (for local development)

## Getting Started

### 1. Start Infrastructure

Run the following command to spin up Kafka, Zookeeper, and PostgreSQL:

```bash
docker-compose up -d
```

### 2. Initialize Database

Execute the schema against your Postgres instance:

```bash
psql -h localhost -U user -d zenflow -f schema.sql
```

### 3. Environment Variables

Create a `.env` file based on `.env.example`:

```env
KAFKA_BROKERS=localhost:9092
DATABASE_URL=postgresql://user:password@localhost:5432/zenflow
```

### 4. Running Locally

```bash
npm install
npm run dev
```

## Features

-   **Clean Architecture**: Separation of concerns between producers, consumers, and core logic.
-   **Real-time Streaming**: Sub-100ms latency from event ingestion to dashboard update.
-   **Resilience**: Kafka buffering prevents data loss during consumer downtime.
-   **Structured Logging**: Production-grade JSON logs for easy ELK/Datadog integration.
-   **Type Safety**: End-to-end TypeScript implementation.

## Folder Structure

-   `src/producer-service`: Kafka producer logic.
-   `src/consumer-service`: Kafka listener and DB persistence.
-   `src/shared.ts`: Common types and logging utilities.
-   `server.ts`: Monolith orchestrator for preview purposes.
-   `docker-compose.yml`: Infrastructure orchestration.
-   `schema.sql`: Database schema definition.


```mermaid
graph TD
A[Producer API] --> B[Kafka Topic]
B --> C[Consumer Service]
C --> D[PostgreSQL]
C --> E[Socket.io Gateway]
E --> F[Realtime Dashboard]
```