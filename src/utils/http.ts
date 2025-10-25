import https from "https";
import { URL } from "url";
import FormData from "form-data";
import { HttpResponse, HttpRequestOptions } from "../types/http";

export async function makeHttpRequest(
  options: HttpRequestOptions,
  formData: FormData
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    formData.pipe(req);
  });
}

export function buildRequestOptions(
  apiUrl: string,
  apiKey: string,
  formData: FormData
): HttpRequestOptions {
  const url = new URL(apiUrl);
  return {
    hostname: url.hostname,
    port: url.port ? parseInt(url.port) : 443,
    path: url.pathname + url.search,
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...formData.getHeaders(),
    },
  };
}

export function buildFormData(
  audioBuffer: Buffer,
  payload: Record<string, string>
): FormData {
  const formData = new FormData();
  formData.append("file", audioBuffer, {
    filename: "voice.ogg",
    contentType: "application/octet-stream",
  });

  Object.entries(payload).forEach(([key, value]) => {
    formData.append(key, value);
  });

  return formData;
}
