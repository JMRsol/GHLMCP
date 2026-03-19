import { AxiosInstance } from "axios";
export declare const GHL_BASE_URL = "https://services.leadconnectorhq.com";
export declare const GHL_VERSION = "2021-07-28";
export declare const CHARACTER_LIMIT = 50000;
export declare function getClient(): AxiosInstance;
export declare function getLocationId(): string;
export declare function formatError(error: unknown): string;
export declare function truncate(text: string): string;
//# sourceMappingURL=ghl.d.ts.map