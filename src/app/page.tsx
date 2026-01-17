'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { generateSessionCode, isValidSessionCode } from '@/lib/generate-code'
import { getRandomColor } from '@/lib/colors'
import { Utensils, Plus, Users, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function HomePage() {
  const router = useRouter()
  const [creatorName, setCreatorName] = useState('')
  const [sessionName, setSessionName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  
  const supabase = createClient()

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!creatorName.trim()) {
      toast.error('Por favor ingresa tu nombre')
      return
    }

    setIsCreating(true)
    try {
      const code = generateSessionCode()
      
      // Crear sesión
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          short_code: code,
          name: sessionName.trim() || 'Mi Cena',
        } as any)
        .select()
        .single()

      if (sessionError) throw sessionError

      // Crear participante (creador)
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .insert({
          session_id: (session as any).id,
          name: creatorName.trim(),
          color: getRandomColor(),
          is_owner: true,
        } as any)
        .select()
        .single()

      if (participantError) throw participantError

      // Guardar ID del participante en localStorage
      localStorage.setItem(`participant_${code}`, (participant as any).id)

      toast.success('¡Cena creada!')
      router.push(`/s/${code}`)
    } catch (error) {
      console.error('Error creating session:', error)
      toast.error('Error al crear la cena. Intenta de nuevo.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = joinCode.trim().toUpperCase()
    
    if (!isValidSessionCode(code)) {
      toast.error('Código inválido. Debe tener 6 caracteres.')
      return
    }

    setIsJoining(true)
    try {
      // Verificar que la sesión existe
      const { data: session, error } = await supabase
        .from('sessions')
        .select('id, status')
        .eq('short_code', code)
        .single()

      if (error || !session) {
        toast.error('No se encontró la cena. Verifica el código.')
        return
      }

      if ((session as any).status !== 'active') {
        toast.error('Esta cena ya no está activa.')
        return
      }

      // Verificar si ya es participante
      const existingParticipantId = localStorage.getItem(`participant_${code}`)
      if (existingParticipantId) {
        router.push(`/s/${code}`)
        return
      }

      // Redirigir a página de unirse
      router.push(`/s/${code}/join`)
    } catch (error) {
      console.error('Error joining session:', error)
      toast.error('Error al buscar la cena. Intenta de nuevo.')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Utensils className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Dividir Cena</h1>
          <p className="text-muted-foreground">
            Divide la cuenta del restaurante de forma fácil y justa
          </p>
        </div>

        {/* Crear nueva cena */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Crear nueva cena
            </CardTitle>
            <CardDescription>
              Inicia una sesión y comparte el enlace con tus amigos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="creatorName">Tu nombre</Label>
                <Input
                  id="creatorName"
                  placeholder="Ej: Juan"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionName">Nombre de la cena (opcional)</Label>
                <Input
                  id="sessionName"
                  placeholder="Ej: Cumpleaños de María"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear cena
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-2 text-xs text-muted-foreground uppercase">
              o
            </span>
          </div>
        </div>

        {/* Unirse a cena existente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Unirse a una cena
            </CardTitle>
            <CardDescription>
              Ingresa el código que te compartieron
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinSession} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="joinCode">Código de la cena</Label>
                <Input
                  id="joinCode"
                  placeholder="Ej: ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-lg font-mono tracking-widest uppercase"
                  required
                />
              </div>
              <Button type="submit" variant="outline" className="w-full" disabled={isJoining}>
                {isJoining ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando...
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

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          🇨🇴 Optimizado para pesos colombianos
        </p>
      </div>
    </main>
  )
}
