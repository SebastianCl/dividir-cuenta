'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSessionStore } from '@/store/session-store'
import type { Item, Participant, Assignment, Session } from '@/types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtime(sessionId: string | null) {
  const {
    setSession,
    setParticipants,
    addParticipant,
    removeParticipant,
    setItems,
    addItem,
    updateItem,
    removeItem,
    setAssignments,
    addAssignment,
    updateAssignment,
    removeAssignment,
  } = useSessionStore()

  const supabase = createClient()

  // Cargar datos iniciales
  const loadInitialData = useCallback(async () => {
    if (!sessionId) return

    // Cargar sesión
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single<{ id: string }>()

    if (session) {
      setSession(session as Session)
    }

    // Cargar participantes
    const { data: participants } = await supabase
      .from('participants')
      .select('*')
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: true })
      .returns<Participant[]>()

    if (participants) {
      setParticipants(participants)
    }

    // Cargar items
    const { data: items } = await supabase
      .from('items')
      .select('*')
      .eq('session_id', sessionId)
      .order('order_index', { ascending: true })
      .returns<Item[]>()

    if (items) {
      setItems(items)
    }

    // Cargar asignaciones
    const { data: assignments } = await supabase
      .from('assignments')
      .select('*')
      .returns<Assignment[]>()

    if (assignments && items) {
      // Filtrar solo las asignaciones de items de esta sesión
      const itemIds = items.map((i) => i.id)
      const sessionAssignments = assignments.filter((a) =>
        itemIds.includes(a.item_id)
      )
      setAssignments(sessionAssignments)
    }
  }, [sessionId, supabase, setSession, setParticipants, setItems, setAssignments])

  useEffect(() => {
    if (!sessionId) return

    loadInitialData()

    // Suscribirse a cambios en tiempo real
    const channel: RealtimeChannel = supabase
      .channel(`session:${sessionId}`)
      // Cambios en sesión
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setSession(payload.new as Session)
          }
        }
      )
      // Cambios en participantes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              addParticipant(payload.new as Participant)
              break
            case 'DELETE':
              removeParticipant((payload.old as Participant).id)
              break
          }
        }
      )
      // Cambios en items
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              addItem(payload.new as Item)
              break
            case 'UPDATE':
              updateItem((payload.new as Item).id, payload.new as Item)
              break
            case 'DELETE':
              removeItem((payload.old as Item).id)
              break
          }
        }
      )
      // Cambios en asignaciones
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments',
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              addAssignment(payload.new as Assignment)
              break
            case 'UPDATE':
              updateAssignment(
                (payload.new as Assignment).id,
                payload.new as Assignment
              )
              break
            case 'DELETE':
              removeAssignment((payload.old as Assignment).id)
              break
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [
    sessionId,
    supabase,
    loadInitialData,
    setSession,
    addParticipant,
    removeParticipant,
    addItem,
    updateItem,
    removeItem,
    addAssignment,
    updateAssignment,
    removeAssignment,
  ])

  return { reload: loadInitialData }
}
