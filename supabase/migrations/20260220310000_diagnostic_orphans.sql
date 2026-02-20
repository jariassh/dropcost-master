-- DIAGNOSTIC 2: Check Orphaned Referrals
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '--- Recent Users and their Metadata ---';
    FOR r IN (
        SELECT 
            u.email, 
            u.id, 
            au.raw_user_meta_data->>'referred_by' as meta_ref,
            ru.lider_id as linked_lider_id
        FROM public.users u
        JOIN auth.users au ON u.id = au.id
        LEFT JOIN public.referidos_usuarios ru ON u.id = ru.usuario_id
        ORDER BY u.created_at DESC
        LIMIT 10
    ) LOOP
        RAISE NOTICE 'Email: %, Ref_Code: %, Linked_Lider: %', r.email, r.meta_ref, r.linked_lider_id;
    END LOOP;
END $$;
