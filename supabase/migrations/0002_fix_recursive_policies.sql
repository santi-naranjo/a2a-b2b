-- Fix recursive RLS policies that reference the same table and cause infinite recursion

-- Organization members: replace recursive policy with non-recursive granular policies
drop policy if exists organization_members_rw on public.organization_members;

create policy organization_members_select_self on public.organization_members
for select
using (user_id = auth.uid());

create policy organization_members_insert_self on public.organization_members
for insert
with check (user_id = auth.uid());

create policy organization_members_update_self on public.organization_members
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy organization_members_delete_self on public.organization_members
for delete
using (user_id = auth.uid());

-- Vendor members: replace recursive policy with non-recursive granular policies
drop policy if exists vendor_members_rw on public.vendor_members;

create policy vendor_members_select_self on public.vendor_members
for select
using (user_id = auth.uid());

create policy vendor_members_insert_self on public.vendor_members
for insert
with check (user_id = auth.uid());

create policy vendor_members_update_self on public.vendor_members
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy vendor_members_delete_self on public.vendor_members
for delete
using (user_id = auth.uid());


