import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { config } from "../config";
import logger from "../utils/logger";
import { transcriptionRoutes } from "./routes/transcription";

export async function createServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: false,
  });

  await server.register(cors, {
    origin: true,
  });

  await server.register(multipart, {
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB
    },
  });

  server.get("/health", async (_request, _reply) => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  await server.register(transcriptionRoutes, { prefix: "/api/transcription" });

  server.setErrorHandler((error, request, reply) => {
    logger.error("Server error:", error);
    reply.status(500).send({ error: "Internal server error" });
  });

  return server;
}

export async function startServer(): Promise<void> {
  try {
    const server = await createServer();

    await server.listen({
      port: config.server.port,
      host: config.server.host,
    });

    logger.info(
      `Server listening on ${config.server.host}:${config.server.port}`
    );
  } catch (error) {
    logger.error("Failed to start server:", error);
    throw error;
  }
}
