'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { getRandomColor } from '@/lib/colors'
import { Users, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function JoinSessionPage() {
  const router = useRouter()
  const params = useParams()
  const code = (params.code as string).toUpperCase()
  
  const [name, setName] = useState('')
  const [sessionName, setSessionName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      // Verificar si ya es participante
      const existingParticipantId = localStorage.getItem(`participant_${code}`)
      if (existingParticipantId) {
        router.push(`/s/${code}`)
        return
      }

      // Cargar info de la sesión
      const { data: session, error } = await supabase
        .from('sessions')
        .select('name, status')
        .eq('short_code', code)
        .single<{ name: string; status: string }>()

      if (error || !session || session.status !== 'active') {
        toast.error('No se encontró la cuenta o ya no está activa')
        router.push('/')
        return
      }

      setSessionName(session.name)
      setIsLoading(false)
    }

    checkSession()
  }, [code, router, supabase])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Por favor ingresa tu nombre')
      return
    }

    setIsJoining(true)
    try {
      // Obtener ID de la sesión
      const { data: session } = await supabase
        .from('sessions')
        .select('id')
        .eq('short_code', code)
        .single<{ id: string }>()

      if (!session) throw new Error('Session not found')

      // Crear participante
      const { data: participant, error } = await supabase
        .from('participants')
        .insert({
          session_id: session.id,
          name: name.trim(),
          color: getRandomColor(),
          is_owner: false,
        } as any)
        .select()
        .single<{ id: string }>()

      if (error) throw error

      // Guardar ID del participante en localStorage
      localStorage.setItem(`participant_${code}`, participant.id)

      toast.success(`¡Bienvenido a ${sessionName}!`)
      router.push(`/s/${code}`)
    } catch (error) {
      console.error('Error joining session:', error)
      toast.error('Error al unirse. Intenta de nuevo.')
    } finally {
      setIsJoining(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver al inicio
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Unirse a la cuenta
            </CardTitle>
            <CardDescription>
              Te estás uniendo a: <strong>{sessionName}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tu nombre</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Este nombre será visible para todos los participantes
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isJoining}>
                {isJoining ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uniéndose...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Unirse
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Código de la cuenta: <code className="font-mono bg-muted px-2 py-1 rounded">{code}</code>
          </p>
        </div>
      </div>
    </main>
  )
}
