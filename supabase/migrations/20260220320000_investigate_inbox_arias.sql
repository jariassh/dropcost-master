-- DIAGNOSTIC 3: Find Leader for inbox.arias@gmail.com
DO $$
DECLARE
    v_user_id uuid;
    v_lider_id uuid;
    v_lider_email text;
    v_lider_name text;
    v_meta_ref text;
BEGIN
    RAISE NOTICE '--- Investigation for inbox.arias@gmail.com ---';
    
    -- 1. Get user ID and metadata
    SELECT u.id, au.raw_user_meta_data->>'referred_by'
    INTO v_user_id, v_meta_ref
    FROM public.users u
    JOIN auth.users au ON u.id = au.id
    WHERE u.email = 'inbox.arias@gmail.com';

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'USER NOT FOUND: inbox.arias@gmail.com does not exist in the database.';
        RETURN;
    END IF;

    RAISE NOTICE 'User ID: %, Metadata Ref Code: %', v_user_id, v_meta_ref;

    -- 2. Check linkage in referidos_usuarios
    SELECT ru.lider_id INTO v_lider_id
    FROM public.referidos_usuarios ru
    WHERE ru.usuario_id = v_user_id;

    IF v_lider_id IS NULL THEN
        RAISE NOTICE 'LINKAGE NOT FOUND: User is not linked to any leader in referidos_usuarios.';
        
        -- Try to see if we can find the leader by the metadata code
        IF v_meta_ref IS NOT NULL THEN
            SELECT nombre, email INTO v_lider_name, v_lider_email
            FROM public.referidos_lideres
            WHERE LOWER(codigo_referido) = LOWER(v_meta_ref);
            
            IF v_lider_email IS NOT NULL THEN
                RAISE NOTICE 'POTENTIAL LEADER (by metadata): Name: %, Email: %', v_lider_name, v_lider_email;
            ELSE
                RAISE NOTICE 'REFERRAL CODE INVALID: No leader found with code %', v_meta_ref;
            END IF;
        END IF;
    ELSE
        -- 3. Get leader details
        SELECT nombre, email INTO v_lider_name, v_lider_email
        FROM public.referidos_lideres
        WHERE id = v_lider_id;
        
        RAISE NOTICE 'LINKED LEADER FOUND: ID: %, Name: %, Email: %', v_lider_id, v_lider_name, v_lider_email;
    END IF;
END $$;
