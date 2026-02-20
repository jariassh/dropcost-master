-- DIAGNOSTIC MIGRATION: Check Level 2 data
DO $$
DECLARE
    v_lider_id uuid;
    v_l1_count int;
    v_sub_leader_count int;
    v_l2_count int;
BEGIN
    -- 1. Find the leader ID forjariash.freelancer@gmail.com
    SELECT id INTO v_lider_id FROM public.referidos_lideres WHERE email = 'jariash.freelancer@gmail.com';
    
    RAISE NOTICE 'Diagnostic for: jariash.freelancer@gmail.com';
    RAISE NOTICE 'My Leader ID: %', v_lider_id;

    IF v_lider_id IS NULL THEN
        RAISE NOTICE 'ERROR: No leader found for this email';
        RETURN;
    END IF;

    -- 2. Check Level 1 count
    SELECT count(*) INTO v_l1_count FROM public.referidos_usuarios WHERE lider_id = v_lider_id;
    RAISE NOTICE 'Level 1 Count: %', v_l1_count;

    -- 3. Check number of guests who are also leaders
    SELECT count(*) INTO v_sub_leader_count 
    FROM public.referidos_lideres 
    WHERE user_id IN (SELECT usuario_id FROM public.referidos_usuarios WHERE lider_id = v_lider_id);
    RAISE NOTICE 'Sub-Leaders (direct guests with code): %', v_sub_leader_count;

    -- 4. Check Level 2 count (data existence check)
    SELECT count(*) INTO v_l2_count
    FROM public.referidos_usuarios 
    WHERE lider_id IN (
        SELECT id FROM public.referidos_lideres 
        WHERE user_id IN (SELECT usuario_id FROM public.referidos_usuarios WHERE lider_id = v_lider_id)
    );
    RAISE NOTICE 'Level 2 Count (TOTAL): %', v_l2_count;

    IF v_l2_count > 0 THEN
        RAISE NOTICE 'DATA EXISTS. The problem is RLS or Frontend visibility.';
    ELSE
        RAISE NOTICE 'DATA DOES NOT EXIST. The guest might not have invited anyone yet.';
    END IF;
END $$;
