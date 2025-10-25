import { config } from "../config";
import logger from "../utils/logger";
import {
  CLOUDRU_API,
  HTTP_STATUS,
  TRANSCRIPTION_CONFIG,
} from "../constants/api";
import {
  makeHttpRequest,
  buildRequestOptions,
  buildFormData,
} from "../utils/http";
import {
  TranscriptionError,
  handleTranscriptionError,
  validateTranscriptionResponse,
} from "../utils/errors";
import { TranscriptionResponse } from "../types/transcription";

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    logger.info("Starting audio transcription with Cloud.ru Whisper API");

    const payload = {
      model: CLOUDRU_API.MODEL,
      response_format: TRANSCRIPTION_CONFIG.RESPONSE_FORMAT,
      temperature: TRANSCRIPTION_CONFIG.TEMPERATURE,
      language: CLOUDRU_API.DEFAULT_LANGUAGE,
    };

    const formData = buildFormData(audioBuffer, payload);
    const apiUrl = `${CLOUDRU_API.BASE_URL}${CLOUDRU_API.ENDPOINTS.TRANSCRIPTION}`;

    logRequestDetails(apiUrl, payload, formData);

    const options = buildRequestOptions(
      apiUrl,
      config.cloudru.apiKey,
      formData
    );
    const response = await makeHttpRequest(options, formData);

    logResponseDetails(response);

    if (response.statusCode !== HTTP_STATUS.OK) {
      return await handleFailedRequest(response, formData);
    }

    const result = JSON.parse(response.body) as TranscriptionResponse;
    const transcriptionText = validateTranscriptionResponse(result);

    logger.info(
      `Transcription completed successfully: ${transcriptionText.substring(
        0,
        TRANSCRIPTION_CONFIG.MAX_LOG_LENGTH
      )}...`
    );

    return transcriptionText;
  } catch (error) {
    logger.error("Error transcribing audio:", error);
    throw handleTranscriptionError(error);
  }
}

async function handleFailedRequest(
  response: any,
  formData: any
): Promise<string> {
  if (response.statusCode === HTTP_STATUS.NOT_FOUND) {
    logger.warn("Trying alternative endpoints...");

    for (const endpoint of CLOUDRU_API.ENDPOINTS.ALTERNATIVE_TRANSCRIPTION) {
      logger.info(`Trying alternative endpoint: ${endpoint}`);

      try {
        const altOptions = buildRequestOptions(
          endpoint,
          config.cloudru.apiKey,
          formData
        );
        const altResponse = await makeHttpRequest(altOptions, formData);

        if (altResponse.statusCode === HTTP_STATUS.OK) {
          logger.info(`Success with alternative endpoint: ${endpoint}`);
          const result = JSON.parse(altResponse.body) as TranscriptionResponse;
          return validateTranscriptionResponse(result);
        } else {
          logger.warn(
            `Alternative endpoint ${endpoint} also failed: ${altResponse.statusCode}`
          );
        }
      } catch (error) {
        logger.warn(`Error trying alternative endpoint ${endpoint}:`, error);
      }
    }
  }

  throw handleTranscriptionError(
    new Error(`Transcription failed: ${response.statusCode} ${response.body}`),
    response.statusCode
  );
}

function logRequestDetails(apiUrl: string, payload: any, formData: any): void {
  logger.info(`Making request to: ${apiUrl}`);
  logger.info(
    `API Key (first 10 chars): ${config.cloudru.apiKey.substring(0, 10)}...`
  );
  logger.info(`Form data headers: ${JSON.stringify(formData.getHeaders())}`);
  logger.info(`Payload: ${JSON.stringify(payload)}`);
}

function logResponseDetails(response: any): void {
  logger.info(`Response status: ${response.statusCode}`);
  logger.info(`Response headers: ${JSON.stringify(response.headers)}`);
  logger.info(`Response body: ${response.body}`);
}

export async function transcribeAudioOffline(
  audioBuffer: Buffer
): Promise<string> {
  // TODO: Implement Vosk for offline transcription
  // This would require additional setup and model files
  logger.warn("Offline transcription not implemented yet");
  throw new TranscriptionError(
    "Offline transcription not implemented. Please configure Cloud.ru API."
  );
}
