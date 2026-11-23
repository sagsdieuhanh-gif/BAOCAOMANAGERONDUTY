-- V3.26: Safe account deletion preflight for shared RNS / Manager Auth users.
-- Apply via Supabase SQL editor in project ivixjhwghprfxdtaupxc.
-- This function NEVER deletes records. It enumerates references from business
-- tables to auth.users and returns their nonzero counts for a target user.
-- Only service_role (called by authenticated ADMIN Edge Function) may execute.
CREATE OR REPLACE FUNCTION public.sags_shared_account_delete_blockers(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  fk record;
  found_count bigint;
  blockers jsonb := '[]'::jsonb;
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'user id is required'; END IF;
  FOR fk IN
    SELECT DISTINCT ns.nspname AS schema_name, cl.relname AS table_name,
      at.attname AS column_name
    FROM pg_catalog.pg_constraint co
    JOIN pg_catalog.pg_class cl ON cl.oid=co.conrelid
    JOIN pg_catalog.pg_namespace ns ON ns.oid=cl.relnamespace
    CROSS JOIN LATERAL pg_catalog.unnest(co.conkey) AS key(attnum)
    JOIN pg_catalog.pg_attribute at ON at.attrelid=cl.oid AND at.attnum=key.attnum
    WHERE co.contype='f'
      AND co.confrelid='auth.users'::regclass
      AND ns.nspname='public'
      AND cl.relname NOT IN (
        'sags_docs_members',
        'ops_members',
        'sags_docs_google_oauth_states'
      )
  LOOP
    EXECUTE pg_catalog.format('SELECT count(*) FROM %I.%I WHERE %I = $1',
      fk.schema_name,fk.table_name,fk.column_name)
    INTO found_count USING p_user_id;
    IF found_count > 0 THEN
      blockers := blockers || pg_catalog.jsonb_build_object(
        'table',fk.table_name,'field',fk.column_name,'count',found_count
      );
    END IF;
  END LOOP;
  RETURN blockers;
END;
$fn$;
REVOKE ALL ON FUNCTION public.sags_shared_account_delete_blockers(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sags_shared_account_delete_blockers(uuid)
  TO service_role;
