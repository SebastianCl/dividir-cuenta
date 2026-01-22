/**
 * Módulo OCR - Exportaciones principales
 *
 * Provee funcionalidad de extracción de datos de facturas usando
 * Google Gemini como motor de análisis multimodal.
 */

export { GeminiOCRProvider, createGeminiProvider } from "./gemini-provider";
export { parseOCRResponse } from "./schema";
export type { DetectedItem, OCRResponse } from "./schema";
export { checkRateLimit, RateLimitError, ocrRateLimiter } from "./rate-limiter";
