-- 価格を「上書き」ではなく日付ごとの履歴として保持できるように
-- investment_prices テーブルを追加し、investments からは price 列を廃止する。
-- Supabaseダッシュボードの SQL Editor で実行してください。

create table if not exists public.investment_prices (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments (id) on delete cascade,
  price numeric(15, 2) not null, -- その日付時点の価格
  priced_on date not null default current_date, -- 価格の基準日
  created_at timestamptz not null default now()
);

create index if not exists investment_prices_investment_id_idx on public.investment_prices (investment_id);

-- 行レベルセキュリティ（RLS）を有効化する
alter table public.investment_prices enable row level security;

grant select, insert, delete on public.investment_prices to authenticated;

-- 自分が保有する銘柄の価格履歴のみ閲覧できる
create policy investment_prices_select_own
  on public.investment_prices
  for select
  to authenticated
  using (
    exists (
      select 1 from public.investments i
      where i.id = investment_prices.investment_id
        and i.user_id = auth.uid()
    )
  );

-- 自分が保有する銘柄にのみ価格履歴を追加できる
create policy investment_prices_insert_own
  on public.investment_prices
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.investments i
      where i.id = investment_prices.investment_id
        and i.user_id = auth.uid()
    )
  );

-- 銘柄削除時に価格履歴も連動して削除できるようにする（RLSはON DELETE CASCADEにも適用されるため必要）
create policy investment_prices_delete_own
  on public.investment_prices
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.investments i
      where i.id = investment_prices.investment_id
        and i.user_id = auth.uid()
    )
  );

-- 既存のinvestments.priceを初回の価格履歴として移行する
insert into public.investment_prices (investment_id, price, priced_on)
select id, price, registered_on
from public.investments
where price is not null;

-- investments テーブルからは price 列を削除する（価格はinvestment_pricesで一元管理する）
alter table public.investments drop column if exists price;
