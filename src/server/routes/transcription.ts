import { FastifyInstance, FastifyRequest } from "fastify";
import { MultipartFile } from "@fastify/multipart";
import logger from "../../utils/logger";
import { transcribeAudio } from "../../services/transcription";

interface TranscriptionRequest {
  Body: {
    audio: MultipartFile;
  };
}

export async function transcriptionRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/transcribe",
    async (request: FastifyRequest<TranscriptionRequest>, reply) => {
      try {
        const audio = await request.file();

        if (!audio) {
          return reply.status(400).send({ error: "No audio file provided" });
        }

        logger.info(
          `Received audio file: ${audio.filename}, size: ${audio.file.bytesRead}`
        );

        const buffer = await audio.toBuffer();

        const transcription = await transcribeAudio(buffer);

        logger.info(
          `Transcription completed: ${transcription.substring(0, 100)}...`
        );

        return {
          success: true,
          transcription,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        logger.error("Transcription error:", error);
        return reply.status(500).send({
          error: "Failed to transcribe audio",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  fastify.get("/health", async (_request, _reply) => {
    return {
      status: "ok",
      service: "transcription",
      timestamp: new Date().toISOString(),
    };
  });
}
