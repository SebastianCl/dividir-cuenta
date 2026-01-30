'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, Participant, Item, Assignment } from '@/types/database'

interface SessionState {
  // Datos de la sesión actual
  session: Session | null
  participants: Participant[]
  items: Item[]
  assignments: Assignment[]
  
  // Participante actual (almaCuentado localmente)
  currentParticipant: Participant | null
  
  // Acciones
  setSession: (session: Session | null) => void
  setParticipants: (participants: Participant[]) => void
  addParticipant: (participant: Participant) => void
  removeParticipant: (id: string) => void
  setItems: (items: Item[]) => void
  addItem: (item: Item) => void
  updateItem: (id: string, updates: Partial<Item>) => void
  removeItem: (id: string) => void
  setAssignments: (assignments: Assignment[]) => void
  addAssignment: (assignment: Assignment) => void
  updateAssignment: (id: string, updates: Partial<Assignment>) => void
  removeAssignment: (id: string) => void
  setCurrentParticipant: (participant: Participant | null) => void
  
  // Selectores
  getItemAssignments: (itemId: string) => Assignment[]
  getParticipantTotal: (participantId: string) => number
  getUnassignedItems: () => Item[]
  
  // Reset
  reset: () => void
}

const initialState = {
  session: null,
  participants: [],
  items: [],
  assignments: [],
  currentParticipant: null,
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setSession: (session) => set({ session }),
      
      setParticipants: (participants) => set({ participants }),
      
      addParticipant: (participant) => 
        set((state) => ({ 
          participants: [...state.participants, participant] 
        })),
      
      removeParticipant: (id) =>
        set((state) => ({
          participants: state.participants.filter((p) => p.id !== id),
        })),
      
      setItems: (items) => set({ items }),
      
      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
        })),
      
      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),
      
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          // También eliminar asignaciones del item
          assignments: state.assignments.filter((a) => a.item_id !== id),
        })),
      
      setAssignments: (assignments) => set({ assignments }),
      
      addAssignment: (assignment) =>
        set((state) => ({
          assignments: [...state.assignments, assignment],
        })),
      
      updateAssignment: (id, updates) =>
        set((state) => ({
          assignments: state.assignments.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),
      
      removeAssignment: (id) =>
        set((state) => ({
          assignments: state.assignments.filter((a) => a.id !== id),
        })),
      
      setCurrentParticipant: (participant) => 
        set({ currentParticipant: participant }),
      
      getItemAssignments: (itemId) => {
        return get().assignments.filter((a) => a.item_id === itemId)
      },
      
      getParticipantTotal: (participantId) => {
        const { items, assignments } = get()
        let total = 0
        
        assignments
          .filter((a) => a.participant_id === participantId)
          .forEach((assignment) => {
            const item = items.find((i) => i.id === assignment.item_id)
            if (item) {
              total += item.total_price * assignment.share_fraction
            }
          })
        
        return total
      },
      
      getUnassignedItems: () => {
        const { items, assignments } = get()
        return items.filter(
          (item) => !assignments.some((a) => a.item_id === item.id)
        )
      },
      
      reset: () => set(initialState),
    }),
    {
      name: 'dividir-cuenta-storage',
      partialize: (state) => ({ 
        currentParticipant: state.currentParticipant 
      }),
    }
  )
)
