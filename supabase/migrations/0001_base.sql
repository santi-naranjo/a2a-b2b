-- Extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- Organizations (companies)
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);
alter table public.organizations enable row level security;

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','member')),
  created_at timestamptz default now(),
  unique (organization_id, user_id)
);
alter table public.organization_members enable row level security;

-- Vendors
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  contact_email text,
  created_at timestamptz default now()
);
alter table public.vendors enable row level security;

create table if not exists public.vendor_members (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','member')),
  created_at timestamptz default now(),
  unique (vendor_id, user_id)
);
alter table public.vendor_members enable row level security;

-- Relationship Org <-> Vendor
create table if not exists public.organization_vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete cascade,
  status text not null check (status in ('invited','approved','blocked')) default 'invited',
  created_at timestamptz default now(),
  unique (organization_id, vendor_id)
);
alter table public.organization_vendors enable row level security;

-- Agents
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('organization','vendor')),
  owner_id uuid not null,
  kind text not null check (kind in ('buyer','negotiator')),
  name text not null,
  system_prompt text not null,
  model text not null default 'gpt-4o-mini',
  temperature numeric default 0.2,
  status text not null check (status in ('active','disabled')) default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists agents_owner_idx on public.agents(owner_type, owner_id);
alter table public.agents enable row level security;

-- Conversations
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  vendor_id uuid,
  buyer_agent_id uuid,
  negotiator_agent_id uuid,
  topic text,
  status text not null check (status in ('open','paused','closed')) default 'open',
  created_by_user uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint conversations_owner_chk check (
    (organization_id is not null) or (vendor_id is not null)
  )
);
alter table public.conversations enable row level security;

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_type text not null check (sender_type in ('user','buyer_agent','negotiator_agent','vendor_user')),
  sender_id uuid,
  role text not null check (role in ('system','user','assistant','tool')),
  content text not null,
  tool_name text,
  tool_payload jsonb,
  created_at timestamptz default now()
);
create index if not exists messages_conv_idx on public.messages(conversation_id, created_at);
alter table public.messages enable row level security;

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  sku text,
  name text not null,
  description text,
  brand text,
  category text,
  price numeric,
  currency text default 'USD',
  stock int,
  unit text,
  min_order_qty int,
  lead_time_days int,
  metadata jsonb,
  searchable tsvector,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists products_vendor_idx on public.products(vendor_id);
create index if not exists products_search_idx on public.products using gin(searchable);
alter table public.products enable row level security;

-- Pre Orders
create table if not exists public.pre_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  created_by_user uuid references auth.users(id),
  status text not null check (status in ('draft','sent','accepted','rejected','cancelled')) default 'draft',
  total_amount numeric,
  currency text default 'USD',
  notes text,
  payload jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.pre_orders enable row level security;

-- Uploads
create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('organization','vendor')),
  owner_id uuid not null,
  kind text not null check (kind in ('product_catalog','other')),
  storage_path text not null,
  status text not null check (status in ('uploaded','processed','failed')) default 'uploaded',
  processed_at timestamptz,
  error text,
  created_at timestamptz default now()
);
alter table public.uploads enable row level security;

-- Agent Tasks
create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  title text not null,
  description text,
  payload jsonb,
  schedule_cron text,
  run_at timestamptz,
  status text not null check (status in ('scheduled','queued','running','succeeded','failed','cancelled')) default 'scheduled',
  last_error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.agent_tasks enable row level security;

-- Jobs queue
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  ref_id uuid,
  attempts int not null default 0,
  max_attempts int not null default 3,
  run_after timestamptz default now(),
  locked_at timestamptz,
  status text not null check (status in ('queued','running','succeeded','failed')) default 'queued',
  payload jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists jobs_status_idx on public.jobs(status, run_after);
alter table public.jobs enable row level security;

-- Audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null check (actor_type in ('user','agent','system')),
  actor_id uuid,
  target_type text not null,
  target_id uuid,
  action text not null,
  metadata jsonb,
  created_at timestamptz default now()
);
alter table public.audit_logs enable row level security;

-- RLS Policies (minimal)

-- organizations: members can select; owners/admin can update
create policy organizations_select on public.organizations for select using (
  exists (select 1 from public.organization_members m where m.organization_id = organizations.id and m.user_id = auth.uid())
);

create policy organization_members_rw on public.organization_members for all using (
  user_id = auth.uid() or exists (
    select 1 from public.organization_members m where m.organization_id = organization_members.organization_id and m.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.organization_members m where m.organization_id = organization_members.organization_id and m.user_id = auth.uid()
  )
);

-- vendors visibility to vendor members; orgs via relationship for select products later
create policy vendors_select on public.vendors for select using (
  exists (select 1 from public.vendor_members m where m.vendor_id = vendors.id and m.user_id = auth.uid())
);

create policy vendor_members_rw on public.vendor_members for all using (
  user_id = auth.uid() or exists (
    select 1 from public.vendor_members m where m.vendor_id = vendor_members.vendor_id and m.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.vendor_members m where m.vendor_id = vendor_members.vendor_id and m.user_id = auth.uid()
  )
);

-- organization_vendors: select if member of org or vendor
create policy organization_vendors_select on public.organization_vendors for select using (
  exists (select 1 from public.organization_members m where m.organization_id = organization_vendors.organization_id and m.user_id = auth.uid())
  or exists (select 1 from public.vendor_members m where m.vendor_id = organization_vendors.vendor_id and m.user_id = auth.uid())
);

-- agents: visible if owner membership
create policy agents_select on public.agents for select using (
  (owner_type = 'organization' and exists (
    select 1 from public.organization_members m where m.organization_id = agents.owner_id and m.user_id = auth.uid()
  )) or (owner_type = 'vendor' and exists (
    select 1 from public.vendor_members m where m.vendor_id = agents.owner_id and m.user_id = auth.uid()
  ))
);

-- conversations/messages: select if org or vendor membership and relation
create policy conversations_select on public.conversations for select using (
  (organization_id is not null and exists (
    select 1 from public.organization_members m where m.organization_id = conversations.organization_id and m.user_id = auth.uid()
  )) or (vendor_id is not null and exists (
    select 1 from public.vendor_members m where m.vendor_id = conversations.vendor_id and m.user_id = auth.uid()
  ))
);

create policy messages_select on public.messages for select using (
  exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id and (
      (c.organization_id is not null and exists (
        select 1 from public.organization_members m where m.organization_id = c.organization_id and m.user_id = auth.uid()
      )) or (c.vendor_id is not null and exists (
        select 1 from public.vendor_members m where m.vendor_id = c.vendor_id and m.user_id = auth.uid()
      ))
    )
  )
);

-- products: vendor members or approved orgs
create policy products_select on public.products for select using (
  exists (select 1 from public.vendor_members m where m.vendor_id = products.vendor_id and m.user_id = auth.uid())
  or exists (
    select 1 from public.organization_vendors ov
    join public.organization_members om on om.organization_id = ov.organization_id and om.user_id = auth.uid()
    where ov.vendor_id = products.vendor_id and ov.status = 'approved'
  )
);

-- pre_orders: visible to org members and vendor members involved
create policy pre_orders_select on public.pre_orders for select using (
  exists (select 1 from public.organization_members m where m.organization_id = pre_orders.organization_id and m.user_id = auth.uid())
  or exists (select 1 from public.vendor_members m where m.vendor_id = pre_orders.vendor_id and m.user_id = auth.uid())
);

-- uploads: owner visibility
create policy uploads_select on public.uploads for select using (
  (owner_type = 'organization' and exists (
    select 1 from public.organization_members m where m.organization_id = uploads.owner_id and m.user_id = auth.uid()
  )) or (owner_type = 'vendor' and exists (
    select 1 from public.vendor_members m where m.vendor_id = uploads.owner_id and m.user_id = auth.uid()
  ))
);

-- agent_tasks: visible to owner
create policy agent_tasks_select on public.agent_tasks for select using (
  exists (
    select 1 from public.agents a where a.id = agent_tasks.agent_id and (
      (a.owner_type = 'organization' and exists (
        select 1 from public.organization_members m where m.organization_id = a.owner_id and m.user_id = auth.uid()
      )) or (a.owner_type = 'vendor' and exists (
        select 1 from public.vendor_members m where m.vendor_id = a.owner_id and m.user_id = auth.uid()
      ))
    )
  )
);

-- jobs: no client access by default (handled by service role)
revoke all on table public.jobs from authenticated, anon;


