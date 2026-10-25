-- Migration: Add game-specific room credentials (BGMI & FC Mobile)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'system_settings' AND column_name = 'bgmi_room_id'
    ) THEN
        ALTER TABLE public.system_settings ADD COLUMN bgmi_room_id TEXT;
        ALTER TABLE public.system_settings ADD COLUMN bgmi_room_password TEXT;
        ALTER TABLE public.system_settings ADD COLUMN fcmobile_room_id TEXT;
        ALTER TABLE public.system_settings ADD COLUMN fcmobile_room_password TEXT;
    END IF;
END $$;
