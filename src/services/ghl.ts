import axios, { AxiosInstance, AxiosError } from "axios";

export const GHL_BASE_URL = "https://services.leadconnectorhq.com";
export const GHL_VERSION = "2021-07-28";
export const CHARACTER_LIMIT = 50000;

let apiClient: AxiosInstance | null = null;

export function getClient(): AxiosInstance {
  const token = process.env.GHL_API_KEY;
  if (!token) throw new Error("GHL_API_KEY environment variable is not set");
  if (!apiClient) {
    apiClient = axios.create({
      baseURL: GHL_BASE_URL,
      headers: {
        Authorization: `Bearer ${token}`,
        Version: GHL_VERSION,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });
  }
  return apiClient;
}

export function getLocationId(): string {
  const id = process.env.GHL_LOCATION_ID;
  if (!id) throw new Error("GHL_LOCATION_ID environment variable is not set");
  return id;
}

export function formatError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axErr = error as AxiosError<{ message?: string; msg?: string }>;
    const msg =
      axErr.response?.data?.message ||
      axErr.response?.data?.msg ||
      axErr.message;
    const status = axErr.response?.status;
    return `GHL API error ${status ?? ""}: ${msg}`.trim();
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

export function truncate(text: string): string {
  if (text.length <= CHARACTER_LIMIT) return text;
  return text.slice(0, CHARACTER_LIMIT) + "\n\n[Response truncated — use pagination or narrower filters]";
}
