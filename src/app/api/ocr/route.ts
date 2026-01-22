import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  createGeminiProvider, 
  checkRateLimit, 
  RateLimitError,
  type DetectedItem 
} from '@/lib/ocr'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const sessionId = formData.get('sessionId') as string

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No se proporcionó imagen' },
        { status: 400 }
      )
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No se proporcionó ID de sesión' },
        { status: 400 }
      )
    }

    // Verificar rate limit antes de procesar
    try {
      checkRateLimit()
    } catch (rateLimitError) {
      if (rateLimitError instanceof RateLimitError) {
        return NextResponse.json(
          { 
            error: rateLimitError.message,
            resetInMs: rateLimitError.resetInMs 
          },
          { status: 429 }
        )
      }
      throw rateLimitError
    }

    // Convertir archivo a buffer
    const imageBuffer = await imageFile.arrayBuffer()
    const mimeType = imageFile.type || 'image/jpeg'

    // Procesar con Gemini OCR
    const geminiProvider = createGeminiProvider()
    const detectedItems = await geminiProvider.extractItems(
      Buffer.from(imageBuffer),
      mimeType
    )

    // Guardar items en la base de datos
    const supabase = await createClient()
    
    const itemsToInsert = detectedItems.map((item, index) => ({
      session_id: sessionId,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      ocr_confidence: item.confidence,
      order_index: index,
      manually_added: false,
    }))

    const { data: insertedItems, error } = await supabase
      .from('items')
      .insert(itemsToInsert as any)
      .select()

    if (error) {
      console.error('Error inserting items:', error)
      // Aún así retornar los items detectados
      return NextResponse.json({ 
        items: detectedItems,
        saved: false,
        error: error.message 
      })
    }

    return NextResponse.json({
      items: detectedItems,
      saved: true,
      savedItems: insertedItems,
    })
  } catch (error) {
    console.error('[OCR API] Error:', error)
    
    // Manejar errores específicos
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    
    return NextResponse.json(
      { error: `Error procesando la imagen: ${errorMessage}` },
      { status: 500 }
    )
  }
}
