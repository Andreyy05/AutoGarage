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
## Napojení na Supabase (produkční cloud)

1. Vytvořte nový projekt na [supabase.com](https://supabase.com).
2. V **SQL Editoru** spusťte kompletní skript ze souboru supabase/schema.sql.
   Skript vytvoří tabulky ehicles, service_records, ecord_photos, nastaví Row Level Security (RLS) a založí soukromý bucket garage-media.
3. Zkopírujte .env.example do .env.local a doplňte NEXT_PUBLIC_SUPABASE_URL a NEXT_PUBLIC_SUPABASE_ANON_KEY.
4. Restartujte vývojový server a přihlaste se na /prihlaseni.
