-- SAGS Radar V2.7: verified live DB function, deployed through Supabase migration.
CREATE OR REPLACE FUNCTION public.ops_remove_shuttle_addition(
 p_date date,p_direction text,p_minute integer,p_line integer
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_role text;v_own text;v_foreign_count integer;v_is_default boolean;v_deleted integer;
BEGIN
 v_role:=(SELECT ops_internal.my_unit());
 IF v_role IS NULL OR v_role NOT IN ('ADMIN','DH','KTS','PVHK','KHO','QA','IT')
 THEN RAISE EXCEPTION 'NOT_AUTHORIZED' USING errcode='42501';END IF;
 IF p_date IS NULL OR p_direction NOT IN ('NHA_CXR','CXR_NHA') OR p_minute NOT BETWEEN 0 AND 2879 OR p_line NOT BETWEEN 0 AND 12
 THEN RAISE EXCEPTION 'INVALID_SLOT' USING errcode='22023';END IF;
 v_is_default:= (
 (p_direction='NHA_CXR' AND p_minute IN (390,420,540,1050,1170)) OR
 (p_direction='CXR_NHA' AND p_minute IN (495,540,990,1125,1500)));
 IF p_line=0 AND v_is_default THEN RAISE EXCEPTION 'DEFAULT_SLOT_CANNOT_BE_REMOVED' USING errcode='22023';END IF;
 v_own:=CASE WHEN v_role IN ('QA','IT') THEN 'QA_IT' WHEN v_role='ADMIN' THEN '__NO_OWNER__' ELSE v_role END;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_date::text||p_direction||p_minute::text));
 SELECT count(*) INTO v_foreign_count FROM public.ops_shift_transport_v2
 WHERE service_date=p_date AND direction=p_direction AND departure_min=p_minute
 AND (p_line=0 OR line_no=p_line) AND unit<>v_own;
 IF v_foreign_count>0 THEN RAISE EXCEPTION 'OTHER_DEPARTMENTS_HAVE_CONFIRMED_PEOPLE' USING errcode='23514';END IF;
 DELETE FROM public.ops_shift_transport_v2
 WHERE service_date=p_date AND direction=p_direction AND departure_min=p_minute
 AND (p_line=0 OR line_no=p_line) AND unit=v_own;
 DELETE FROM public.ops_shift_transport_rows
 WHERE service_date=p_date AND direction=p_direction AND departure_min=p_minute
 AND (p_line=0 OR line_no=p_line);
 GET DIAGNOSTICS v_deleted=ROW_COUNT;
 RETURN v_deleted>0;
END $$;
REVOKE ALL ON FUNCTION public.ops_remove_shuttle_addition(date,text,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ops_remove_shuttle_addition(date,text,integer,integer) TO authenticated;
