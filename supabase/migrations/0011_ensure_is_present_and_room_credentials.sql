-- Ensure registrations table has is_present column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'registrations' AND column_name = 'is_present'
    ) THEN
        ALTER TABLE public.registrations ADD COLUMN is_present BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Ensure system_settings table has room credentials and video URL columns
DO $$
BEGIN
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

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'system_settings' AND column_name = 'bgmi_room_id'
    ) THEN
        ALTER TABLE public.system_settings ADD COLUMN bgmi_room_id TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'system_settings' AND column_name = 'bgmi_room_password'
    ) THEN
        ALTER TABLE public.system_settings ADD COLUMN bgmi_room_password TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'system_settings' AND column_name = 'fcmobile_room_id'
    ) THEN
        ALTER TABLE public.system_settings ADD COLUMN fcmobile_room_id TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'system_settings' AND column_name = 'fcmobile_room_password'
    ) THEN
        ALTER TABLE public.system_settings ADD COLUMN fcmobile_room_password TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'system_settings' AND column_name = 'trailer_video_url'
    ) THEN
        ALTER TABLE public.system_settings ADD COLUMN trailer_video_url TEXT;
    END IF;
END $$;
