# DIVIDIR CUENTA

Dividir cuenta es una aplicación web para dividir el costo de una cuenta entre varios participantes, permitiendo agregar ítems, capturar recibos y calcular totales de forma colaborativa y sencilla.

## Características principales
- Agrega participantes y sus avatares personalizados
- Añade ítems y asigna responsables de pago
- Captura recibos usando IA para extraer los ítems automáticamente
- Calcula totales y muestra un resumen por persona
- Interfaz moderna y colaborativa con Next.js y Supabase

## Instalación
1. Clona el repositorio:
	```bash
	git clone <URL-del-repositorio>
	```
2. Instala dependencias (usa tu gestor preferido):
	```bash
	npm install
	# o
	pnpm i
	# o
	yarn install
	```
3. Configura las variables de entorno para Supabase en `.env.local`.
4. Ejecuta el servidor de desarrollo:
	```bash
	npm run dev
	# o
	pnpm dev
	# o
	yarn dev
	```

## Estructura del proyecto
- `src/app/` — Páginas y rutas principales
- `src/components/` — Componentes reutilizables (ítems, participantes, recibos, totales, UI)
- `src/lib/` — Utilidades y helpers (colores, currency, generación de códigos, etc.)
- `src/store/` — Estado global de sesión
- `src/types/` — Tipos TypeScript
- `supabase/` — Migraciones y configuración de base de datos

## Uso
1. Accede a la app en `http://localhost:3000`
2. Crea o únete a una cuenta usando un código único
3. Agrega ítems y participantes
4. Captura el recibo y revisa el resumen de totales por persona

## Tecnologías
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Gemini](https://ai.google.dev/gemini-api)

## Contribuir
¡Las contribuciones son bienvenidas! Abre un issue o pull request para sugerencias, reportar bugs o proponer mejoras.

## Licencia
MIT
