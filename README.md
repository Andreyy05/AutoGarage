# AutoGaráž — Elektronická servisní knížka & evidence nákladů

Moderní responzivní webová aplikace a PWA pro osobní evidenci údržby, oprav, úprav a nákladů vozidel kompletně v češtině.

## Technologický stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Radix UI (shadcn/ui styl)
- **Grafy a ikony:** Recharts, Lucide React
- **Backend & Storage:** Supabase (PostgreSQL s RLS, Auth, soukromý Storage bucket garage-media)
- **PWA:** manifest.json, iOS Safari meta tagy (pple-touch-icon.png), podpora bezpečné zóny (iewport-fit=cover)

## Rychlé spuštění

1. Nainstalujte závislosti:
   ```bash
   npm install
   ```
2. Spusťte vývojový server (aplikace funguje ihned i bez Supabase v lokálním ukázkovém režimu):
   ```bash
   npm run dev
   ```
