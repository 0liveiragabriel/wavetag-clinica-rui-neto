/*
# Create clinic schema for Clínica Rui Neto

## Overview
This migration creates the database schema for the Clínica Rui Neto scheduling app,
a WaveTag prototype. It includes a doctors table and an appointments table, plus
seed data for 3 doctors and 5 pre-loaded appointments for today.

## New Tables

### doctors
- `id` (uuid, primary key)
- `name` (text, not null) — doctor's full name
- `specialty` (text, not null) — medical specialty description
- `avatar_color` (text) — hex color used for the avatar badge in the UI
- `created_at` (timestamptz)

### appointments
- `id` (uuid, primary key)
- `doctor_id` (uuid, FK to doctors) — which doctor the appointment is with
- `patient_name` (text, not null)
- `patient_phone` (text, not null) — WhatsApp number
- `patient_email` (text, not null)
- `appointment_date` (date, not null) — the date of the appointment
- `appointment_time` (text, not null) — time slot like "09:00"
- `status` (text, not null, default 'pendente') — pendente|confirmada|concluida|cancelada
- `notes` (text) — optional notes
- `created_at` (timestamptz)

## Security
- RLS enabled on both tables.
- This is a no-auth single-tenant app (admin uses a simple PIN, not Supabase auth).
- Policies use `TO anon, authenticated` so the anon-key frontend can read/write all data.
- `USING (true)` / `WITH CHECK (true)` is acceptable because all data is intentionally shared/public.

## Seed Data
- 3 doctors: Dr. Rui Neto, Dra. Sofia Martins, Dr. André Pestana
- 5 appointments for today with varied statuses and doctors
*/

-- ===================== DOCTORS =====================
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialty text NOT NULL,
  avatar_color text NOT NULL DEFAULT '#0284c7',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_doctors" ON doctors;
CREATE POLICY "anon_select_doctors" ON doctors FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_doctors" ON doctors;
CREATE POLICY "anon_insert_doctors" ON doctors FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_doctors" ON doctors;
CREATE POLICY "anon_update_doctors" ON doctors FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_doctors" ON doctors;
CREATE POLICY "anon_delete_doctors" ON doctors FOR DELETE
  TO anon, authenticated USING (true);

-- ===================== APPOINTMENTS =====================
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_name text NOT NULL,
  patient_phone text NOT NULL,
  patient_email text NOT NULL,
  appointment_date date NOT NULL,
  appointment_time text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_appointments" ON appointments;
CREATE POLICY "anon_select_appointments" ON appointments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_appointments" ON appointments;
CREATE POLICY "anon_insert_appointments" ON appointments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_appointments" ON appointments;
CREATE POLICY "anon_update_appointments" ON appointments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_appointments" ON appointments;
CREATE POLICY "anon_delete_appointments" ON appointments FOR DELETE
  TO anon, authenticated USING (true);

-- Index for common query: appointments by date
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);

-- ===================== SEED DATA =====================
-- Insert doctors (idempotent via ON CONFLICT)
INSERT INTO doctors (name, specialty, avatar_color) VALUES
  ('Dr. Rui Neto', 'Especialista em Medicina Geral e Familiar', '#0284c7'),
  ('Dra. Sofia Martins', 'Medicina Geral e Preventiva', '#0d9488'),
  ('Dr. André Pestana', 'Consultas de Rotina e Check-ups', '#6366f1')
ON CONFLICT DO NOTHING;

-- Insert 5 appointments for today using doctor IDs
INSERT INTO appointments (doctor_id, patient_name, patient_phone, patient_email, appointment_date, appointment_time, status)
SELECT d.id, v.patient_name, v.patient_phone, v.patient_email, CURRENT_DATE, v.appointment_time, v.status
FROM (VALUES
  ('Dr. Rui Neto', 'Maria Fernandes', '+351912345678', 'maria.fernandes@email.pt', '09:00', 'pendente'),
  ('Dra. Sofia Martins', 'João Carvalho', '+351923456789', 'joao.carvalho@email.pt', '10:00', 'confirmada'),
  ('Dr. André Pestana', 'Ana Rita Silva', '+351934567890', 'ana.silva@email.pt', '14:00', 'confirmada'),
  ('Dr. Rui Neto', 'Carlos Eduardo Lopes', '+351945678901', 'carlos.lopes@email.pt', '15:30', 'concluida'),
  ('Dra. Sofia Martins', 'Beatriz Sousa', '+351956789012', 'beatriz.sousa@email.pt', '09:30', 'cancelada')
) AS v(doctor_name, patient_name, patient_phone, patient_email, appointment_time, status)
JOIN doctors d ON d.name = v.doctor_name
ON CONFLICT DO NOTHING;
