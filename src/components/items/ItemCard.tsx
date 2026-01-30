'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Pencil,
  Trash2,
  Check,
  X,
  Users,
  AlertCircle
} from 'lucide-react'
import { formatCOP, parseCOP } from '@/lib/currency'
import { ParticipantAvatar } from '@/components/participants/ParticipantAvatar'
import { cn } from '@/lib/utils'
import type { Item, Assignment, Participant } from '@/types/database'

interface ItemCardProps {
  item: Item
  assignments: Assignment[]
  participants: Participant[]
  onEdit: (id: string, updates: Partial<Item>) => void
  onDelete: (id: string) => void
  onToggleAssignment: (itemId: string, participantId: string) => void
  isOwner?: boolean
}

export function ItemCard({
  item,
  assignments,
  participants,
  onEdit,
  onDelete,
  onToggleAssignment,
  isOwner = false,
}: ItemCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const [editPrice, setEditPrice] = useState(item.unit_price.toString())
  const [editQuantity, setEditQuantity] = useState(item.quantity.toString())
  const [showAssign, setShowAssign] = useState(false)

  const assignedParticipants = participants.filter((p) =>
    assignments.some((a) => a.participant_id === p.id)
  )

  const isUnassigned = assignments.length === 0
  const isShared = assignments.length > 1

  const handleSave = () => {
    onEdit(item.id, {
      name: editName,
      unit_price: parseCOP(editPrice),
      quantity: parseInt(editQuantity) || 1,
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditName(item.name)
    setEditPrice(item.unit_price.toString())
    setEditQuantity(item.quantity.toString())
    setIsEditing(false)
  }

  return (
    <Card className={cn(
      'transition-all',
      isUnassigned && 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/20'
    )}>
      <CardContent className="p-3">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nombre del producto"
              className="font-medium"
            />
            <div className="flex gap-2">
              <Input
                type="number"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                placeholder="Cant."
                className="w-20"
                min={1}
              />
              <Input
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="Precio"
                className="flex-1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium break-words leading-tight">{item.name}</span>
                  {item.quantity > 1 && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      x{item.quantity}
                    </Badge>
                  )}
                  {isShared && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      <Users className="h-3 w-3 mr-1" />
                      Compartido
                    </Badge>
                  )}
                </div>
                {item.ocr_confidence !== null && item.ocr_confidence < 0.8 && (
                  <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>Verificar datos</span>
                  </div>
                )}
              </div>
              <span className="font-semibold text-primary whitespace-nowrap shrink-0 ml-2">
                {formatCOP(item.total_price)}
              </span>
            </div>

            {/* Avatares asignados */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t">
              <div className="flex items-center gap-1">
                {isUnassigned ? (
                  <span className="text-xs text-orange-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Sin asignar
                  </span>
                ) : (
                  assignedParticipants.map((p) => (
                    <ParticipantAvatar
                      key={p.id}
                      name={p.name}
                      color={p.color}
                      size="sm"
                    />
                  ))
                )}
              </div>

              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAssign(!showAssign)}
                >
                  <Users className="h-4 w-4" />
                </Button>
                {isOwner && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => onDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Panel de asignación */}
            {showAssign && (
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">
                  ¿Quién consumió este producto?
                </p>
                <div className="flex flex-wrap gap-2">
                  {participants.map((p) => {
                    const isAssigned = assignments.some(
                      (a) => a.participant_id === p.id
                    )
                    return (
                      <ParticipantAvatar
                        key={p.id}
                        name={p.name}
                        color={p.color}
                        size="md"
                        selected={isAssigned}
                        onClick={() => onToggleAssignment(item.id, p.id)}
                        showName
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
