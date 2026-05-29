-- 在 Supabase 控制台 SQL Editor 中执行此文件
-- ════════════════════════════════════════════════════════════

-- 文件分类表
create table if not exists public.resource_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz default now()
);

-- 文件记录表
create table if not exists public.resource_files (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid references public.resource_categories on delete cascade not null,
  name          text not null,
  description   text not null default '',
  storage_path  text not null,
  mime_type     text not null,
  size          bigint not null,
  created_at    timestamptz default now()
);

-- 关闭 RLS（内部工具，无需登录验证）
alter table public.resource_categories disable row level security;
alter table public.resource_files disable row level security;

-- 创建文件存储桶（公开访问，单文件最大 50MB）
insert into storage.buckets (id, name, public, file_size_limit)
values ('files', 'files', true, 52428800)
on conflict (id) do nothing;

-- 存储桶策略：允许所有人读写（内部工具）
create policy "files_public_select" on storage.objects
  for select using (bucket_id = 'files');

create policy "files_public_insert" on storage.objects
  for insert with check (bucket_id = 'files');

create policy "files_public_delete" on storage.objects
  for delete using (bucket_id = 'files');
