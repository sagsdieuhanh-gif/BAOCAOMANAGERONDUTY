-- V2.13: Persist a shared reason against the actual supplementary shuttle run.
-- Applied to public.ops_shift_transport_rows in SAGSCXR-RNS.
-- No change to existing confirmed headcounts or standard departure times.
ALTER TABLE public.ops_shift_transport_rows
 ADD COLUMN IF NOT EXISTS reason text NOT NULL DEFAULT '';
ALTER TABLE public.ops_shift_transport_rows
 DROP CONSTRAINT IF EXISTS ops_shift_transport_rows_reason_length;
ALTER TABLE public.ops_shift_transport_rows
 ADD CONSTRAINT ops_shift_transport_rows_reason_length CHECK (char_length(reason)<=220);

CREATE OR REPLACE FUNCTION public.ops_set_shuttle_reason(
 p_date date,p_direction text,p_minute integer,p_line integer,p_reason text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_role text;v_creator uuid;v_reason text;
BEGIN
 v_role:=(SELECT ops_internal.my_unit());
 IF v_role IS NULL OR v_role NOT IN ('ADMIN','DH','KTS','PVHK','KHO','QA','IT') THEN
  RAISE EXCEPTION 'NOT_AUTHORIZED' USING errcode='42501';
 END IF;
 IF p_date IS NULL OR p_direction NOT IN ('NHA_CXR','CXR_NHA') OR
    p_minute NOT BETWEEN 0 AND 2879 OR p_line NOT BETWEEN 0 AND 12 THEN
  RAISE EXCEPTION 'INVALID_SHUTTLE_SLOT' USING errcode='22023';
 END IF;
 v_reason:=pg_catalog.btrim(coalesce(p_reason,''));
 IF char_length(v_reason)>220 THEN
  RAISE EXCEPTION 'REASON_TOO_LONG' USING errcode='22023';
 END IF;
 IF p_line=0 AND (
  (p_direction='NHA_CXR' AND p_minute IN (390,420,540,1050,1170)) OR
  (p_direction='CXR_NHA' AND p_minute IN (495,540,990,1125,1500))
 ) THEN RAISE EXCEPTION 'NOT_AN_ADDITIONAL_SHUTTLE' USING errcode='22023'; END IF;
 SELECT created_by INTO v_creator FROM public.ops_shift_transport_rows
 WHERE service_date=p_date AND direction=p_direction AND departure_min=p_minute
 AND line_no=p_line FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'ADDITIONAL_SHUTTLE_NOT_FOUND' USING errcode='P0002'; END IF;
 IF v_role NOT IN ('ADMIN','DH') AND v_creator IS DISTINCT FROM (SELECT auth.uid()) THEN
  RAISE EXCEPTION 'NOT_AUTHORIZED_TO_EDIT_REASON' USING errcode='42501';
 END IF;
 UPDATE public.ops_shift_transport_rows SET reason=v_reason
 WHERE service_date=p_date AND direction=p_direction AND departure_min=p_minute AND line_no=p_line;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.ops_set_shuttle_reason(date,text,integer,integer,text) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.ops_set_shuttle_reason(date,text,integer,integer,text) TO authenticated;
