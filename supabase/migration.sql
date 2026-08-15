-- Users table (extends Supabase auth.users)
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.users enable row level security;

create policy "Users can read own data" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own data" on public.users
  for update using (auth.uid() = id);

-- Auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Generations table
create table if not exists public.generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  original_file_url text,
  original_file_type text,
  transcript text,
  caption text,
  hashtags text[],
  cta text,
  image_prompt text,
  image_url text,
  settings jsonb,
  folder_id uuid references public.folders on delete set null,
  created_at timestamptz default now()
);

alter table public.generations enable row level security;

create policy "Users can read own generations" on public.generations
  for select using (auth.uid() = user_id);

create policy "Users can insert own generations" on public.generations
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own generations" on public.generations
  for delete using (auth.uid() = user_id);

create policy "Users can update own generations" on public.generations
  for update using (auth.uid() = user_id);

-- User settings table
create table if not exists public.user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade unique not null,
  default_language text default 'English',
  default_tone text default 'Casual',
  default_length text default 'Medium',
  generate_image boolean default false,
  default_image_style text default 'Modern',
  default_aspect_ratio text default '4:5',
  default_hashtags boolean default true,
  default_emojis boolean default false,
  default_cta boolean default false,
  generate_video boolean default false,
  default_image_model text default 'flux',
  default_caption_model text default 'gemini-flash',
  image_count integer default 3
);

alter table public.user_settings enable row level security;

create policy "Users can read own settings" on public.user_settings
  for select using (auth.uid() = user_id);

create policy "Users can insert own settings" on public.user_settings
  for insert with check (auth.uid() = user_id);

create policy "Users can update own settings" on public.user_settings
  for update using (auth.uid() = user_id);

-- Folders table
create table if not exists public.folders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

alter table public.folders enable row level security;

create policy "Users can read own folders" on public.folders
  for select using (auth.uid() = user_id);

create policy "Users can insert own folders" on public.folders
  for insert with check (auth.uid() = user_id);

create policy "Users can update own folders" on public.folders
  for update using (auth.uid() = user_id);

create policy "Users can delete own folders" on public.folders
  for delete using (auth.uid() = user_id);

-- Caption templates table
create table if not exists public.caption_templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  name text not null,
  tone text not null default 'Casual',
  length text not null default 'Medium',
  language text not null default 'English',
  include_hashtags boolean not null default true,
  include_emojis boolean not null default false,
  include_cta boolean not null default false,
  instructions text default '',
  is_starter boolean not null default false,
  created_at timestamptz default now()
);

alter table public.caption_templates enable row level security;

create policy "Users can read own templates" on public.caption_templates
  for select using (auth.uid() = user_id);

create policy "Users can insert own templates" on public.caption_templates
  for insert with check (auth.uid() = user_id);

create policy "Users can update own templates" on public.caption_templates
  for update using (auth.uid() = user_id);

create policy "Users can delete own templates" on public.caption_templates
  for delete using (auth.uid() = user_id);

-- Storage buckets
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('generated-images', 'generated-images', false)
on conflict (id) do nothing;

-- Storage policies: users can manage their own files
create policy "Users can upload own files" on storage.objects
  for insert with check (
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own files" on storage.objects
  for select using (
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own files" on storage.objects
  for delete using (
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add pinning support to generations
alter table public.generations add column if not exists is_pinned boolean default false;
