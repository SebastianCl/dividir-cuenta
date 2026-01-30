
# Dividir cuenta

Dividir cuenta es una aplicación web para dividir el costo de una cuenta entre varios participantes, permitiendo agregar ítems, capturar recibos y calcular totales de forma colaborativa.

## Características principales
- Agrega participantes y sus avatares
- Añade ítems y asigna responsables
- Captura recibos usando OCR
- Calcula totales y muestra resumen
- Interfaz moderna con Next.js y Supabase

## Instalación
1. Clona el repositorio:
	```bash
	git clone <URL-del-repositorio>
	```
2. Instala dependencias:
	```bash
	npm install
	```
3. Configura las variables de entorno para Supabase en `.env.local`.
4. Ejecuta el servidor de desarrollo:
	```bash
	npm run dev
	```

## Estructura del proyecto
- `src/app/` — Páginas y rutas de la app
- `src/components/` — Componentes reutilizables
- `src/lib/` — Utilidades y helpers
- `src/store/` — Estado global
- `src/types/` — Tipos TypeScript
- `supabase/` — Migraciones y configuración de base de datos

## Uso
1. Accede a la app en `http://localhost:3000`
2. Crea o únete a una cuenta usando un código
3. Agrega ítems y participantes
4. Captura el recibo y revisa el resumen de totales

## Tecnologías
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [OCR](https://github.com/naptha/ocrad.js) (para reconocimiento de recibos)

## Contribuir
¡Las contribuciones son bienvenidas! Abre un issue o pull request para sugerencias o mejoras.

## Licencia
MIT
