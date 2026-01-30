'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'

import { useSessionStore } from '@/store/session-store'
import { useRealtime } from '@/hooks/useRealtime'
import { ParticipantList } from '@/components/participants/ParticipantList'
import { ReceiptCapture } from '@/components/receipt/ReceiptCapture'
import { ItemList } from '@/components/items/ItemList'
import { TotalsSummary } from '@/components/totals/TotalsSummary'
import { 
  Share2, 
  Loader2, 
  ArrowLeft, 
  Camera, 
  ShoppingCart, 
  Receipt,
  Check
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Session } from '@/types/database'
import { FinalizeSessionDialog } from '@/components/session/FinalizeSessionDialog'

type TabType = 'capture' | 'items' | 'summary'

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const code = (params.code as string).toUpperCase()
  
  const [isLoading, setIsLoading] = useState(true)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('items')
  const [isProcessingOCR, setIsProcessingOCR] = useState(false)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const { session, currentParticipant, setCurrentParticipant } = useSessionStore()
  const supabase = createClient()
  
  // Activar realtime
  useRealtime(sessionId)

  const initializeSession = useCallback(async () => {
    try {
      // Buscar sesión por código
      const { data: sessionData, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('short_code', code)
        .single<{ id: string; status: string; receipt_image_url?: string; name?: string }>()

      if (error || !sessionData) {
        toast.error('No se encontró la cuenta')
        router.push('/')
        return
      }

      if (sessionData.status !== 'active') {
        toast.error('Esta cuenta ya no está activa')
        router.push('/')
        return
      }

      setSessionId(sessionData.id)

      // Verificar participante
      const participantId = localStorage.getItem(`participant_${code}`)
      if (!participantId) {
        router.push(`/s/${code}/join`)
        return
      }

      // Obtener datos del participante
      const { data: participant } = await supabase
        .from('participants')
        .select('*')
        .eq('id', participantId)
        .single<import('@/types/database').Participant>()

      if (!participant) {
        localStorage.removeItem(`participant_${code}`)
        router.push(`/s/${code}/join`)
        return
      }

      setCurrentParticipant(participant)
      setIsOwner(participant.is_owner ?? false)

      // Cargar preview de imagen si existe
      if (sessionData.receipt_image_url) {
        setReceiptPreview(sessionData.receipt_image_url)
      }

      setIsLoading(false)
    } catch (error) {
      console.error('Error initializing session:', error)
      toast.error('Error al cargar la cuenta')
      router.push('/')
    }
  }, [code, router, supabase, setCurrentParticipant])

  useEffect(() => {
    initializeSession()
  }, [initializeSession])

  const handleShare = async () => {
    const url = `${window.location.origin}/s/${code}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Únete a ${session?.name || 'la cuenta'}`,
          text: `¡Únete para dividir la cuenta! Código: ${code}`,
          url,
        })
      } catch {
        // Usuario canceló o error
      }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Enlace copiado al portapapeles')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleReceiptCapture = async (file: File) => {
    if (!sessionId) return

    setIsProcessingOCR(true)
    setActiveTab('capture')
    
    // Crear preview local
    const previewUrl = URL.createObjectURL(file)
    setReceiptPreview(previewUrl)

    try {
      // Subir imagen a Supabase Storage
      const fileName = `${sessionId}/${Date.now()}.jpg`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Error uploading:', uploadError)
        // Continuar con OCR local aunque falle el upload
      }

      // Obtener URL pública
      let publicUrl = previewUrl
      if (uploadData) {
        const { data: { publicUrl: url } } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName)
        publicUrl = url

        // Actualizar sesión con URL de imagen
        await supabase
          .from('sessions')
          // @ts-expect-error - Supabase types inference issue
          .update({ receipt_image_url: publicUrl })
          .eq('id', sessionId)
      }

      // Llamar API de OCR
      const formData = new FormData()
      formData.append('image', file)
      formData.append('sessionId', sessionId)

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('OCR failed')
      }

      const { items } = await response.json()

      // Los items se agregan automáticamente via realtime cuando se insertan en la BD
      // No es necesario agregarlos manualmente aquí, ya que causaría duplicación

      toast.success(`${items.length} productos detectados`)
      setActiveTab('items')
    } catch (error) {
      console.error('OCR Error:', error)
      toast.error('Error al procesar la factura. Puedes agregar productos manualmente.')
      setActiveTab('items')
    } finally {
      setIsProcessingOCR(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando cuenta...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-semibold truncate max-w-48">
                {session?.name || 'Cargando...'}
              </h1>
              <p className="text-xs text-muted-foreground">
                Código: {code}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Compartir</span>
                </>
              )}
            </Button>
            {isOwner && sessionId && currentParticipant && (
              <FinalizeSessionDialog
                sessionId={sessionId}
                sessionCode={code}
                sessionName={session?.name || 'Mi cuenta'}
                participantId={currentParticipant.id}
              />
            )}
          </div>
        </div>
      </header>

      <div className="container px-4 py-4 space-y-4 max-w-lg mx-auto">
        {/* Participantes */}
        <Card>
          <CardContent className="py-3">
            <ParticipantList />
          </CardContent>
        </Card>

        {/* Tabs de navegación */}
        <div className="flex gap-2 bg-muted p-1 rounded-lg">
          <Button
            variant={activeTab === 'capture' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setActiveTab('capture')}
          >
            <Camera className="h-4 w-4 mr-2" />
            Factura
          </Button>
          <Button
            variant={activeTab === 'items' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setActiveTab('items')}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Productos
          </Button>
          <Button
            variant={activeTab === 'summary' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setActiveTab('summary')}
          >
            <Receipt className="h-4 w-4 mr-2" />
            Resumen
          </Button>
        </div>

        {/* Contenido según tab */}
        {activeTab === 'capture' && (
          <div className="space-y-4">
            <ReceiptCapture
              onCapture={handleReceiptCapture}
              isProcessing={isProcessingOCR}
              previewUrl={receiptPreview}
            />
            {!isProcessingOCR && receiptPreview && (
              <p className="text-sm text-center text-muted-foreground">
                Puedes capturar otra imagen o ir a la pestaña de productos
              </p>
            )}
          </div>
        )}

        {activeTab === 'items' && sessionId && (
          <ItemList sessionId={sessionId} isOwner={isOwner} />
        )}

        {activeTab === 'summary' && <TotalsSummary />}
      </div>

      {/* Botón flotante para compartir en móvil */}
      <div className="fixed bottom-4 right-4 md:hidden">
        <Button
          size="lg"
          className="rounded-full shadow-lg h-14 w-14"
          onClick={handleShare}
        >
          {copied ? <Check className="h-6 w-6" /> : <Share2 className="h-6 w-6" />}
        </Button>
      </div>
    </main>
  )
}
