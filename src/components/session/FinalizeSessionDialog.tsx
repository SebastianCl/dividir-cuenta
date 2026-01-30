'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/store/session-store'

interface FinalizeSessionDialogProps {
  sessionId: string
  sessionCode: string
  sessionName: string
  participantId: string
}

export function FinalizeSessionDialog({
  sessionId,
  sessionCode,
  sessionName,
  participantId,
}: FinalizeSessionDialogProps) {
  const router = useRouter()
  const { reset } = useSessionStore()
  
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'initial' | 'confirm'>('initial')
  const [confirmText, setConfirmText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const expectedConfirmText = 'FINALIZAR'

  const handleInitialConfirm = () => {
    setStep('confirm')
  }

  const handleFinalConfirm = async () => {
    if (confirmText !== expectedConfirmText) {
      toast.error(`Escribe "${expectedConfirmText}" para confirmar`)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/finalize-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          participantId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al finalizar la cuenta')
      }

      // Limpiar datos locales
      localStorage.removeItem(`participant_${sessionCode}`)
      reset()

      toast.success('Cuenta finalizada correctamente')
      
      // Construir URL con parámetros
      const params = new URLSearchParams()
      if (sessionName) {
        params.set('name', sessionName)
      }
      
      // Redirigir a la página de cierre
      router.push(`/s/${sessionCode}/closed?${params.toString()}`)
    } catch (error) {
      console.error('Error al finalizar:', error)
      toast.error(error instanceof Error ? error.message : 'Error al finalizar la cuenta')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setStep('initial')
    setConfirmText('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose()
      else setIsOpen(true)
    }}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Finalizar cuenta
        </Button>
      </DialogTrigger>
      
      <DialogContent showCloseButton={!isLoading}>
        {step === 'initial' ? (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <DialogTitle className="text-center">
                ¿Finalizar cuenta?
              </DialogTitle>
              <DialogDescription className="text-center">
                Estás a punto de finalizar la cuenta <strong>&quot;{sessionName}&quot;</strong>.
                <br /><br />
                Esta acción es <strong className="text-destructive">irreversible</strong> y eliminará:
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-2 rounded-lg bg-muted p-4 text-sm">
              <p>• Todos los productos de la cuenta</p>
              <p>• Todas las asignaciones de participantes</p>
              <p>• Los datos de todos los participantes</p>
              <p>• La información de la sesión</p>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Los demás participantes serán notificados del cierre.
            </p>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleInitialConfirm}>
                Continuar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <DialogTitle className="text-center">
                Confirmar finalización
              </DialogTitle>
              <DialogDescription className="text-center">
                Para confirmar, escribe <strong>{expectedConfirmText}</strong> en el campo de abajo.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-text">Confirmación</Label>
              <Input
                id="confirm-text"
                placeholder={`Escribe ${expectedConfirmText}`}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                disabled={isLoading}
                autoComplete="off"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => setStep('initial')}
                disabled={isLoading}
              >
                Volver
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleFinalConfirm}
                disabled={isLoading || confirmText !== expectedConfirmText}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Finalizando...
                  </>
                ) : (
                  'Finalizar cuenta'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
