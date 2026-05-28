-- 用户档案表（扩展 auth.users）
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text not null default 'client' check (role in ('admin', 'client')),
  created_at timestamptz default now()
);

-- 客户表
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  phone text,
  email text,
  wechat text,
  notes text,
  user_id uuid references auth.users,  -- 关联客户门户账号
  created_at timestamptz default now()
);

-- 项目表
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('体验课活动', '商务合作', '演出展览')),
  status text not null default '线索' check (status in ('线索', '跟进中', '签约', '执行中', '已完成', '已取消')),
  client_id uuid references public.clients not null,
  venue text,
  event_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 文件表
create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects on delete cascade not null,
  name text not null,
  category text not null check (category in ('物料', '合同', '报价单', '宣传资料', '其他')),
  storage_path text not null,
  size bigint,
  uploaded_by uuid references auth.users not null,
  is_client_visible boolean default true,
  created_at timestamptz default now()
);

-- 跟进记录表
create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects on delete cascade not null,
  content text not null,
  created_by uuid references auth.users not null,
  created_at timestamptz default now()
);

-- 自动更新 updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on public.projects
  for each row execute function update_updated_at();

-- RLS 策略
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.project_files enable row level security;
alter table public.follow_ups enable row level security;

-- profiles: 自己能读自己
create policy "profiles_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);

-- admin 全权限辅助函数
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- clients: admin 全权，客户只能看自己关联的
create policy "clients_admin" on public.clients using (is_admin());
create policy "clients_self" on public.clients for select using (user_id = auth.uid());

-- projects: admin 全权，客户只能看自己的项目
create policy "projects_admin" on public.projects using (is_admin());
create policy "projects_client_select" on public.projects for select
  using (client_id in (select id from public.clients where user_id = auth.uid()));

-- files: admin 全权，客户只能看 is_client_visible=true 的自己项目文件
create policy "files_admin" on public.project_files using (is_admin());
create policy "files_client_select" on public.project_files for select
  using (
    is_client_visible = true and
    project_id in (
      select p.id from public.projects p
      join public.clients c on c.id = p.client_id
      where c.user_id = auth.uid()
    )
  );

-- follow_ups: admin 全权，客户只能看自己项目的
create policy "followups_admin" on public.follow_ups using (is_admin());
create policy "followups_client_select" on public.follow_ups for select
  using (
    project_id in (
      select p.id from public.projects p
      join public.clients c on c.id = p.client_id
      where c.user_id = auth.uid()
    )
  );

-- Storage bucket
insert into storage.buckets (id, name, public) values ('project-files', 'project-files', false);

create policy "files_upload_admin" on storage.objects for insert
  using (bucket_id = 'project-files' and is_admin());
create policy "files_read_admin" on storage.objects for select
  using (bucket_id = 'project-files' and is_admin());
create policy "files_read_client" on storage.objects for select
  using (
    bucket_id = 'project-files' and
    exists (
      select 1 from public.project_files pf
      join public.projects p on p.id = pf.project_id
      join public.clients c on c.id = p.client_id
      where pf.storage_path = name
        and pf.is_client_visible = true
        and c.user_id = auth.uid()
    )
  );
create policy "files_delete_admin" on storage.objects for delete
  using (bucket_id = 'project-files' and is_admin());
