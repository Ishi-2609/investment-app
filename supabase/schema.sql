-- 投資管理アプリ用の investments（銘柄）テーブルを作成する
-- Supabaseダッシュボードの SQL Editor で実行してください。

create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  -- 登録したユーザーのID（auth.usersを参照し、ユーザー削除時は連動して削除する）
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  symbol text not null, -- 銘柄
  price numeric(15, 2) not null, -- 価格（円）
  registered_on date not null default current_date, -- 登録日
  created_at timestamptz not null default now()
);

-- user_idでの絞り込みを高速化するインデックス
create index if not exists investments_user_id_idx on public.investments (user_id);

-- 行レベルセキュリティ（RLS）を有効化する
alter table public.investments enable row level security;

-- authenticatedロールにテーブル操作権限を付与する（実際の可否はRLSポリシーで制御される）
grant select, insert, update, delete on public.investments to authenticated;

-- 自分が登録した銘柄のみ閲覧できる
create policy investments_select_own
  on public.investments
  for select
  to authenticated
  using (auth.uid() = user_id);

-- 自分のuser_idとしてのみ新規登録できる
create policy investments_insert_own
  on public.investments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 自分が登録した銘柄のみ更新できる
create policy investments_update_own
  on public.investments
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 自分が登録した銘柄のみ削除できる
create policy investments_delete_own
  on public.investments
  for delete
  to authenticated
  using (auth.uid() = user_id);
