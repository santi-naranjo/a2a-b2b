-- Enable pgvector extension
create extension if not exists vector;

-- Add embedding column to products if not exists
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'embedding'
  ) then
    alter table public.products add column embedding vector(1536);
  end if;
end$$;

-- HNSW index for fast ANN search (if supported). Fallback to ivfflat if needed.
do $$
begin
  begin
    create index if not exists products_embedding_hnsw_idx on public.products using hnsw (embedding vector_l2_ops);
  exception when others then
    create index if not exists products_embedding_ivf_idx on public.products using ivfflat (embedding vector_l2_ops) with (lists = 100);
  end;
end$$;

-- Semantic search function scoped by conversation/vendor/org
create or replace function public.semantic_search_products(
  conv_id uuid,
  query_embedding vector(1536),
  scope text,
  limit_count int
)
returns table (
  id uuid,
  vendor_id uuid,
  vendor_name text,
  sku text,
  name text,
  description text,
  brand text,
  category text,
  price numeric,
  currency text,
  stock int,
  unit text,
  min_order_qty int,
  lead_time_days int,
  distance float
) as $$
declare
  v_vendor_id uuid;
  v_org_id uuid;
begin
  select vendor_id, organization_id into v_vendor_id, v_org_id from public.conversations where id = conv_id;

  return query
  select p.id, p.vendor_id, v.name as vendor_name, p.sku, p.name, p.description, p.brand, p.category, p.price, p.currency, p.stock, p.unit, p.min_order_qty, p.lead_time_days,
         (p.embedding <-> query_embedding) as distance
  from public.products p
  join public.vendors v on v.id = p.vendor_id
  where (
    (v_vendor_id is not null and p.vendor_id = v_vendor_id)
    or (
      v_vendor_id is null and v_org_id is not null and exists (
        select 1 from public.organization_vendors ov
        where ov.organization_id = v_org_id and ov.vendor_id = p.vendor_id and ov.status = 'approved'
      )
    )
    or (
      scope = 'all' and v_org_id is not null
    )
  )
  order by p.embedding <-> query_embedding
  limit coalesce(limit_count, 20);
end;
$$ language plpgsql stable;


