import { GoogleGenerativeAI } from "@google/generative-ai";
import { DetectedItem, parseOCRResponse } from "./schema";

/**
 * Prompt optimizado para extracción de items de facturas
 * Diseñado para facturas en español con formatos de precio colombianos
 */
const EXTRACTION_PROMPT = `Analiza esta imagen de factura/recibo y extrae SOLO los productos o servicios comprados.

REGLAS IMPORTANTES:
1. Extrae ÚNICAMENTE líneas de productos/servicios individuales
2. IGNORA completamente:
   - Subtotales, totales, gran total
   - Impuestos (IVA, INC, etc.)
   - Descuentos globales
   - Propinas o cargos de servicio
   - Información del establecimiento
   - Fechas, números de factura, etc.

3. Para PRECIOS en formato colombiano:
   - El punto (.) es separador de MILES: 12.500 = 12500
   - La coma (,) es separador DECIMAL: 12.500,50 = 12500.50
   - Convierte siempre a número decimal estándar

4. Para CANTIDAD:
   - Si no es visible o no está especificada, asume 1
   - Busca indicadores como "x2", "2x", "Cant: 2", etc.

5. Para CONFIANZA (0 a 1):
   - 0.9-1.0: Texto perfectamente legible
   - 0.7-0.9: Legible con pequeñas dudas
   - 0.5-0.7: Parcialmente legible, posibles errores
   - < 0.5: Muy difícil de leer

6. Para NOMBRE del producto:
   - Usa el nombre tal como aparece en la factura
   - Mantén mayúsculas/minúsculas originales
   - No traduzcas ni modifiques

Responde ÚNICAMENTE con un objeto JSON válido en este formato exacto:
{
  "items": [
    {
      "name": "Nombre del producto",
      "quantity": 1,
      "unit_price": 12500.00,
      "confidence": 0.95
    }
  ]
}

Si no encuentras productos válidos, responde: {"items": []}
NO incluyas explicaciones, solo el JSON.`;

/**
 * Configuración del proveedor Gemini
 */
interface GeminiProviderConfig {
  apiKey: string;
  model?: string;
  maxRetries?: number;
}

/**
 * Proveedor OCR basado en Google Gemini
 * Usa capacidades multimodales para analizar imágenes de facturas
 */
export class GeminiOCRProvider {
  private client: GoogleGenerativeAI;
  private modelName: string;
  private maxRetries: number;

  constructor(config: GeminiProviderConfig) {
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.modelName = config.model ?? "gemini-3-flash-preview";
    this.maxRetries = config.maxRetries ?? 1;
  }

  /**
   * Extrae items de una imagen de factura
   * @param imageBuffer - Buffer de la imagen
   * @param mimeType - Tipo MIME de la imagen (image/jpeg, image/png, etc.)
   * @returns Array de items detectados
   */
  async extractItems(
    imageBuffer: Buffer,
    mimeType: string = "image/jpeg"
  ): Promise<DetectedItem[]> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1, // Baja temperatura para respuestas más consistentes
      },
    });

    // Convertir buffer a base64
    const base64Image = imageBuffer.toString("base64");

    let lastError: Error | null = null;

    // Intentar extracción con reintentos
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await model.generateContent([
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
          { text: EXTRACTION_PROMPT },
        ]);

        const response = result.response;
        const text = response.text();

        // Validar respuesta con Zod
        const parsed = parseOCRResponse(text);

        // Filtrar items con datos válidos
        const validItems = parsed.items.filter(
          (item) => item.name.trim().length > 0 && item.unit_price >= 0
        );

        return validItems;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Si es el último intento, no reintentar
        if (attempt === this.maxRetries) {
          break;
        }

        // Esperar antes de reintentar (backoff exponencial simple)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 500)
        );
      }
    }

    // Si todos los intentos fallaron, lanzar el último error
    console.error("[GeminiOCR] Todos los intentos fallaron:", lastError);
    throw new Error(
      `Error al procesar la factura con Gemini: ${lastError?.message ?? "Error desconocido"}`
    );
  }
}

/**
 * Crea una instancia del proveedor Gemini con la configuración del entorno
 */
export function createGeminiProvider(): GeminiOCRProvider {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GOOGLE_GEMINI_API_KEY no está configurada en las variables de entorno"
    );
  }

  return new GeminiOCRProvider({ apiKey });
}
