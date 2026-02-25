-- Ensure the 'avatars' bucket exists in Supabase Storage
-- This is a redundant check to fix "Bucket not found" errors

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for the 'avatars' bucket
-- These ensure RLS is properly configured for the bucket

DO $$
BEGIN
    -- Public Read Access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Access for Avatars'
    ) THEN
        CREATE POLICY "Public Access for Avatars"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'avatars' );
    END IF;

    -- User Upload Access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Users can upload their own avatar v2'
    ) THEN
        CREATE POLICY "Users can upload their own avatar v2"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'avatars' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;

    -- User Update Access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Users can update their own avatar v2'
    ) THEN
        CREATE POLICY "Users can update their own avatar v2"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (
            bucket_id = 'avatars' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;

    -- User Delete Access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Users can delete their own avatar v2'
    ) THEN
        CREATE POLICY "Users can delete their own avatar v2"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
            bucket_id = 'avatars' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;
