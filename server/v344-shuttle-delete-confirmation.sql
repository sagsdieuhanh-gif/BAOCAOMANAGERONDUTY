CREATE OR REPLACE FUNCTION public.ops_remove_shuttle_addition(p_date date, p_direction text, p_minute integer, p_line integer, p_confirmation text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_role text;v_actor uuid;v_custom boolean;v_snapshot jsonb;v_slot jsonb;v_deleted integer;
BEGIN
 v_actor := (SELECT auth.uid());
 v_role := (SELECT ops_internal.my_unit());
 IF v_actor IS NULL OR v_role IS NULL OR v_role NOT IN ('DH','ADMIN') THEN
  RAISE EXCEPTION 'ONLY_DH_ADMIN_CAN_DELETE_EXTRA_SHUTTLES' USING errcode='42501';
 END IF;
 IF p_date IS NULL OR p_direction NOT IN ('NHA_CXR','CXR_NHA') OR
    p_minute NOT BETWEEN 0 AND 2879 OR p_line NOT BETWEEN 0 AND 12 THEN
  RAISE EXCEPTION 'INVALID_SHUTTLE_SLOT' USING errcode='22023';
 END IF;
 v_custom:=NOT (
    (p_direction='NHA_CXR' AND p_minute IN (420,1050,1170))
    OR (p_direction='CXR_NHA' AND p_minute IN (990,1110,1560,1935))
 );
 IF p_line=0 AND NOT v_custom THEN RAISE EXCEPTION 'FIXED_SHUTTLE_CANNOT_BE_REMOVED' USING errcode='22023'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_date::text||p_direction||p_minute::text));
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) INTO v_slot FROM
 (SELECT * FROM public.ops_shift_transport_rows
  WHERE service_date=p_date AND direction=p_direction AND departure_min=p_minute
    AND (CASE WHEN p_line=0 THEN TRUE ELSE line_no=p_line END) FOR UPDATE) x;
 
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) INTO v_snapshot FROM
 (SELECT * FROM public.ops_shift_transport_v2
  WHERE service_date=p_date AND direction=p_direction AND departure_min=p_minute
    AND (CASE WHEN p_line=0 THEN TRUE ELSE line_no=p_line END) FOR UPDATE) x;
 IF v_snapshot<>'[]'::jsonb AND pg_catalog.upper(pg_catalog.btrim(coalesce(p_confirmation,'')))<>'XÓA' THEN
  RAISE EXCEPTION 'SHUTTLE_DELETE_CONFIRMATION_REQUIRED' USING errcode='22023';
 END IF;
 IF v_slot='[]'::jsonb AND v_snapshot='[]'::jsonb THEN RAISE EXCEPTION 'SHUTTLE_SLOT_NOT_FOUND' USING errcode='P0002'; END IF; INSERT INTO public.ops_shuttle_delete_audit(service_date,direction,departure_min,line_no,actor,actor_unit,unit_rows_before,slot_rows_before)
 VALUES(p_date,p_direction,p_minute,p_line,v_actor,v_role,v_snapshot,v_slot);
 DELETE FROM public.ops_shift_transport_v2
  WHERE service_date=p_date AND direction=p_direction AND departure_min=p_minute
    AND (CASE WHEN p_line=0 THEN TRUE ELSE line_no=p_line END);
 GET DIAGNOSTICS v_deleted=ROW_COUNT;
 IF v_deleted>0 AND pg_catalog.upper(pg_catalog.btrim(coalesce(p_confirmation,'')))<>'XÓA' THEN
  RAISE EXCEPTION 'SHUTTLE_DELETE_CONFIRMATION_REQUIRED' USING errcode='22023';
 END IF;
 DELETE FROM public.ops_shift_transport_rows
  WHERE service_date=p_date AND direction=p_direction AND departure_min=p_minute
    AND (CASE WHEN p_line=0 THEN TRUE ELSE line_no=p_line END);
 GET DIAGNOSTICS v_deleted=ROW_COUNT;
 RETURN v_deleted>0;
END $function$;
REVOKE ALL ON FUNCTION public.ops_remove_shuttle_addition(date,text,integer,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ops_remove_shuttle_addition(date,text,integer,integer,text) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.ops_remove_shuttle_addition(p_date date,p_direction text,p_minute integer,p_line integer)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path=''
AS $wrapper$ SELECT public.ops_remove_shuttle_addition(p_date,p_direction,p_minute,p_line,NULL::text); $wrapper$;
REVOKE ALL ON FUNCTION public.ops_remove_shuttle_addition(date,text,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ops_remove_shuttle_addition(date,text,integer,integer) TO authenticated,service_role;
NOTIFY pgrst, 'reload schema';
