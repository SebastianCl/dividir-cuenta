'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { TaxTipType } from '@/lib/currency'

interface TaxTipInputProps {
  label: string
  type: TaxTipType
  value: number
  onTypeChange: (type: TaxTipType) => void
  onValueChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
}

export function TaxTipInput({
  label,
  type,
  value,
  onTypeChange,
  onValueChange,
  min = 0,
  max,
  disabled = false,
}: TaxTipInputProps) {
  const maxValue = type === 'percentage' ? 100 : max
  const suffix = type === 'percentage' ? '%' : '$'

  const handleTypeToggle = () => {
    onTypeChange(type === 'percentage' ? 'fixed' : 'percentage')
    onValueChange(0)
  }

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseFloat(e.target.value) || 0
    
    if (type === 'percentage') {
      const validValue = Math.max(0, Math.min(inputValue, 100))
      onValueChange(validValue)
    } else {
      const validValue = Math.max(0, inputValue)
      onValueChange(validValue)
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            type="number"
            value={value || ''}
            onChange={handleValueChange}
            min={min}
            max={maxValue}
            className="h-9"
            disabled={disabled}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTypeToggle}
          disabled={disabled}
          className="font-semibold min-w-[60px]"
        >
          {suffix}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {type === 'percentage'
          ? `Aplicará el ${value}% sobre el subtotal`
          : `Monto fijo: $${value.toLocaleString('es-CO')}`}
      </p>
    </div>
  )
}
