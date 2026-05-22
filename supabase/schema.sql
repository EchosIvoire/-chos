-- SOLEA — Schéma PostgreSQL (Supabase)
-- Exécuter dans l'éditeur SQL Supabase

-- Extensions
create extension if not exists "uuid-ossp";

-- ─── ARTISANS ────────────────────────────────────────────────────────────────
create table artisans (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null unique,
  name        text not null,
  siret       text,
  phone       text,
  email       text,
  address     text,
  trade       text not null default 'plombier',
  tva_intra   text,
  created_at  timestamptz default now()
);

alter table artisans enable row level security;
create policy "Artisan voit son profil" on artisans
  for all using (auth.uid() = user_id);

-- ─── CLIENTS ─────────────────────────────────────────────────────────────────
create table clients (
  id          uuid primary key default uuid_generate_v4(),
  artisan_id  uuid references artisans(id) on delete cascade not null,
  name        text not null,
  email       text,
  phone       text,
  address     text,
  created_at  timestamptz default now()
);

alter table clients enable row level security;
create policy "Artisan voit ses clients" on clients
  for all using (
    artisan_id in (select id from artisans where user_id = auth.uid())
  );

-- ─── DOCUMENTS (devis + factures) ────────────────────────────────────────────
create table documents (
  id          uuid primary key default uuid_generate_v4(),
  artisan_id  uuid references artisans(id) on delete cascade not null,
  client_id   uuid references clients(id) on delete set null,
  type        text not null check (type in ('devis','facture')),
  status      text not null default 'draft'
                check (status in ('draft','sent','signed','paid','late','cancelled')),
  number      text not null,
  tva_rate    numeric(4,1) not null default 10,
  acompte_pct integer not null default 0,
  urgence     boolean not null default false,
  note        text,
  signed_at   timestamptz,
  sent_at     timestamptz,
  paid_at     timestamptz,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table documents enable row level security;
create policy "Artisan voit ses documents" on documents
  for all using (
    artisan_id in (select id from artisans where user_id = auth.uid())
  );

-- ─── LIGNES ──────────────────────────────────────────────────────────────────
create table lignes (
  id          uuid primary key default uuid_generate_v4(),
  document_id uuid references documents(id) on delete cascade not null,
  label       text not null,
  unit        text not null default 'forfait',
  price_ht    numeric(10,2) not null,
  qty         numeric(8,2) not null default 1,
  remise      numeric(4,1) not null default 0,
  cat         text not null default 'Forf'
                check (cat in ('MO','Four','Forf','Custom')),
  is_mo       boolean not null default false,
  position    integer not null default 0
);

alter table lignes enable row level security;
create policy "Artisan voit ses lignes" on lignes
  for all using (
    document_id in (
      select id from documents where artisan_id in (
        select id from artisans where user_id = auth.uid()
      )
    )
  );

-- ─── CATALOGUE PERSONNALISÉ ───────────────────────────────────────────────────
create table catalogue (
  id          uuid primary key default uuid_generate_v4(),
  artisan_id  uuid references artisans(id) on delete cascade not null,
  label       text not null,
  unit        text not null default 'forfait',
  price_ht    numeric(10,2) not null,
  cat         text not null check (cat in ('MO','Four','Forf')),
  trade       text not null,
  created_at  timestamptz default now()
);

alter table catalogue enable row level security;
create policy "Artisan voit son catalogue" on catalogue
  for all using (
    artisan_id in (select id from artisans where user_id = auth.uid())
  );

-- ─── TRIGGER updated_at ──────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger documents_updated_at
  before update on documents
  for each row execute function update_updated_at();

-- ─── FONCTION: prochain numéro de document ────────────────────────────────────
create or replace function next_document_number(p_artisan_id uuid, p_type text)
returns text language plpgsql as $$
declare
  v_year text := extract(year from now())::text;
  v_count integer;
begin
  select count(*) into v_count
  from documents
  where artisan_id = p_artisan_id
    and type = p_type
    and extract(year from created_at) = extract(year from now());
  return v_year || '-' || lpad((v_count + 1)::text, 2, '0');
end;
$$;
