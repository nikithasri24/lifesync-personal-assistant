-- tables
create table if not exists institutions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  logo_url text
);

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  institution_id uuid references institutions(id) on delete cascade,
  name text not null,
  type text check (type in ('checking','savings','credit','brokerage','loan','investment')) not null,
  balance numeric not null default 0,
  liability boolean not null default false,
  last_updated timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  parent_id uuid references categories(id),
  icon text,
  color text
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  account_id uuid references accounts(id) on delete cascade,
  date timestamptz not null,
  description text not null,
  category_id uuid references categories(id),
  amount numeric not null,
  type text check (type in ('debit','credit')) not null,
  notes text
);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  category_id uuid references categories(id) on delete cascade,
  month char(7) not null,
  limit_amount numeric not null
);

create table if not exists networth (
  user_id uuid not null,
  month char(7) not null,
  assets numeric not null,
  liabilities numeric not null,
  primary key (user_id, month)
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  target_amount numeric not null,
  current_amount numeric not null default 0,
  due_date date not null,
  type text check (type in ('savings','debt')) not null,
  linked_category_id uuid references categories(id)
);

-- RLS
alter table institutions enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table networth enable row level security;
alter table goals enable row level security;

-- simple per-user policy (supabase auth uid())
create policy if not exists "own_rows_select" on institutions for select using (auth.uid() = user_id);
create policy if not exists "own_rows_crud"   on institutions for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);

do $$
declare t text;
begin
  foreach t in array ['accounts','categories','transactions','budgets','networth','goals'] loop
    execute format('create policy if not exists "own_rows_select" on %I for select using (auth.uid() = user_id);', t);
    execute format('create policy if not exists "own_rows_crud"   on %I for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
  end loop;
end $$;

-- helpful indexes
create index if not exists idx_txn_user_date on transactions(user_id, date desc);
create index if not exists idx_txn_user_category on transactions(user_id, category_id);
create index if not exists idx_budget_user_month on budgets(user_id, month);
create index if not exists idx_networth_user_month on networth(user_id, month);

