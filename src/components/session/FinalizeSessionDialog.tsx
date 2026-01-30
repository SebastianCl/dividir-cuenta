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
    const [isLoading, setIsLoading] = useState(false)

    const handleConfirm = async () => {
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
        if (!isLoading) {
            setIsOpen(false)
        }
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
                </div>

                <p className="text-sm text-muted-foreground text-center">
                    Los demás participantes serán notificados del cierre.
                </p>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={isLoading}>
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
            </DialogContent>
        </Dialog>
    )
}
