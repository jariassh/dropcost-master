-- FIX LINKAGE & ORPHANS
-- Description: Manually fixes the linkage for known orphans and 
--              re-runs the referral handler for any user with metadata but no link.

DO $$
DECLARE
    u RECORD;
    v_lider_id uuid;
BEGIN
    RAISE NOTICE '--- Starting Manual Linkage Fix ---';

    -- 1. Scan for users who have 'referred_by' in metadata but are NOT in referidos_usuarios
    FOR u IN (
        SELECT 
            au.id as user_id, 
            au.email, 
            au.raw_user_meta_data->>'referred_by' as ref_code
        FROM auth.users au
        LEFT JOIN public.referidos_usuarios ru ON au.id = ru.usuario_id
        WHERE au.raw_user_meta_data->>'referred_by' IS NOT NULL 
        AND ru.usuario_id IS NULL
    ) LOOP
        -- 2. Find the leader for this code
        SELECT id INTO v_lider_id
        FROM public.referidos_lideres
        WHERE LOWER(codigo_referido) = LOWER(u.ref_code);

        IF v_lider_id IS NOT NULL THEN
            RAISE NOTICE 'Linking User % (%) to Leader ID % (Code: %)', u.email, u.user_id, v_lider_id, u.ref_code;
            
            INSERT INTO public.referidos_usuarios (usuario_id, lider_id, fecha_registro)
            VALUES (u.user_id, v_lider_id, now())
            ON CONFLICT (usuario_id) DO NOTHING;
            
            -- Update leader stats
            UPDATE public.referidos_lideres
            SET total_usuarios_referidos = (
                SELECT count(*) FROM public.referidos_usuarios WHERE lider_id = v_lider_id
            )
            WHERE id = v_lider_id;
        ELSE
            RAISE NOTICE 'Skipping User % (%): Referral code % not found in referidos_lideres.', u.email, u.user_id, u.ref_code;
        END IF;
    END LOOP;

    RAISE NOTICE '--- Fix Completed ---';
END $$;
