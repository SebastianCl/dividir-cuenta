import { z } from "zod";

/**
 * Schema para un item detectado en la factura
 */
export const DetectedItemSchema = z.object({
  name: z.string().min(1, "El nombre del producto es requerido"),
  quantity: z.number().positive("La cantidad debe ser positiva").default(1),
  unit_price: z.number().nonnegative("El precio no puede ser negativo"),
  confidence: z.number().min(0).max(1).default(0.8),
});

/**
 * Schema para la respuesta completa del OCR
 */
export const OCRResponseSchema = z.object({
  items: z.array(DetectedItemSchema),
});

/**
 * Tipos inferidos de los schemas
 */
export type DetectedItem = z.infer<typeof DetectedItemSchema>;
export type OCRResponse = z.infer<typeof OCRResponseSchema>;

/**
 * Valida y parsea la respuesta del LLM
 * @param data - Datos crudos del LLM (string JSON o objeto)
 * @returns Respuesta validada o error
 */
export function parseOCRResponse(data: unknown): OCRResponse {
  // Si es string, intentar parsear como JSON
  if (typeof data === "string") {
    try {
      // Limpiar posibles marcadores de código markdown
      const cleanedData = data
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/gi, "")
        .trim();
      data = JSON.parse(cleanedData);
    } catch {
      throw new Error("La respuesta del modelo no es JSON válido");
    }
  }

  // Validar con Zod
  const result = OCRResponseSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new Error(`Respuesta inválida del OCR: ${errors}`);
  }

  return result.data;
}
