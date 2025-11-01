-- Extende profiles (assumindo id = auth.uid())
alter table profiles
add column if not exists full_name text,
add column if not exists onboarding_completed boolean default false,
add column if not exists teaching_grade_levels text[];

-- Catálogos
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  state text,
  unique(name, city, state)
);

-- Relações do professor
create table if not exists teacher_subjects (
  profile_id uuid not null references profiles(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete restrict,
  primary key (profile_id, subject_id)
);

create table if not exists teacher_schools (
  profile_id uuid not null references profiles(id) on delete cascade,
  school_id uuid not null references schools(id) on delete restrict,
  shift text check (shift in ('manhã','tarde','noite')) default 'manhã',
  primary key (profile_id, school_id)
);

-- Seeds básicos de subjects
insert into subjects (name)
select x from unnest(array[
  'Geografia','História','Português','Matemática','Ciências','Inglês','Artes',
  'Educação Física','Física','Química','Biologia','Filosofia','Sociologia'
]) as t(x)
on conflict (name) do nothing;

-- RLS
alter table schools enable row level security;
alter table teacher_subjects enable row level security;
alter table teacher_schools enable row level security;
alter table profiles enable row level security;

-- schools: leitura pública, escrita via app
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename='schools' and policyname='public read schools') then
    create policy "public read schools" on schools for select using (true);
  end if;
end $$;

-- profiles: dono lê/atualiza o próprio registro
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='own profile') then
    create policy "own profile" on profiles
      for select using (id = auth.uid())
      with check (id = auth.uid());
    create policy "own profile update" on profiles
      for update using (id = auth.uid())
      with check (id = auth.uid());
  end if;
end $$;

-- teacher_*: somente do dono
do $$ begin
  if not exists (select 1 from pg_policies where policyname='own teacher_subjects') then
    create policy "own teacher_subjects" on teacher_subjects
      for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where policyname='own teacher_schools') then
    create policy "own teacher_schools" on teacher_schools
      for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
  end if;
end $$;

-- RPC helper opcional para upsert de schools
create or replace function upsert_school(p_name text, p_city text, p_state text)
returns schools as $$
declare rec schools;
begin
  insert into schools(name, city, state)
  values (p_name, p_city, p_state)
  on conflict (name, city, state) do update set name = excluded.name
  returning * into rec;
  return rec;
end;
$$ language plpgsql security definer;
