import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ParticipantData {
  id: string
  session_id: string
  is_owner: boolean
}

interface SessionData {
  id: string
  status: string
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, participantId } = await request.json()

    if (!sessionId || !participantId) {
      return NextResponse.json(
        { error: 'Se requieren sessionId y participantId' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar que el participante existe y es el owner
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('id, session_id, is_owner')
      .eq('id', participantId)
      .eq('session_id', sessionId)
      .single<ParticipantData>()

    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'Participante no encontrado' },
        { status: 404 }
      )
    }

    if (!participant.is_owner) {
      return NextResponse.json(
        { error: 'Solo el creador de la cuenta puede finalizarla' },
        { status: 403 }
      )
    }

    // Verificar que la sesión existe y está activa
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, status')
      .eq('id', sessionId)
      .single<SessionData>()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    if (session.status !== 'active') {
      return NextResponse.json(
        { error: 'La sesión ya no está activa' },
        { status: 400 }
      )
    }

    // Eliminar la sesión directamente (CASCADE eliminará todos los datos relacionados)
    // Los usuarios serán notificados via el evento DELETE de realtime
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)

    if (deleteError) {
      console.error('Error al eliminar sesión:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar la sesión' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Cuenta finalizada correctamente'
    })

  } catch (error) {
    console.error('Error en finalize-session:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
