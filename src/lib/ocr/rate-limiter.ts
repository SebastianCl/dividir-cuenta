/**
 * Rate limiter simple en memoria para controlar llamadas al API
 * Implementa ventana deslizante para límites por minuto
 */

interface RateLimiterConfig {
  /** Máximo de requests permitidos en la ventana */
  maxRequests: number;
  /** Ventana de tiempo en milisegundos */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

class RateLimiter {
  private timestamps: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(config: RateLimiterConfig) {
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
  }

  /**
   * Verifica si se puede hacer una nueva request
   * @returns Resultado con estado y metadata
   */
  check(): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Limpiar timestamps fuera de la ventana
    this.timestamps = this.timestamps.filter((t) => t > windowStart);

    const remaining = Math.max(0, this.maxRequests - this.timestamps.length);
    const oldestInWindow = this.timestamps[0];
    const resetInMs = oldestInWindow
      ? oldestInWindow + this.windowMs - now
      : this.windowMs;

    if (this.timestamps.length >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetInMs,
      };
    }

    return {
      allowed: true,
      remaining: remaining - 1, // -1 porque vamos a consumir uno
      resetInMs,
    };
  }

  /**
   * Registra una request (llamar solo si check().allowed es true)
   */
  record(): void {
    this.timestamps.push(Date.now());
  }

  /**
   * Verifica y registra en una sola operación
   * @returns true si se permitió, false si se rechazó
   */
  tryAcquire(): RateLimitResult {
    const result = this.check();
    if (result.allowed) {
      this.record();
    }
    return result;
  }
}

/**
 * Rate limiter para el API de OCR
 * Configurado para el tier gratuito de Gemini: 15 RPM
 */
export const ocrRateLimiter = new RateLimiter({
  maxRequests: 15, // 15 requests
  windowMs: 60 * 1000, // por minuto
});

/**
 * Error personalizado para rate limiting
 */
export class RateLimitError extends Error {
  public readonly resetInMs: number;
  public readonly statusCode = 429;

  constructor(resetInMs: number) {
    const seconds = Math.ceil(resetInMs / 1000);
    super(
      `Límite de requests alcanzado. Intenta de nuevo en ${seconds} segundos.`
    );
    this.name = "RateLimitError";
    this.resetInMs = resetInMs;
  }
}

/**
 * Middleware helper para verificar rate limit
 * @throws RateLimitError si se excede el límite
 */
export function checkRateLimit(): void {
  const result = ocrRateLimiter.tryAcquire();

  if (!result.allowed) {
    throw new RateLimitError(result.resetInMs);
  }
}
