DO $body$
DECLARE v_sql text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_sql
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='ops_remove_shuttle_addition';
  IF v_sql IS NULL OR position('(990,1110,1935)' IN v_sql)=0 THEN
    RAISE EXCEPTION 'Expected fixed slot guard missing from ops_remove_shuttle_addition';
  END IF;
  EXECUTE replace(v_sql,'(990,1110,1935)','(990,1110,1560,1935)');
  SELECT pg_get_functiondef(p.oid) INTO v_sql
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='ops_set_shuttle_reason';
  IF v_sql IS NULL OR position('(990,1110,1935)' IN v_sql)=0 THEN
    RAISE EXCEPTION 'Expected fixed slot guard missing from ops_set_shuttle_reason';
  END IF;
  EXECUTE replace(v_sql,'(990,1110,1935)','(990,1110,1560,1935)');
END $body$;