-- investmentsテーブルに「通貨」「投資先」列を追加する
-- Supabaseダッシュボードの SQL Editor で実行してください。

alter table public.investments
  add column if not exists currency text not null default 'JPY',
  add column if not exists region text not null default '日本';

-- 通貨は JPY / USD / EUR / その他 のいずれかに限定する
alter table public.investments
  add constraint investments_currency_check
  check (currency in ('JPY', 'USD', 'EUR', 'その他'));

-- 投資先は 日本 / 米国 / 他先進国 / 新興国 のいずれかに限定する
alter table public.investments
  add constraint investments_region_check
  check (region in ('日本', '米国', '他先進国', '新興国'));
