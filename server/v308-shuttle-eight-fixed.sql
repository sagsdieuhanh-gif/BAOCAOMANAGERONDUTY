-- V3.08: protect official 08:30 (CXR → Nha Trang, same day) as a
-- fixed shuttle run, in addition to the existing next-day 02:00/08:15.
-- Preserve all existing service_date, departure_min and staffing rows.
DO $body$
DECLARE v_sql text; v_function text;
BEGIN
 FOREACH v_function IN ARRAY ARRAY['ops_remove_shuttle_addition','ops_set_shuttle_reason']
 LOOP
  SELECT pg_get_functiondef(p.oid) INTO v_sql
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname=v_function;
  IF v_sql IS NULL THEN RAISE EXCEPTION 'Missing shuttle function %',v_function; END IF;
  IF position('(510,990,1110,1560,1935)' IN v_sql)>0 THEN CONTINUE; END IF;
  IF position('(990,1110,1560,1935)' IN v_sql)=0 THEN
   RAISE EXCEPTION 'Shuttle guard changed in %; refusing unsafe replacement',v_function;
  END IF;
  EXECUTE replace(v_sql,'(990,1110,1560,1935)','(510,990,1110,1560,1935)');
 END LOOP;
END $body$;