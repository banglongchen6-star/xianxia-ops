-- ══════════════════════════════════════════════════════
-- 产品素材库 schema
-- 在 Supabase SQL Editor 中运行此文件
-- ══════════════════════════════════════════════════════

-- 产品表
create table if not exists public.products (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  description text        not null default '',
  sort_order  int         not null default 0,
  created_at  timestamptz default now()
);

-- 产品素材表
create table if not exists public.product_files (
  id            uuid        primary key default gen_random_uuid(),
  product_id    uuid        not null references public.products on delete cascade,
  material_type text        not null,
  name          text        not null,
  content       text        not null default '',
  storage_path  text,
  mime_type     text        not null default '',
  size          bigint      not null default 0,
  sort_order    int         not null default 0,
  created_at    timestamptz default now()
);

-- RLS
alter table public.products      enable row level security;
alter table public.product_files enable row level security;

-- 开放策略（anon + authenticated 均可读写）
create policy "products_open"
  on public.products for all to anon, authenticated
  using (true) with check (true);

create policy "product_files_open"
  on public.product_files for all to anon, authenticated
  using (true) with check (true);

-- 授权
grant all on public.products      to anon, authenticated;
grant all on public.product_files to anon, authenticated;

-- 扩大存储桶文件上限至 500 MB（支持视频上传）
update storage.buckets
  set file_size_limit = 524288000
  where id = 'files';
