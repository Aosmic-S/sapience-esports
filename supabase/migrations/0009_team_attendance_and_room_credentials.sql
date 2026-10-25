-- Migration: Add attendance status and room credentials
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'registrations' AND column_name = 'is_present'
    ) THEN
        ALTER TABLE public.registrations ADD COLUMN is_present BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'system_settings' AND column_name = 'room_id'
    ) THEN
        ALTER TABLE public.system_settings ADD COLUMN room_id TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'system_settings' AND column_name = 'room_password'
    ) THEN
        ALTER TABLE public.system_settings ADD COLUMN room_password TEXT;
    END IF;
END $$;
