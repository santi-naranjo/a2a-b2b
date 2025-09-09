-- Missions schema: store saved missions and their items
create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  shipping_address text,
  urgency text check (urgency in ('not_urgent','urgent')) default 'not_urgent',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mission_items (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  product_id uuid references public.products(id),
  vendor_id uuid references public.vendors(id),
  sku text,
  name text,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);

alter table public.missions enable row level security;
alter table public.mission_items enable row level security;

-- Policies: organization members can manage their missions
drop policy if exists missions_select on public.missions;
create policy missions_select on public.missions
  for select using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = missions.organization_id
        and om.user_id = auth.uid()
    )
  );

drop policy if exists missions_insert on public.missions;
create policy missions_insert on public.missions
  for insert with check (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = missions.organization_id
        and om.user_id = auth.uid()
    )
  );

drop policy if exists missions_update on public.missions;
create policy missions_update on public.missions
  for update using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = missions.organization_id
        and om.user_id = auth.uid()
    )
  );

drop policy if exists missions_delete on public.missions;
create policy missions_delete on public.missions
  for delete using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = missions.organization_id
        and om.user_id = auth.uid()
    )
  );

-- Mission items policies (split per command for broad compatibility)
drop policy if exists mission_items_select on public.mission_items;
create policy mission_items_select on public.mission_items
  for select using (
    exists (
      select 1 from public.missions m
      join public.organization_members om on om.organization_id = m.organization_id
      where m.id = mission_items.mission_id and om.user_id = auth.uid()
    )
  );

drop policy if exists mission_items_insert on public.mission_items;
create policy mission_items_insert on public.mission_items
  for insert with check (
    exists (
      select 1 from public.missions m
      join public.organization_members om on om.organization_id = m.organization_id
      where m.id = mission_items.mission_id and om.user_id = auth.uid()
    )
  );

drop policy if exists mission_items_update on public.mission_items;
create policy mission_items_update on public.mission_items
  for update using (
    exists (
      select 1 from public.missions m
      join public.organization_members om on om.organization_id = m.organization_id
      where m.id = mission_items.mission_id and om.user_id = auth.uid()
    )
  );

drop policy if exists mission_items_delete on public.mission_items;
create policy mission_items_delete on public.mission_items
  for delete using (
    exists (
      select 1 from public.missions m
      join public.organization_members om on om.organization_id = m.organization_id
      where m.id = mission_items.mission_id and om.user_id = auth.uid()
    )
  );

-- Trigger to keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_missions_updated_at on public.missions;
create trigger set_missions_updated_at
before update on public.missions
for each row
execute function public.touch_updated_at();


