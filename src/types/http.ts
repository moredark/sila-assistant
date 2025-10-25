export interface HttpResponse {
  statusCode: number;
  headers: any;
  body: string;
}

export interface HttpRequestOptions {
  hostname: string;
  port?: number;
  path: string;
  method: string;
  headers: Record<string, string>;
}
