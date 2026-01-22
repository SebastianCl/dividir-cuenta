/**
 * Utilidades para formateo de moneda colombiana (COP)
 */

/**
 * Formatea un número como pesos colombianos
 * Ejemplo: 45000 -> "$45.000"
 */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formatea un número como pesos colombianos con decimales
 * Ejemplo: 45000.50 -> "$45.000,50"
 */
export function formatCOPWithDecimals(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Parsea un string de precio a número
 * Ejemplo: "$45.000" -> 45000
 */
export function parseCOP(value: string): number {
  // Remover símbolo de moneda y espacios
  const cleaned = value.replace(/[^\d.,]/g, '')
  // Reemplazar separador de miles (punto) y convertir coma decimal a punto
  const normalized = cleaned.replace(/\./g, '').replace(',', '.')
  return parseFloat(normalized) || 0
}

/**
 * Formatea número para input (sin símbolo de moneda)
 * Ejemplo: 45000 -> "45.000"
 */
export function formatNumberForInput(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Tipos para propina e impuestos
 */
export type TaxTipType = 'fixed' | 'percentage'

/**
 * Calcula el valor final de propina o impuesto
 */
export function calculateTaxTipValue(
  value: number,
  type: TaxTipType,
  subtotal: number
): number {
  if (type === 'percentage') {
    return subtotal * (Math.max(0, Math.min(value, 100)) / 100)
  }
  return Math.max(0, value) // Fixed amount, no negatives
}

/**
 * Calcula el total con propina e impuestos (nuevo)
 */
export function calculateTotalWithTaxAndTip(
  subtotal: number,
  tipType: TaxTipType = 'percentage',
  tipValue: number = 0,
  taxType: TaxTipType = 'percentage',
  taxValue: number = 0
): { tip: number; tax: number; total: number } {
  const tip = calculateTaxTipValue(tipValue, tipType, subtotal)
  const tax = calculateTaxTipValue(taxValue, taxType, subtotal)
  const total = subtotal + tip + tax
  return { tip, tax, total }
}

/**
 * Calcula el total con propina e IVA (compatible hacia atrás)
 */
export function calculateTotalWithExtras(
  subtotal: number,
  tipPercentage: number = 0,
  taxAmount: number = 0
): { tip: number; tax: number; total: number } {
  const tip = subtotal * (tipPercentage / 100)
  const total = subtotal + tip + taxAmount
  return { tip, tax: taxAmount, total }
}
