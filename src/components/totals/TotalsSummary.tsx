'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ParticipantAvatar } from '@/components/participants/ParticipantAvatar'
import { TaxTipInput } from './TaxTipInput'

import { useSessionStore } from '@/store/session-store'
import { formatCOP, calculateTotalWithTaxAndTip, type TaxTipType } from '@/lib/currency'
import { createClient } from '@/lib/supabase/client'
import { Copy, Check, Receipt } from 'lucide-react'
import { toast } from 'sonner'

export function TotalsSummary() {
  const { session, participants, items, assignments, getParticipantTotal } = useSessionStore()
  const [tipType, setTipType] = useState<TaxTipType>(session?.tip_type || 'percentage')
  const [tipValue, setTipValue] = useState(session?.tip_value || 0)
  const [taxType, setTaxType] = useState<TaxTipType>(session?.tax_type || 'percentage')
  const [taxValue, setTaxValue] = useState(session?.tax_value || 0)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
  const { tip, tax, total } = calculateTotalWithTaxAndTip(
    subtotal,
    tipType,
    tipValue,
    taxType,
    taxValue
  )

  const getParticipantFinalTotal = (participantId: string) => {
    const participantSubtotal = getParticipantTotal(participantId)
    if (subtotal === 0) return 0

    const proportion = participantSubtotal / subtotal
    const participantTip = tip * proportion
    const participantTax = tax * proportion

    return participantSubtotal + participantTip + participantTax
  }

  const handleTipTypeChange = async (newType: TaxTipType) => {
    setTipType(newType)
    if (session) {
      await supabase
        .from('sessions')
        // @ts-expect-error - Supabase types inference issue
        .update({ tip_type: newType })
        .eq('id', session.id)
    }
  }

  const handleTipValueChange = async (value: number) => {
    setTipValue(value)
    if (session) {
      await supabase
        .from('sessions')
        // @ts-expect-error - Supabase types inference issue
        .update({ tip_value: value })
        .eq('id', session.id)
    }
  }

  const handleTaxTypeChange = async (newType: TaxTipType) => {
    setTaxType(newType)
    if (session) {
      await supabase
        .from('sessions')
        // @ts-expect-error - Supabase types inference issue
        .update({ tax_type: newType })
        .eq('id', session.id)
    }
  }

  const handleTaxValueChange = async (value: number) => {
    setTaxValue(value)
    if (session) {
      await supabase
        .from('sessions')
        // @ts-expect-error - Supabase types inference issue
        .update({ tax_value: value })
        .eq('id', session.id)
    }
  }

  const generateSummary = () => {
    const sessionName = session?.name && session.name !== 'Mi cuenta' && session.name !== 'Mi Cena' ? ` ${session.name}` : ''
    let summary = `🍽️ *Resumen${sessionName}*\n`
    summary += `━━━━━━━━━━━━━━━━━━\n\n`

    participants.forEach((p) => {
      const total = getParticipantFinalTotal(p.id)
      summary += `👤 ${p.name}: ${formatCOP(total)}\n`
    })

    summary += `\n━━━━━━━━━━━━━━━━━━\n`
    summary += `📊 Subtotal: ${formatCOP(subtotal)}\n`
    if (tipValue > 0) {
      const tipLabel = tipType === 'percentage' ? `${tipValue}%` : ''
      summary += `💰 Propina${tipLabel ? ` (${tipLabel})` : ''}: ${formatCOP(tip)}\n`
    }
    if (taxValue > 0) {
      const taxLabel = taxType === 'percentage' ? `${taxValue}%` : ''
      summary += `🧾 Impuestos${taxLabel ? ` (${taxLabel})` : ''}: ${formatCOP(tax)}\n`
    }
    summary += `💵 *Total: ${formatCOP(total)}*`

    return summary
  }

  const handleCopy = async () => {
    const summary = generateSummary()
    await navigator.clipboard.writeText(summary)
    setCopied(true)
    toast.success('Resumen copiado al portapapeles')
    setTimeout(() => setCopied(false), 2000)
  }

  const unassignedTotal = items
    .filter((item) => !assignments.some((a) => a.item_id === item.id))
    .reduce((sum, item) => sum + item.total_price, 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Receipt className="h-5 w-5" />
          Resumen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Totales por persona */}
        <div className="space-y-2">
          {participants.map((p) => {
            const participantTotal = getParticipantFinalTotal(p.id)
            return (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ParticipantAvatar
                    name={p.name}
                    color={p.color}
                    size="sm"
                  />
                  <span className="text-sm">{p.name}</span>
                </div>
                <span className="font-semibold">
                  {formatCOP(participantTotal)}
                </span>
              </div>
            )
          })}
        </div>

        {unassignedTotal > 0 && (
          <div className="flex items-center justify-between text-orange-600 text-sm">
            <span>⚠️ Sin asignar</span>
            <span>{formatCOP(unassignedTotal)}</span>
          </div>
        )}

        <Separator />

        {/* Configuración de propina e impuestos */}
        <div className="grid grid-cols-2 gap-3">
          <TaxTipInput
            label="Propina"
            type={tipType}
            value={tipValue}
            onTypeChange={handleTipTypeChange}
            onValueChange={handleTipValueChange}
            max={999999}
          />
          <TaxTipInput
            label="Impuestos (IVA)"
            type={taxType}
            value={taxValue}
            onTypeChange={handleTaxTypeChange}
            onValueChange={handleTaxValueChange}
            max={999999}
          />
        </div>

        <Separator />

        {/* Totales */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCOP(subtotal)}</span>
          </div>
          {tipValue > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Propina {tipType === 'percentage' ? `(${tipValue}%)` : ''}
              </span>
              <span>{formatCOP(tip)}</span>
            </div>
          )}
          {taxValue > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Impuestos {taxType === 'percentage' ? `(${taxValue}%)` : ''}
              </span>
              <span>{formatCOP(tax)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2">
            <span>Total</span>
            <span className="text-primary">{formatCOP(total)}</span>
          </div>
        </div>

        {/* Botón copiar */}
        <Button className="w-full" onClick={handleCopy}>
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copiar resumen
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
