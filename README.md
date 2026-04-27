# Lite Shipping MVP (Cebu ↔ Tubigon)

Simple mobile-friendly trip logging app built with **Next.js + TypeScript + Tailwind + Supabase + PostgreSQL**.

## Features
- Login page using Supabase Auth
- Dashboard KPIs for trips, passengers, revenue, and fuel efficiency
- Add Trip Log form with validation (Zod + React Hook Form)
- Auto-calculation display for total fuel and trip duration
- Trip Logs table
- Export logs to CSV

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in Supabase credentials.
3. Run the SQL in `db/schema.sql` in Supabase SQL Editor.
4. Start app:
   ```bash
   npm run dev
   ```

## Notes
- Database computes `total_fuel_liters` and `trip_duration_minutes` as generated columns.
- Client also shows these values in real time while crew fills the form.
