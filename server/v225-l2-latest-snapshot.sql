-- V2.25.2: Keep first forecast immutable and all import history append-only.
-- A second (L2) validated upload replaces only the CURRENT L2 snapshot for report export.
-- Existing L1 snapshots remain unchanged. Only DH/ADMIN may execute import as before.
DO $migration$
DECLARE def text; fn_oid oid; 
BEGIN
 SELECT p.oid,pg_get_functiondef(p.oid) INTO fn_oid,def
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='ops_import_sags_schedule'
   AND p.prokind='f';
 IF def IS NULL THEN RAISE EXCEPTION 'ops_import_sags_schedule function not found'; END IF;
 IF strpos(def, 'ON CONFLICT (service_date,revision) DO NOTHING;')=0 THEN
   RAISE EXCEPTION 'Unexpected snapshot UPSERT body; inspect manually before migration';
 END IF;
 def := replace(def,
   'ON CONFLICT (service_date,revision) DO NOTHING;',
   'ON CONFLICT (service_date,revision) DO UPDATE SET
      source_filename=excluded.source_filename,
      source_kind=excluded.source_kind,
      has_stands=excluded.has_stands,
      payload=excluded.payload,
      created_by=excluded.created_by,
      created_at=now()
    WHERE excluded.revision=2;');
 IF strpos(def,
   'SELECT EXISTS(SELECT 1 FROM public.ops_forecast_snapshots WHERE service_date=p_date AND revision=2) INTO v_l2;')=0
 THEN RAISE EXCEPTION 'Unexpected L2 validation body; inspect manually'; END IF;
 def := replace(def,
   'SELECT EXISTS(SELECT 1 FROM public.ops_forecast_snapshots WHERE service_date=p_date AND revision=2) INTO v_l2;',
   'IF p_revision=2 AND NOT EXISTS (
      SELECT 1 FROM public.ops_forecast_snapshots WHERE service_date=p_date AND revision=1
    ) THEN RAISE EXCEPTION ''SECOND_FORECAST_NEEDS_FIRST_FORECAST''; END IF;
    SELECT EXISTS(SELECT 1 FROM public.ops_forecast_snapshots WHERE service_date=p_date AND revision=2) INTO v_l2;');
 EXECUTE def;
END $migration$;