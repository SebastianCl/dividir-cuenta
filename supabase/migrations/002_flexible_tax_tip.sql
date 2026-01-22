-- Migración: Actualizar campos de propina e impuestos para soportar valor fijo y porcentaje
-- Fecha: 2026-01-21

-- Agregar nuevos campos a tabla sessions
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS tip_type VARCHAR(20) DEFAULT 'percentage' CHECK (tip_type IN ('fixed', 'percentage')),
ADD COLUMN IF NOT EXISTS tip_value DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_type VARCHAR(20) DEFAULT 'percentage' CHECK (tax_type IN ('fixed', 'percentage')),
ADD COLUMN IF NOT EXISTS tax_value DECIMAL(12,2) DEFAULT 0;

-- Migrar datos existentes (si existen registros previos)
-- Asumiendo que tip_percentage es un porcentaje y tax_amount es un monto fijo
UPDATE sessions
SET 
  tip_type = 'percentage',
  tip_value = COALESCE(tip_percentage, 0),
  tax_type = 'fixed',
  tax_value = COALESCE(tax_amount, 0)
WHERE tip_type IS NULL OR tax_type IS NULL;

-- Comentario: Los campos antiguos tip_percentage y tax_amount pueden ser deprecados
-- pero se mantienen por compatibilidad hacia atrás durante la transición.
-- Se pueden eliminar en una migración futura después de confirmarse la migración de datos.

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_sessions_tip_type ON sessions(tip_type);
CREATE INDEX IF NOT EXISTS idx_sessions_tax_type ON sessions(tax_type);
