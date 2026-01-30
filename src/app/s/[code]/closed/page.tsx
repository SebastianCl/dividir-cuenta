'use client'

import { useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Home } from 'lucide-react'
import { useSessionStore } from '@/store/session-store'
import Link from 'next/link'

export default function SessionClosedPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter()
  const code = (params.code as string).toUpperCase()
  const name = searchParams.get('name')
  const { reset } = useSessionStore()

  useEffect(() => {
    // Limpiar datos locales de esta sesión
    localStorage.removeItem(`participant_${code}`)
    reset()
  }, [code, reset])

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Cuenta finalizada</CardTitle>
          <CardDescription className="text-base">
            La cuenta {name ? <strong>{name}</strong> : <>con código <strong>{code}</strong></>} ha sido finalizada por su creador.
          </CardDescription>
        </CardHeader>

                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Todos los datos de esta cuenta han sido eliminados.
                        Esperamos que hayas disfrutado la cuenta.
                    </p>

                    <div className="pt-4">
                        <Link href="/">
                            <Button className="gap-2 w-full">
                                <Home className="h-4 w-4" />
                                Volver al inicio
                            </Button>
                        </Link>
                    </div>

                    <p className="text-xs text-muted-foreground pt-2">
                        ¿Necesitas dividir otra cuenta? Crea una nueva sesión desde el inicio.
                    </p>
                </CardContent>
            </Card>
        </main>
    )
}
