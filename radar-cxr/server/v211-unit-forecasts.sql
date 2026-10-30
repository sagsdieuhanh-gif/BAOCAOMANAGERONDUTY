-- Applied to SAGSCXR-RNS (ivixjhwghprfxdtaupxc), Oct 30, 2026.
-- Role-scoped forecasts supplemental to existing staff, GSE, cargo, flights and shuttle data.
create table if not exists public.ops_unit_forecasts (
  service_date date not null,
  unit text not null check (unit in ('DH','KTS','PVHK','KHO','QA_IT')),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details)='object'),
  status text not null default 'DRAFT' check (status in ('DRAFT','CONFIRMED')),
  revision integer not null default 1 check (revision>0),
  confirmed_by uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (service_date,unit),
  constraint ops_unit_forecasts_confirmed_check check (
    (status='DRAFT' and confirmed_by is null and confirmed_at is null)
    or (status='CONFIRMED' and confirmed_by is not null and confirmed_at is not null)
  )
);
alter table public.ops_unit_forecasts enable row level security;
grant select,insert,update on public.ops_unit_forecasts to authenticated;
create policy ops_unit_forecasts_read on public.ops_unit_forecasts
 for select to authenticated using (ops_internal.my_unit() is not null);
create policy ops_unit_forecasts_insert on public.ops_unit_forecasts
 for insert to authenticated with check (
   (ops_internal.my_unit()='ADMIN' or ops_internal.my_unit()=unit
     or (unit='QA_IT' and ops_internal.my_unit() in ('QA','IT')))
   and updated_by=(select auth.uid())
   and (status='DRAFT' or confirmed_by=(select auth.uid()))
 );
create policy ops_unit_forecasts_update on public.ops_unit_forecasts
 for update to authenticated using (
   ops_internal.my_unit()='ADMIN' or ops_internal.my_unit()=unit
   or (unit='QA_IT' and ops_internal.my_unit() in ('QA','IT'))
 ) with check (
   (ops_internal.my_unit()='ADMIN' or ops_internal.my_unit()=unit
     or (unit='QA_IT' and ops_internal.my_unit() in ('QA','IT')))
   and updated_by=(select auth.uid())
   and (status='DRAFT' or confirmed_by=(select auth.uid()))
 );