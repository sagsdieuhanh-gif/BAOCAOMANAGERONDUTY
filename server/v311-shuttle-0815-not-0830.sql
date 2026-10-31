-- V3.11 · 08:30 was an erroneous duplicate of the 08:15 NEXT-DAY shuttle.
-- Preserve the official 08:15 minute key (1935), other official times, and all matching headcounts.
-- Never delete 08:30 rows unless the corresponding next-day 08:15 row for the SAME unit/day/line
-- exists with the SAME quantity. Prevent future protection of the erroneous slot as "fixed".
DO $body$
DECLARE v_sql text; v_function text;
BEGIN
  FOREACH v_function IN ARRAY ARRAY['ops_remove_shuttle_addition','ops_set_shuttle_reason']
  LOOP
    SELECT pg_get_functiondef(p.oid) INTO v_sql
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid
    WHERE n.nspname='public' AND p.proname=v_function;
    IF v_sql IS NULL THEN RAISE EXCEPTION 'Missing shuttle function %',v_function; END IF;
    IF position('(510,990,1110,1560,1935)' IN v_sql)>0 THEN
      EXECUTE replace(v_sql,'(510,990,1110,1560,1935)','(990,1110,1560,1935)');
    ELSIF position('(990,1110,1560,1935)' IN v_sql)=0 THEN
      RAISE EXCEPTION 'Changed fixed-slot guard in %; requires review',v_function;
    END IF;
  END LOOP;
  DELETE FROM public.ops_shift_transport_v2 phantom
   USING public.ops_shift_transport_v2 actual
  WHERE phantom.service_date=DATE '2026-11-01'
    AND phantom.direction='CXR_NHA' AND phantom.departure_min=510 AND phantom.line_no=0
    AND actual.service_date=phantom.service_date
    AND actual.direction=phantom.direction AND actual.departure_min=1935
    AND actual.line_no=phantom.line_no AND actual.unit=phantom.unit
    AND actual.quantity=phantom.quantity;
END $body$;
