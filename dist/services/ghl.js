"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHARACTER_LIMIT = exports.GHL_VERSION = exports.GHL_BASE_URL = void 0;
exports.getClient = getClient;
exports.getLocationId = getLocationId;
exports.formatError = formatError;
exports.truncate = truncate;
const axios_1 = __importDefault(require("axios"));
exports.GHL_BASE_URL = "https://services.leadconnectorhq.com";
exports.GHL_VERSION = "2021-07-28";
exports.CHARACTER_LIMIT = 50000;
let apiClient = null;
function getClient() {
    const token = process.env.GHL_API_KEY;
    if (!token)
        throw new Error("GHL_API_KEY environment variable is not set");
    if (!apiClient) {
        apiClient = axios_1.default.create({
            baseURL: exports.GHL_BASE_URL,
            headers: {
                Authorization: `Bearer ${token}`,
                Version: exports.GHL_VERSION,
                "Content-Type": "application/json",
            },
            timeout: 15000,
        });
    }
    return apiClient;
}
function getLocationId() {
    const id = process.env.GHL_LOCATION_ID;
    if (!id)
        throw new Error("GHL_LOCATION_ID environment variable is not set");
    return id;
}
function formatError(error) {
    if (axios_1.default.isAxiosError(error)) {
        const axErr = error;
        const msg = axErr.response?.data?.message ||
            axErr.response?.data?.msg ||
            axErr.message;
        const status = axErr.response?.status;
        return `GHL API error ${status ?? ""}: ${msg}`.trim();
    }
    if (error instanceof Error)
        return error.message;
    return String(error);
}
function truncate(text) {
    if (text.length <= exports.CHARACTER_LIMIT)
        return text;
    return text.slice(0, exports.CHARACTER_LIMIT) + "\n\n[Response truncated — use pagination or narrower filters]";
}
//# sourceMappingURL=ghl.js.map